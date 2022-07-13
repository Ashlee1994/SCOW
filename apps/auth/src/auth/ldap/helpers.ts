import { FastifyLoggerInstance } from "fastify";
import ldapjs from "ldapjs";
import { LdapConfigType } from "src/config/auth";
import { promisify } from "util";

export const useLdap = (
  logger: FastifyLoggerInstance,
  config: LdapConfigType,
  user: { dn: string, password: string },
) => {
  return async <T>(consume: (client: ldapjs.Client) => Promise<T>): Promise<T> => {
    const client = ldapjs.createClient(({ url: config.url, log: logger }));

    await promisify(client.bind.bind(client))(user.dn, user.password);

    return await consume(client).finally(() => {
      client.destroy();
    });
  };
};

export const searchOne = async <T>(
  logger: FastifyLoggerInstance,
  ldapConfig: LdapConfigType,
  client: ldapjs.Client,
  searchBase: string,
  searchOptions: ldapjs.SearchOptions,
  furtherCheck: (entry: ldapjs.SearchEntry, ldapConfig: LdapConfigType) => T | undefined,
) => {
  return new Promise<(T & { dn: string }) | undefined>((resolve, rej) => {

    client.search(searchBase, searchOptions, (err, res) => {

      if (err) { rej(err); return; }
      logger.info("Search started");

      let found = false;

      res.on("searchEntry", (entry) => {
        if (found) { return; }
        logger.info("Get an entry. %o", entry);

        const val = furtherCheck(entry, ldapConfig);

        if (!val) { return; }

        found = true;
        logger.info("Get an entry with valid info. dn: %s.", entry.dn);
        res.removeAllListeners();
        res.emit("end");
        resolve({ ...val, dn: entry.dn });
      });

      res.on("searchReference", (referral) => {
        logger.info("Get a referral: " + referral.uris.join());
      });

      res.on("error", (err) => {
        logger.error("Error. %o", err);
        rej(err);
      });

      res.on("end", (result) => {
        logger.info("Received end event. %o", result);
        if (result?.status === 0) {
          resolve(undefined);
        } else {
          rej(result?.errorMessage);
        }
      });
    });
  });
};

export const findUser = async (
  logger: FastifyLoggerInstance, config: LdapConfigType, client: ldapjs.Client, id: string,
) => {
  return await searchOne(logger, config, client, config.searchBase,
    {
      scope: "sub",
      filter: new ldapjs.AndFilter({
        filters: [
          ldapjs.parseFilter(config.filter),
          new ldapjs.EqualityFilter({
            attribute: config.attrs.uid,
            value: id,
          })],
      }),
    },  extractUserInfoFromEntry,
  );
};

export const extractUserInfoFromEntry = (entry: ldapjs.SearchEntry, config: LdapConfigType) => {
  const identityId = takeOne(entry.attributes.find((x) => x.json.type === config.attrs.uid)?.vals);
  const name = takeOne(entry.attributes.find((x) => x.json.type === config.attrs.name)?.vals);

  if (!identityId || !name) {
    return undefined;
  } else {
    return { identityId, name };
  }
};

function takeOne(val: string | string[] | undefined) {
  if (typeof val === "string") {
    return val;
  }
  if (val === undefined) {
    return undefined;
  }
  return val[0];
}
