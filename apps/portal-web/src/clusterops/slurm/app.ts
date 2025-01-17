import { sftpChmod, sftpExists, sftpReaddir, sftpReadFile, sftpRealPath, sftpWriteFile } from "@scow/lib-ssh";
import { randomUUID } from "crypto";
import fs from "fs";
import { join } from "path";
import { AppOps, AppSession } from "src/clusterops/api/app";
import { displayIdToPort } from "src/clusterops/slurm/bl/port";
import { RunningJob } from "src/generated/common/job";
import { runtimeConfig } from "src/utils/config";
import { getClusterLoginNode, loggedExec, sshConnect } from "src/utils/ssh";
import { parseDisplayId, refreshPassword, VNCSERVER_BIN_PATH } from "src/utils/turbovnc";

import { querySqueue } from "./bl/queryJobInfo";
import { generateJobScript, parseSbatchOutput } from "./bl/submitJob";

interface SessionMetadata {
  sessionId: string;
  jobId: number;
  appId: string;
  submitTime: string;
}

const SERVER_ENTRY_COMMAND = fs.readFileSync("assets/slurm/server_entry.sh", { encoding: "utf-8" });
const VNC_ENTRY_COMMAND = fs.readFileSync("assets/slurm/vnc_entry.sh", { encoding: "utf-8" });

const VNC_OUTPUT_FILE = "output";

const SESSION_METADATA_NAME = "session.json";

const SERVER_SESSION_INFO = "SERVER_SESSION_INFO";
const VNC_SESSION_INFO = "VNC_SESSION_INFO";

export const slurmAppOps = (cluster: string): AppOps => {

  const host = getClusterLoginNode(cluster);

  if (!host) { throw new Error(`Cluster ${cluster} has no login node`); }

  return {
    createApp: async (request, logger) => {
      const { appId, userId, account, coreCount, maxTime, partition, qos } = request;

      // prepare script file
      const appConfig = runtimeConfig.APPS[appId];

      if (!appConfig) { return { code: "APP_NOT_FOUND" };}

      const jobName = randomUUID();

      const workingDirectory = join(runtimeConfig.PORTAL_CONFIG.appJobsDir, jobName);

      return await sshConnect(host, userId, logger, async (ssh) => {

        // make sure workingDirectory exists.
        await ssh.mkdir(workingDirectory);

        const sftp = await ssh.requestSFTP();

        const submitAndWriteMetadata = async (script: string, env?: Record<string, string>) => {
          const remoteEntryPath = join(workingDirectory, "entry.sh");

          await sftpWriteFile(sftp)(remoteEntryPath, script);

          // submit entry.sh
          const { code, stderr, stdout } = await loggedExec(ssh, logger, false,
            "sbatch", [remoteEntryPath], { execOptions: { env: env as NodeJS.ProcessEnv } },
          );

          if (code !== 0) {
            return { code: "SBATCH_FAILED", message: stderr } as const;
          }

          // parse stdout output to get the job id
          const jobId = parseSbatchOutput(stdout);

          // write session metadata
          const metadata: SessionMetadata = {
            jobId,
            sessionId: jobName,
            submitTime: new Date().toISOString(),
            appId,
          };

          await sftpWriteFile(sftp)(join(workingDirectory, SESSION_METADATA_NAME), JSON.stringify(metadata));
          return { code: "OK", jobId, sessionId: metadata.sessionId } as const;
        };

        if (appConfig.type === "web") {
          await sftpWriteFile(sftp)(join(workingDirectory, "before.sh"), appConfig.web!.beforeScript);
          await sftpWriteFile(sftp)(join(workingDirectory, "script.sh"), appConfig.web!.script);

          const script = generateJobScript({
            jobName,
            command: SERVER_ENTRY_COMMAND,
            account: account,
            coreCount: coreCount,
            maxTime: maxTime,
            nodeCount: 1,
            partition: partition,
            workingDirectory,
            qos: qos,
            nodeList: appConfig.nodes?.join(","),
          });

          return await submitAndWriteMetadata(script, { SERVER_SESSION_INFO });
        } else {
          const xstartupPath = join(workingDirectory, "xstartup");
          await sftpWriteFile(sftp)(xstartupPath, appConfig.vnc!.xstartup);
          await sftpChmod(sftp)(xstartupPath, "755");

          const script = generateJobScript({
            jobName,
            command: VNC_ENTRY_COMMAND,
            account: account,
            coreCount: coreCount,
            maxTime: maxTime,
            nodeCount: 1,
            partition: partition,
            workingDirectory,
            qos: qos,
            output: VNC_OUTPUT_FILE,
            nodeList: appConfig.nodes?.join(","),
          });

          return await submitAndWriteMetadata(script, { VNC_SESSION_INFO, VNCSERVER_BIN_PATH });
        }

      });
    },

    getAppSessions: async (request, logger) => {
      const { userId } = request;

      return await sshConnect(host, userId, logger, async (ssh) => {
        const sftp = await ssh.requestSFTP();

        if (!await sftpExists(sftp, runtimeConfig.PORTAL_CONFIG.appJobsDir)) { return { sessions: []}; }

        const list = await sftpReaddir(sftp)(runtimeConfig.PORTAL_CONFIG.appJobsDir);

        // using squeue to get jobs that are running
        // If a job is not running, it cannot be ready
        const runningJobsInfo = await querySqueue(ssh, logger, ["-u", userId]);

        const runningJobInfoMap = runningJobsInfo.reduce((prev, curr) => {
          prev[curr.jobId] = curr;
          return prev;
        }, {} as Record<number, RunningJob>);

        const sessions = [] as AppSession[];

        await Promise.all(list.map(async ({ filename }) => {
          const jobDir = join(runtimeConfig.PORTAL_CONFIG.appJobsDir, filename);
          const metadataPath = join(jobDir, SESSION_METADATA_NAME);

          if (!await sftpExists(sftp, metadataPath)) {
            return;
          }

          const content = await sftpReadFile(sftp)(metadataPath);
          const sessionMetadata = JSON.parse(content.toString()) as SessionMetadata;

          const runningJobInfo: RunningJob | undefined = runningJobInfoMap[sessionMetadata.jobId];

          const app = runtimeConfig.APPS[sessionMetadata.appId];

          let ready = false;

          // judge whether the app is ready
          if (runningJobInfo && runningJobInfo.state === "RUNNING") {
            if (app.type === "web") {
            // for server apps,
            // try to read the SESSION_INFO file to get port and password
              const infoFilePath = join(jobDir, SERVER_SESSION_INFO);
              ready = await sftpExists(sftp, infoFilePath);

            } else {
            // for vnc apps,
            // try to find the output file and try to parse the display number
              const outputFilePath = join(jobDir, VNC_OUTPUT_FILE);

              if (await sftpExists(sftp, outputFilePath)) {
                const content = (await sftpReadFile(sftp)(outputFilePath)).toString();
                try {
                  parseDisplayId(content);
                  ready = true;
                } catch {
                // ignored if displayId cannot be parsed
                }
              }
            }
          }

          sessions.push({
            jobId: sessionMetadata.jobId,
            appId: sessionMetadata.appId,
            sessionId: sessionMetadata.sessionId,
            submitTime: sessionMetadata.submitTime,
            state: runningJobInfo?.state ?? "ENDED",
            ready,
            dataPath: await sftpRealPath(sftp)(jobDir),
          });

        }));

        return { sessions };
      });
    },

    connectToApp: async (request, logger) => {
      const { sessionId, userId } = request;

      return await sshConnect(host, userId, logger, async (ssh) => {
        const sftp = await ssh.requestSFTP();

        const jobDir = join(runtimeConfig.PORTAL_CONFIG.appJobsDir, sessionId);

        if (!await sftpExists(sftp, jobDir)) {
          return { code: "NOT_FOUND" };
        }

        const metadataPath = join(jobDir, SESSION_METADATA_NAME);
        const content = await sftpReadFile(sftp)(metadataPath);
        const sessionMetadata = JSON.parse(content.toString()) as SessionMetadata;

        const app = runtimeConfig.APPS[sessionMetadata.appId];

        if (app.type === "web") {
          const infoFilePath = join(jobDir, SERVER_SESSION_INFO);
          if (await sftpExists(sftp, infoFilePath)) {
            const content = (await sftpReadFile(sftp)(infoFilePath)).toString();

            // FORMAT: HOST\nPORT\nPASSWORD

            const [host, port, password] = content.split("\n");

            return { code: "OK", appId: sessionMetadata.appId, host, port: +port, password };
          }
        } else {
          // for vnc apps,
          // try to find the output file and try to parse the display number
          const vncSessionInfoPath = join(jobDir, VNC_SESSION_INFO);

          // try to read the host info
          if (await sftpExists(sftp, vncSessionInfoPath)) {

            const host = (await sftpReadFile(sftp)(vncSessionInfoPath)).toString().trim();

            const outputFilePath = join(jobDir, VNC_OUTPUT_FILE);
            if (await sftpExists(sftp, outputFilePath)) {

              const content = (await sftpReadFile(sftp)(outputFilePath)).toString();

              let displayId: number | undefined = undefined;
              try {
                displayId = parseDisplayId(content);
              } catch {
                // ignored if displayId cannot be parsed
              }

              if (displayId) {
                // the server is run at the compute node
                // login to the compute node and refresh the password
                return await sshConnect(host, userId, logger, async (computeNodeSsh) => {
                  const password = await refreshPassword(computeNodeSsh, logger, displayId!);
                  return {
                    code: "OK",
                    appId: sessionMetadata.appId,
                    host,
                    port: displayIdToPort(displayId!),
                    password,
                  };
                });
              }
            }
          }
        }
        return { code: "UNAVAILABLE" };

      });
    },
  };
};

