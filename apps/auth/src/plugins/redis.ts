import fp from "fastify-plugin";
import Redis from "ioredis";
import { AuthConfig } from "src/config/auth";

export interface UserInfo {
  identityId: string;
}

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

export const redisPlugin = fp(async (f) => {

  const redis = new Redis(AuthConfig.redis.url);

  f.decorate("redis", redis);

  f.addHook("onClose", async () => {
    redis.disconnect();
  });

});
