import { plugin } from "@ddadaal/tsgrpc-server";
import { ServiceError, status } from "@grpc/grpc-js";
import path from "path";
import { checkClusterExistence, clustersConfig  } from "src/config/clusters";
import { config } from "src/config/env";
import { ListDesktopsReply_Connection, VncServiceServer, VncServiceService } from "src/generated/portal/vnc";
import { loggedExec } from "src/plugins/ssh";
import { displayIdToPort } from "src/utils/port";
import { parseDisplayId, parseListOutput, parseOtp, refreshPassword } from "src/utils/turbovnc";



const vncServerPath = path.join(config.TURBOVNC_PATH, "bin", "vncserver");

export const vncServiceServer = plugin((server) => {

  async function asyncForEach<T>(array: T[], callback: (arg: T) => Promise<void>): Promise<void> {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index]);
    }
  }

  server.addService<VncServiceServer>(VncServiceService, {
    launchDesktop: async ({ request, logger }) => {
      const { cluster, username, displayId } = request;

      checkClusterExistence(cluster);
      const node = clustersConfig[cluster].loginNodes[0];

      return await server.ext.connect(node, username, logger, async (ssh, nodeAddr) => {

        // refresh the otp
        const password = await refreshPassword(ssh, logger, displayId);

        return [{ node: nodeAddr, port: displayIdToPort(displayId), password }];
      });
    },

    listDesktops: async ({ request, logger }) => {
      const { clusters, username } = request;

      const connectList: ListDesktopsReply_Connection[] = [];

      await asyncForEach(clusters, async (clusterId) => {

        checkClusterExistence(clusterId);

        const node = clustersConfig[clusterId].loginNodes[0];

        await server.ext.connect(node, username, logger, async (ssh, nodeAddr) => {

          // list all running session
          const resp = await loggedExec(ssh, logger, true,
            vncServerPath, ["-list"],
          );

          const ids = parseListOutput(resp.stdout);

          connectList.push({
            node: nodeAddr,
            cluster: clusterId,
            displayId: ids,
          });
        });
      });
      return [{ connections: connectList }];
    },

    createDesktop: async ({ request, logger }) => {
      const { cluster, username } = request;

      checkClusterExistence(cluster);
      const node = clustersConfig[cluster].loginNodes[0];

      return await server.ext.connect(node, username, logger, async (ssh, nodeAddr) => {

        // find if the user has running session
        let resp = await loggedExec(ssh, logger, true,
          vncServerPath, ["-list"],
        );

        const ids = parseListOutput(resp.stdout);
        if (ids.length < config.MAX_DISPLAY) {
          // start a session
          resp = await loggedExec(ssh, logger, true,
            // explicitly set securitytypes to avoid requiring setting vnc passwd
            // TODO adds more desktop supprt other than xfce
            vncServerPath, ["-securitytypes", "OTP", "-otp", "-wm", "xfce"]);

          // parse the OTP from output. the output was in stderr
          const password = parseOtp(resp.stderr, logger);
          // parse display id from output
          const displayId = parseDisplayId(resp.stderr, logger);

          const port = displayIdToPort(displayId);

          return [{ node: nodeAddr, password, port }];
        } else {
          throw <ServiceError> {
            code: status.RESOURCE_EXHAUSTED,
            message: "VNC desktop has exceeded the maximum",
            details: `${config.MAX_DISPLAY}`,
          };
        }
      });
    },

    killDesktop: async ({ request, logger }) => {
      const { cluster, username, displayId } = request;

      checkClusterExistence(cluster);
      const node = clustersConfig[cluster].loginNodes[0];

      return await server.ext.connect(node, username, logger, async (ssh) => {

        // kill specific desktop
        await loggedExec(ssh, logger, true,
          vncServerPath, ["-kill", ":" + displayId]);

        return [ {} ];
      });

    },

    refreshOTPPassword: async ({ request, logger }) => {
      const { displayId, node, username } = request;

      return await server.ext.connect(node, username, logger, async (ssh) => {
        const password = await refreshPassword(ssh, logger, displayId);

        return [{ password }];
      });

    },
  });
});
