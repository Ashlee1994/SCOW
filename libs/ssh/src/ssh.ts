import { NodeSSH, SSHExecCommandOptions } from "node-ssh";
import type { Logger } from "pino";
import { quote } from "shell-quote";

import { insertKey, KeyPair } from "./key";

/**
 * Connect to SSH and returns the SSH Object
 * Must dispose of the object after use
 *
 * If the username is not root and first login attempt failed,
 * it inserts the public key into the user's authorized_key and logs in again
 *
 * @param addr address
 * @param username  username
 * @param rootKeyPair the ssh key pair of root user
 * @param logger logger
 * @returns SSH Object
 */
export async function sshRawConnect(address: string, username: string, rootKeyPair: KeyPair, logger: Logger) {
  const [host, port] = address.split(":");
  const ssh = new NodeSSH();

  async function connect() {
    await ssh.connect({ host, port: port ? +port : undefined, username, privateKey: rootKeyPair.privateKey });
  }

  try {
    await connect();
  } catch (e) {
    if (username === "root") {
      logger.info("Login to %s as %s failed.", host, username);
      throw e;
    }

    logger.info("Login to %s as %s failed. Try inserting public key", host, username);
    await insertKey(username, address, rootKeyPair, logger);
    await connect();
  }

  return ssh;
}

export async function sshConnect<T>(
  address: string, username: string, rootKeyPair: KeyPair, logger: Logger,
  run: (ssh: NodeSSH) => Promise<T>,
) {
  const ssh = await sshRawConnect(address, username, rootKeyPair, logger);

  return run(ssh).finally(() => { ssh.dispose();});
}

/**
 * Construct a command with env prefixes.
 * Some OpenSSH servers don't accept envs
 * This is a workaround by combining the envs to the command
 * @param cmd the command
 * @param parameters the command parameters
 * @param env env
 * @returns command with env prefixes
 */
export function constructCommand(cmd: string, parameters: readonly string[], env?: Record<string, string>) {

  const command = cmd + (parameters.length > 0 ? (" " + quote(parameters)) : "");

  const envPrefix = env ? Object.keys(env).map((x) => `${x}=${quote([env[x] ?? ""])} `).join("") : "";

  return envPrefix + command;
}

export async function loggedExec(ssh: NodeSSH, logger: Logger, throwIfFailed: boolean,
  cmd: string, parameters: string[], options?: SSHExecCommandOptions) {

  const env = options?.execOptions?.env as Record<string, string>;

  const command = constructCommand(cmd, parameters, env);

  const resp = await ssh.execCommand(command, options);

  if (resp.code !== 0) {
    logger.error("Command %o failed. stdout %s, stderr %s", command, resp.stdout, resp.stderr);
    if (throwIfFailed) {
      throw new Error("");
    }
  } else {
    logger.debug("Command %o completed. stdout %s, stderr %s", command, resp.stdout, resp.stderr);
  }
  return resp;
}

/**
 * Check if the root user can log in to the host
 * If fails, return the error
 *
 * @param host the host
 * @param keyPair key pair
 * @param logger logger
 * @returns the error if login failed
 */
export async function testRootUserSshLogin(host: string, keyPair: KeyPair, logger: Logger) {
  return await sshConnect(host, "root", keyPair, logger, async () => undefined).catch((e) => e);

}
