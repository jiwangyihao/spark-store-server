# spark-store-server

一个基于 Nest.js + MongoDB 的星火应用商店后端项目

# 项目介绍

本项目最终目标是构建一个包含投递-审核-查询全周期的应用商店后端

# 项目规划

## 一阶段（Json -> Database）

- 建立数据表
- 与仓库自动完成更改比对
- 模拟审核操作
- 实现查询接口

## 二阶段（Post -> Database -> Json）

- 实现开发者中心相关接口
- 完成对原有后端的替代

## 三阶段（完全体）

- 等待规划ing

# 接口设计（一阶段/开发中）

- `/info/latest` 从 Gitee 获取最新版本日志
- `/info/history` 从 Gitee 获取历史更新日志
- `/dev/diffFromRepository` 从仓库比较差异
- `/dev/getTaskList` 获取任务列表
  - `Author` 按提交者
  - `Status` 按状态
- `/dev/approveTask` 批准任务 `POST`
  - `id` 按任务 ID
  - `token` 用户凭据
- `/repo/refreshPackages` 重新生成 `Packages` 文件
- `/repo/getAppList` 获取应用列表（Json）
  - `sort` 按类别
  - `tag` 按标签
- `/repo/getAppDetail` 获取应用详情
  - `package` 按包名
- `/repo/search` 搜索
  - `keyword` 关键词（按名称/详情）

# 本地调试

## 安装依赖

```bash
$ yarn install
```

## 运行

```bash
# 开发调试
$ yarn run start

# watch 模式调试
$ yarn run start:dev

# 生产模式
$ yarn run start:prod
```

## 测试

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```
