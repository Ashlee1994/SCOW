import { route } from "@ddadaal/next-typed-api-routes-runtime";
import os from "os";
import { USE_MOCK } from "src/apis/useMock";
import { authenticate } from "src/auth/server";
import { createLogger } from "src/utils/log";
import { sftpRealPath } from "src/utils/sftp";
import { getClusterLoginNode, sshConnect } from "src/utils/ssh";

export interface GetHomeDirectorySchema {
  method: "GET";

  query: {
    cluster: string;
  }

  responses: {
    200: { path: string };
    400: { code: "INVALID_CLUSTER" };
  }
}

const auth = authenticate(() => true);

export default route<GetHomeDirectorySchema>("GetHomeDirectorySchema", async (req, res) => {
  const logger = createLogger();

  if (USE_MOCK) {
    return { 200: { path: os.homedir() } };
  }

  const info = await auth(req, res);

  if (!info) { return; }

  const { cluster } = req.query;

  const host = getClusterLoginNode(cluster);

  if (!host) {
    return { 400: { code: "INVALID_CLUSTER" } };
  }

  return await sshConnect(host, info.identityId, logger, async (ssh) => {
    const sftp = await ssh.requestSFTP();

    const path = await sftpRealPath(sftp)(".");

    return { 200: { path } };
  });


});
