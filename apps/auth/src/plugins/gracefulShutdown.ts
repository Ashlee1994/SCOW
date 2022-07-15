import gracefulShutdown from "fastify-graceful-shutdown";
import fp from "fastify-plugin";

export const gracefulShutdownPlugin = fp(async (f) => {

  f.register(gracefulShutdown);

  f.addHook("onClose", () => {
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("SIGINT");
  });

});
