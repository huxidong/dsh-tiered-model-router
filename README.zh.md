# DSH 三档模型路由

这是一�?DeepSeek Harness 原生插件，在本地将每个任务判断为 `easy`、`standard` �?`hard`，然后通过 DSH 自己�?`agent/request` 生命周期切换 provider、model �?reasoning effort。它不增加模型网关，也不额外调用一个“裁判模型”�?
插件的三档路由完全由配置提供，不写死 `dsh-fast` �?`dsh-strong`。自动路由开启时由三档配置接管请求，即使会话最初已有其他模型；在模型席位中手动选择模型后会关闭自动路由并给出提醒。同一轮只允许升级，不会来回震荡；工具失败达到阈值后会升级到 `hard`�?
## 安装�?
项目已经包含浏览器设置页�?DSH module-loader bundle，可以直接打�?npm 安装包，不需要在用户机器上重新编译前端：

```powershell
npm run package
dsh plugin --profile web add .\dist\dsh-tiered-model-router-0.1.3.tgz
```

`dsh plugin` 会把插件安装到指�?profile，并自动识别包内声明�?`cordis.patch.yml`。安装或升级后重启对应的 DSH profile；之后打开 Web 设置中的“模型路由”页面即可修改三档模型提供商、模型、推理等级、阈值、开关、关键词列表以及工具失败策略。模型和推理等级都从当前 DSH 模型池下拉选择，未列入模型池的值不能保存。选择模型后，页面会发起一次短时可用性检查；保存前还会复核一次。明确返回余�?额度耗尽、认证失效或模型不存在时会阻止保存，网络超时只提示“暂时无法确认”，不会把有效配置误判成欠费。检查请求最多等�?8 秒，并且不会因为检查失败让路由插件崩溃。设置会保存�?DSH Settings，实时影响后续请求，不需要手动编�?YAML�?
如果只想从源码目录安装，也可以执�?`dsh plugin --profile web add .`。发布到 npm 后则把本�?tarball 换成包名，例�?`dsh plugin --profile web add dsh-tiered-model-router`�?
高级用户仍可直接编辑 `cordis.patch.yml`，它会作为组合配置基础；图形界面保存的值优先于该基础配置，点击“恢复组合配置”即可清除用户覆盖�?
`src/dsh-adapter.js` 是唯一依赖 DSH 事件的模块，分类器、状态和请求重写都可独立测试�?
## 本地验证

在项目目录执�?`npm test`，会运行纯逻辑测试和真�?DSH 回路测试。测试会从本机临时目录加载当前上�?DSH 构建，因此不需要真实模型密钥，也不会发起网络模型请求�?
如果上游源码不在默认临时目录，可通过环境变量 `DSH_UPSTREAM_DIR` 指定 checkout 路径�?