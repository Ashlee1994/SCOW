import { AppConfigSchema } from "@scow/config/build/appConfig/app";
import type { ClusterConfigSchema } from "@scow/config/build/appConfig/cluster";
import type { PortalConfigSchema } from "@scow/config/build/appConfig/portal";
import type { UiConfigSchema } from "@scow/config/build/appConfig/ui";
import { CONFIG_BASE_PATH } from "@scow/config/build/constants";
import { KeyPair } from "@scow/lib-ssh";
import getConfig from "next/config";

export interface ServerRuntimeConfig {
  AUTH_EXTERNAL_URL: string;
  AUTH_INTERNAL_URL: string;

  SSH_PRIVATE_KEY_PATH: string;
  ROOT_KEY_PAIR: KeyPair;

  CLUSTERS_CONFIG: {[cluster: string]: ClusterConfigSchema};

  UI_CONFIG?: UiConfigSchema;

  PORTAL_CONFIG: PortalConfigSchema;

  DEFAULT_PRIMARY_COLOR: string;

  APPS: Record<string, AppConfigSchema>;

  MOCK_USER_ID: string | undefined;

  LOGIN_NODES: Record<string, string>;
}


export interface PublicRuntimeConfig {
  ENABLE_CHANGE_PASSWORD: boolean;

  ENABLE_SHELL: boolean;

  ENABLE_LOGIN_DESKTOP: boolean;
  LOGIN_DESKTOP_WMS: { name: string; wm: string }[];

  ENABLE_JOB_MANAGEMENT: boolean;

  ENABLE_APPS: boolean;

  MIS_URL: string | undefined;

  DEFAULT_HOME_TEXT: string;
  HOME_TEXTS: {[hostname: string]: string };

  DEFAULT_HOME_TITLE: string;
  HOME_TITLES: {[hostname: string]: string };

  CLUSTERS_CONFIG: {[cluster: string]: ClusterConfigSchema};

  CLUSTERS: Cluster[];


  APPS: { id: string; name: string }[];

  SUBMIT_JOB_WORKING_DIR: string;

  PROXY_BASE_PATH: string;
}

export const runtimeConfig: ServerRuntimeConfig = getConfig().serverRuntimeConfig;
export const publicConfig: PublicRuntimeConfig = getConfig().publicRuntimeConfig;

export type Cluster = { id: string; name: string; }

export const CONFIG_PATH = process.env.NODE_ENV === "production" ? CONFIG_BASE_PATH : "config";

export function clusterConfigToCluster(id: string): Cluster | undefined {
  const config = publicConfig.CLUSTERS_CONFIG[id];

  return config ? { id, name: config.displayName } : undefined;
}
