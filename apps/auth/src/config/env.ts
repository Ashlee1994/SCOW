import { envConfig, host, parseKeyValue, port, str } from "@scow/config";

export const AUTH_EXTERNAL_URL = "/auth";
export const AUTH_REDIRECT_URL = "/api/auth/callback";
export const FAVICON_URL = "/api/icon?type=favicon";

export const config = envConfig({
  HOST: host({ default: "0.0.0.0", desc: "监听地址" }),
  PORT: port({ default: 5000, desc: "监听端口" }),
  LOG_LEVEL: str({
    default: "info",
    desc: "日志等级",
  }),
  TEST_USERS: str({ desc: "测试用户，如果这些用户登录，将其ID改为另一个ID。格式：原用户ID=新用户ID,原用户ID=新用户ID。", default: "" }),

  FOOTER_TEXTS: str({ desc: "根据域名（从referer判断）不同，显示在footer上的文本。格式：域名=文本,域名=文本", default: "" }),
});

export const FOOTER_TEXTS = parseKeyValue(config.FOOTER_TEXTS);
