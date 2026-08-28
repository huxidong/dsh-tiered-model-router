# DSH 三档模型路由

这是一个 DeepSeek Harness 原生插件，在本地将每个任务判断为 `easy`、`standard` 或 `hard`，然后通过 DSH 自己的 `agent/request` 生命周期切换 provider、model 和 reasoning effort。它不增加模型网关，也不额外调用一个“裁判模型”。

插件的三档路由完全由配置提供，不写死 `dsh-fast` 或 `dsh-strong`。默认会保留用户手动选择的未知 provider/model；同一轮只允许升级，不会来回震荡；工具失败达到阈值后会升级到 `hard`。

## 安装包

项目已经包含浏览器设置页的 DSH module-loader bundle，可以直接打成 npm 安装包，不需要在用户机器上重新编译前端：

```powershell
npm run package
dsh plugin --profile web add .\dist\dsh-tiered-model-router-0.1.0.tgz
```

`dsh plugin` 会把插件安装到指定 profile，并自动识别包内声明的 `cordis.patch.yml`。安装或升级后重启对应的 DSH profile；之后打开 Web 设置中的“模型路由”页面即可修改三档 provider、model、reasoning effort 和路由策略。设置会保存到 DSH Settings，实时影响后续请求，不需要手动编辑 YAML。

如果只想从源码目录安装，也可以执行 `dsh plugin --profile web add .`。发布到 npm 后则把本地 tarball 换成包名，例如 `dsh plugin --profile web add dsh-tiered-model-router`。

高级用户仍可直接编辑 `cordis.patch.yml`，它会作为组合配置基础；图形界面保存的值优先于该基础配置，点击“恢复组合配置”即可清除用户覆盖。

`src/dsh-adapter.js` 是唯一依赖 DSH 事件的模块，分类器、状态和请求重写都可独立测试。

## 本地验证

在项目目录执行 `npm test`，会运行纯逻辑测试和真实 DSH 回路测试。测试会从本机临时目录加载当前上游 DSH 构建，因此不需要真实模型密钥，也不会发起网络模型请求。

如果上游源码不在默认临时目录，可通过环境变量 `DSH_UPSTREAM_DIR` 指定 checkout 路径。
