# 和序 · Chordflow 验证记录

环境：Windows，Node 24.15.0，npm 11.12.1。Git 沿用既有用户配置；未创建远程。

## 阶段 A

`npm run check` 通过：TypeScript、ESLint、22 项乐理测试、Vite 生产构建。依赖已核对官方文档及 npm engines / peerDependencies，使用精确版本及 package-lock。TypeScript 选择 5.9.3 以符合 typescript-eslint 的支持范围。

## 阶段 B

和弦探索与 Web Audio 图已实现。核心测试覆盖需求指定拼写、全部根音 / 类型半音公式、别名大小写、转位集合、斜杠限制与变化音八度。浏览器验证使用本机 Edge 的自动化模式；调度验证不等同于人工听音。

后续阶段继续补充实际结果。
