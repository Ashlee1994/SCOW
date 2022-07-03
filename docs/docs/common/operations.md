---
sidebar_position: 6
title: 运维
---

# 运维

本节介绍如何对系统进行的常见运维操作。

## 更新

要更新本系统，如果更新没有引入破坏性升级，那么只需要重新拉取(pull)并重启容器即可。
  - 如果采用的是`docker compose`部署方法，只需要`docker compose pull && docker compose up -d`即可

如果更新引入了破坏性的变更，请根据对应的更新说明，修改配置后在进行部署。

## 查看日志

各个组件的日志直接写到`stdout`。

对于使用镜像部署的部分，可以使用常用的docker日志管理命令或者工具管理日志。如果使用的`docker compose`，可以使用`docker compose logs -f`后面跟对应服务名称的方式查看服务的日志。

对于使用可执行文件部署的部分，我们提供的相应脚本也内置了查看日志的功能。或者，您也可以选择在运行时使用重定向、管道等功能将stdout重定向到文件等地方以便查看。

```bash
# 如果docker compose中服务名为auth，使用此命令可以查看auth服务的日志
docker compose logs -f auth
```


