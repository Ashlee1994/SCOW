import { FastifyInstance } from "fastify";
import { NoSuchObjectError } from "ldapjs";
import { buildApp } from "src/app";
import { findUser, useLdap } from "src/auth/ldap/helpers";
import { AuthConfig } from "src/config/auth";

let server: FastifyInstance;

beforeEach(async () => {
  server = await buildApp();

  await server.ready();
});

afterEach(async () => {
  await server.close();
});

it("creates user and group", async () => {

  const user = {
    mail: "test@test.com",
    id: 10,
    identityId: "123",
    name: "name",
    password: "12#",
  };

  const ldapConfig = AuthConfig.ldap;

  const userDn = `${ldapConfig.attrs.uid}=${user.identityId},${ldapConfig.addUserBase}`;
  const groupDn = `${ldapConfig.attrs.groupUserId}=${user.identityId},${ldapConfig.addGroupBase}`;

  await useLdap(server.log, ldapConfig, { dn: ldapConfig.bindDn, password: ldapConfig.bindPassword })(
    async (client) => {

      function removeEvenNotExist(dn: string) {
        return new Promise<void>((res, rej) => {
          client.del(dn, (err) => {
            if (err) {
              if (err instanceof NoSuchObjectError) {
                console.log("No entity with dn " + userDn);
              } else {
                rej(err);
              }
            }
            res();
          });
        });
      }

      const removeUser = async () => {
        await removeEvenNotExist(userDn);
        await removeEvenNotExist(groupDn);
      };

      // remove the user if exists
      await removeUser();

      try {

        const resp = await server.inject({
          method: "POST",
          url: "/user",
          payload: user,
        });

        expect(resp.statusCode).toBe(204);

        const ldapUser = await findUser(server.log, ldapConfig, client, user.identityId);
        expect(ldapUser).toBeDefined();

        expect(ldapUser).toEqual({
          dn: userDn,
          identityId: user.identityId,
          name: user.name,
        });
      } finally {
        await removeUser();
      }

    });
});
