---
sidebar_position: 2
title: 配置Web类应用
---

# 配置Web类应用 

## 前提条件

请确保在需要运行应用的计算节点上安装有需要的软件包。

## 配置示例

下面以使用[coder/code-server](https://github.com/coder/code-server)启动VSCode的配置为例来讲解如何配置一个服务器类应用。

创建`config/apps`目录，在里面创建`vscode.yml`文件，其内容如下：

```yaml title="config/apps/vscode.yml"
# 这个应用的ID
id: vscode

# 这个应用的名字
name: VSCode

# 指定应用类型为web
type: web

# 可以运行这个应用的节点地址。
# 如果不设置nodes，则所有节点都可以运行
nodes:
  - t001
  - t002

# Web应用的配置
web:

  # 准备脚本
  beforeScript: |
    export PORT=$(get_port)
    export PASSWORD=$(get_password 12)

  # 运行任务的脚本。可以使用准备脚本定义的
  script: |
    PASSWORD=$PASSWORD code-server -vvv --bind-addr 0.0.0.0:$PORT --auth password

  # 如何连接应用
  connect:
    method: POST
    path: /login
    formData:
      password: "{{ PASSWORD }}"
```

增加了此文件后，运行以下命令重启job-server和portal-web即可

```bash
docker compose restart portal-web job-server
```

## 配置解释

### `beforeScript`和`script`

`beforeScript`部分为准备脚本。这个脚本用来准备运行任务的环境。这个脚本要求必须export两个变量：

- `PORT`：程序将会运行在的端口
- `PASSWORD`: 连接程序用的密码

准备脚本中的`export`的变量可以在`script`中使用。

`script`部分为如何启动这个应用的脚本。

`beforeScript`和`script`中可以使用以下辅助函数：

| 函数名         | 作用                            | 参数           | 返回值                  |
| -------------- | ------------------------------- | -------------- | ----------------------- |
| `get_port`     | 获得一个可用的TCP端口           | 无             | 一个调用时可用的TCP端口 |
| `get_password` | 生成一个包含A-Za-z0-9的随机密码 | `$1`: 密码长度 | 密码                    |

这些脚本，以及一些辅助的脚本将会被作为一个作业提交给调度系统，并最终在某个计算节点上运行。

### `connect`

`connect`部分定义如何连接到应用。我们推荐将应用使用密码方式进行加密，所以一般在连接时需要将密码输入给应用。具体如何连接应用和应用本身有关。`connect`的`path`, `query`和`formData`部分可以使用`{{ PASSWORD }}`代替应用在创建时生成的密码。

