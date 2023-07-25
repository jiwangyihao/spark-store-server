# spark-store-server

一个基于 Node + MongoDB 的星火应用商店后端项目

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

- `/diffFromRepository` 从仓库比较差异
- `/refreshPackages` 重新生成 `Packages` 文件
- `/getAppList` 获取应用列表（Json）
  - `sort` 按类别
  - `tag` 按标签
- `/getAppDetail` 获取应用详情
  - `Package` 按包名
- `/search` 搜索
  - `keyword` 关键词（按名称/详情）
- `/getTaskList` 获取任务列表
  - `Author` 按提交者
  - `Status` 按状态
- `/approveTask` 批准任务 `POST`
  - `id` 按任务 ID
  - `token` 用户凭据
