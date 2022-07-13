import fp from "fastify-plugin";
import { AuthProvider } from "src/auth/AuthProvider";
import { createLdapAuthProvider } from "src/auth/ldap";
import { AuthConfig } from "src/config/auth";
import { config } from "src/config/env";

declare module "fastify" {
  interface FastifyInstance {
    auth: AuthProvider;
  }
}

const providers = {
  "ldap": createLdapAuthProvider,
} as const;

export const authPlugin = fp(async (f) => {

  const type = config.AUTH_TYPE ?? AuthConfig.type;

  const provider = providers[type];

  if (!provider) {
    throw new Error("Unknown auth type " + type);
  }

  f.decorate("auth", provider(f));
});
