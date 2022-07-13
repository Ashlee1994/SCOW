import { getConfigFromFile } from "@scow/config";
import { Static, Type } from "@sinclair/typebox";

export const LdapConfigSchema = Type.Object({
  url: Type.String({ description: "LDAP服务器地址" }),
  searchBase: Type.String({ description: "LDAP用户搜索base。认证类型为ldap必填" }),
  bindDn: Type.String({ description: "操作LDAP时以什么用户操作，默认为空字符串", default: "" }),
  bindPassword: Type.String({ description: "操作LDAP的用户的密码，默认为空字符串", default: "" }),
  filter: Type.String({ description: "LDAP用户筛选器。认证类型为ldap必填" }),
  addUserBase: Type.String({ description: "LDAP增加用户节点时，把用户增加到哪个节点下。认证类型为LDAP必填。" }),
  addGroupBase: Type.String({ description: "LDAP增加用户对应的组时，把组节点增加到哪个节点下。认证类型为LDAP必填。" }),
  addHomeDir: Type.String({ description: "LDAP增加用户时，用户的homeDirectory值。使用{userId}代替新用户的用户名", default: "/nfs/{userId}" }),
  addUserToGroup: Type.Optional(Type.String({ description: "LDAP增加用户时，应该把用户增加到哪个Group下。如果不填，创建用户后不会增加用户到Group" })),
  addUidStart: Type.Integer({
    description: "LDAP创建用户时，uid从多少开始。生成的用户的uid等于此值加上用户账户中创建的用户ID。创建的Group的gid和uid和此相同。",
    default: 66000,
  }),
  attrs: Type.Object({
    groupUserId: Type.String({ description: "LDAP中用户对应的组的实体表示用户ID的属性名" }),
    uid: Type.String({ description: "LDAP中对应用户的id的属性名。认证类型为ldap必填" }),
    name: Type.String({ description: `
        LDAP中对应用户的姓名的属性名。
        此字段用于在创建用户的时候把姓名信息填入LDAP，以及验证ID和姓名是否匹配。
        本系统返回的姓名总是以用户账户系统中保存的信息为准。
      ` }),
    mail: Type.Optional(Type.String({
      description: "LDAP中对应用户的邮箱的属性名。可不填。此字段只用于在创建用户的时候把邮件信息填入LDAP。",
    })),
    extras: Type.Optional(
      Type.Record(Type.String(), Type.Union([Type.String(), Type.Array(Type.String())]), {
        description: `
        LDAP增加用户时，用户项除了id、name和mail，还应该添加哪些属性。
        如果这里出现了uid, name或email同名的属性，这里的值将替代用户输入的值。
        属性值支持使用 {LDAP属性值key} 格式来使用用户填入的值。
        例如：{ sn: "{cn}" }，那么添加时将会增加一个sn项，其值为cn项，即为用户输入的姓名
        `,
      })),
  }),
});

export type LdapConfigType = Static<typeof LdapConfigSchema>;

export const AuthConfigSchema = Type.Object({
  redis: Type.Object({
    url: Type.String({ description: "redis地址，用于存放token" }),
  }),
  tokenTimeoutSeconds: Type.Integer({ description: "token失效时间，单位秒", default: 3600 }),
  type: Type.Enum({ ldap: "ldap" }, { description: "认证类型" }),
  ldap: Type.Optional(LdapConfigSchema),
});

// export const AuthConfigSchema = Type.Unsafe<Static<typeof InnerAuthConfigSchema>>({
//   ...InnerAuthConfigSchema,
//   discriminator: { propertyName: "type" },
// });


export const AuthConfigName = "auth";

export type AuthConfigType = Static<typeof AuthConfigSchema>;

export const AuthConfig = getConfigFromFile(AuthConfigSchema, AuthConfigName);
