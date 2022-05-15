import { plugin } from "@ddadaal/tsgrpc-server";
import { ServiceError } from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/build/src/constants";
import { StorageQuota } from "src/entities/StorageQuota";
import {
  StorageServiceClient,
} from "src/generated/clusterops/storage";
import { AdminServiceServer, AdminServiceService } from "src/generated/server/admin";

export const adminServiceServer = plugin((server) => {

  server.addService<AdminServiceServer>(AdminServiceService, {
    changeStorageQuota: async ({ request, em }) => {
      const { cluster, mode, userId, value } = request;

      const quota = await em.findOne(StorageQuota, {
        user: { userId }, cluster,
      });

      if (!quota) {
        throw <ServiceError>{
          code: Status.NOT_FOUND,
        };
      }

      const reply = await server.ext.clusters.callOnOne(
        cluster,
        StorageServiceClient,
        "changeStorageQuota",
        { mode, userId, value },
      );

      quota.storageQuota = reply.currentQuota;

      await em.flush();

      return [{ currentQuota: quota.storageQuota }];

    },

    queryStorageQuota: async ({ request, em }) => {
      const { cluster, userId } = request;

      const quota = await em.findOne(StorageQuota, {
        user: { userId }, cluster,
      });

      if (!quota) {
        throw <ServiceError>{
          code: Status.NOT_FOUND,
        };
      }

      return [{ currentQuota: quota.storageQuota }];
    },




  });
});