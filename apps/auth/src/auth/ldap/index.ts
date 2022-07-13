import { parsePlaceholder } from "@scow/config";
import { FastifyInstance } from "fastify";
import ldapjs from "ldapjs";
import { AuthProvider } from "src/auth/AuthProvider";
import { extractUserInfoFromEntry, findUser, searchOne, useLdap } from "src/auth/ldap/helpers";
import { serveLoginHtml } from "src/auth/ldap/loginHtml";
import { modifyPassword, modifyPasswordAsSelf } from "src/auth/ldap/password";
import { registerPostHandler } from "src/auth/ldap/postHandler";
import { AuthConfig } from "src/config/auth";
import { promisify } from "util";

export const createLdapAuthProvider = (f: FastifyInstance) => {


  if (AuthConfig.type !== "ldap") { throw new Error("auth type is not ldap"); }

  const ldapConfig = AuthConfig.ldap;

  registerPostHandler(f, ldapConfig);

  return <AuthProvider>{
    serveLoginHtml: (callbackUrl, req, rep) => serveLoginHtml(false, callbackUrl, req, rep),
    fetchAuthTokenInfo: async () => undefined,
    validateName: async (identityId, name, req) => {
      // Use LDAP to query a user with identityId and name
      return useLdap(req.log, ldapConfig, { dn: ldapConfig.bindDn, password: ldapConfig.bindPassword })(
        async (client) => {
          const user = await searchOne(req.log, ldapConfig, client, ldapConfig.searchBase,
            {
              scope: "sub",
              filter: new ldapjs.AndFilter({
                filters: [
                  ldapjs.parseFilter(ldapConfig.filter),
                  new ldapjs.EqualityFilter({
                    attribute: ldapConfig.attrs.uid,
                    value: identityId,
                  }),
                ],
              }),
            }, extractUserInfoFromEntry,
          );

          if (!user) {
            return "NotFound";
          }

          if (user.name !== name) {
            return "NotMatch";
          }

          return "Match";
        });
    },
    createUser: async (info, req) => {
      const id = info.id + ldapConfig.addUserBase;

      await useLdap(req.log, ldapConfig, { dn: ldapConfig.bindDn, password: ldapConfig.bindPassword })(
        async (client) => {
          const peopleDn = `${ldapConfig.attrs.uid}=${info.identityId},${ldapConfig.addUserBase}`;
          const peopleEntry: Record<string, string | string[] | number> = {
            [ldapConfig.attrs.uid]: info.identityId,
            [ldapConfig.attrs.name]: info.name,
            sn: info.identityId,
            loginShell: "/bin/bash",
            objectClass: ["inetOrgPerson", "posixAccount", "shadowAccount"],
            homeDirectory: parsePlaceholder(ldapConfig.addHomeDir, { userId: info.identityId }),
            uidNumber: id,
            gidNumber: id,
          };

          if (ldapConfig.attrs.mail) {
            peopleEntry[ldapConfig.attrs.mail] = info.mail;
          }

          // parse attributes
          for (const key in ldapConfig.attrs.extras) {
            const value = ldapConfig.attrs.extras[key];
            if (Array.isArray(value)) {
              peopleEntry[key] = value.map((x) => parsePlaceholder(x, peopleEntry));
            } else {
              peopleEntry[key] = parsePlaceholder(value, peopleEntry);
            }
          }

          const groupDn = `${ldapConfig.attrs.groupUserId}=${info.identityId},${ldapConfig.addGroupBase}`;
          const groupEntry = {
            objectClass: ["posixGroup"],
            memberUid: info.identityId,
            gidNumber: id,
          };

          const add = promisify(client.add.bind(client));

          req.log.info("Adding people %s with entry info %o", peopleDn, peopleEntry);
          await add(peopleDn, peopleEntry);

          req.log.info("Adding group %s with entry info %o", groupDn, groupEntry);
          await add(groupDn, groupEntry);

          // set password as admin user
          await modifyPassword(peopleDn, undefined, info.password, client);

          if (ldapConfig.addUserToGroup) {
          // get existing members
            req.log.info("Adding %s to group %s", peopleDn, ldapConfig.addUserToGroup);

            const members = await searchOne(req.log, ldapConfig, client, ldapConfig.addUserToGroup, {
              attributes: ["member"],
            },  (entry) => {
              const member = entry.attributes.find((x) => x.json.type === "member");
              if (!member) {
                return undefined;
              }

              return { members: member.json.vals };
            });

            if (!members) {
              req.log.error("Didn't find group %s", ldapConfig.addUserToGroup);
              throw { code: "INTERNAL_ERROR" };
            }

            // add the dn of the new user to the value
            const modify = promisify(client.modify.bind(client));
            await modify(ldapConfig.addUserToGroup, new ldapjs.Change({
              operation: "add",
              modification: {
                "member": members.members.concat(peopleDn),
              },
            }));
          }


        });

      return "OK";
    },
    changePassword: async (id, oldPassword, newPassword, req) => {
      return useLdap(req.log, ldapConfig, { dn: ldapConfig.bindDn, password: ldapConfig.bindPassword })(
        async (client) => {
          const user = await findUser(req.log, ldapConfig, client, id);
          if (!user) {
            return "NotFound";
          }

          const result = await modifyPasswordAsSelf(req.log, ldapConfig, user.dn, oldPassword, newPassword);
          return result ? "OK" : "WrongOldPassword";
        },
      );
    },
  };

};
