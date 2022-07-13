import fp from "fastify-plugin";
import { AuthProvider } from "src/auth/AuthProvider";
import { createLdapAuthProvider } from "src/auth/ldap";
import { AuthConfig } from "src/config/auth";

declare module "fastify" {
  interface FastifyInstance {
    auth: AuthProvider;
  }
}

const providers = {
  "ldap": createLdapAuthProvider,
};

export const authPlugin = fp(async (f) => {

  const provider = providers[AuthConfig.type];

  f.decorate("auth", provider);
});
