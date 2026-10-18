# ChordFlow

从和弦开始，弹出自己的伴奏。From chords to accompaniment.

一个面向钢琴初学者的简体中文和弦与即兴伴奏工具。纯静态前端，教学数据随站点部署；设置和个人练习仅保存在当前浏览器。

## 本地运行（Windows PowerShell / macOS / Linux）

使用 `.nvmrc` 中的 Node 24.15.0 和 npm。Windows 中先进入项目目录：

```powershell
Set-Location C:\Users\asus\Documents\chordflow
npm ci
npm run dev
```

开发地址：[http://127.0.0.1:5173](http://127.0.0.1:5173)。首次发声需要点击播放或琴键，载入约 1.92 MiB 的本站 Salamander 钢琴采样。音源随项目部署，无需远程 CDN；加载失败时明确降级并允许重试。

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

生产构建在 `dist/`，预览地址 [http://127.0.0.1:4173](http://127.0.0.1:4173)。生产使用 Nginx；不要用 Vite 开发服务对外上线。

## 已实现

- 和弦探索：全部 12 音高类别及常用等音名、14 类和弦、别名查询、理论拼写、转位与和弦内斜杠低音。
- 自动适配演示键盘：依据实际音符选取约三八度，必要时扩大；进行中保持视图稳定，保留原有三个手动音区。音名 / 相对度数、C4、左右手、加花与正在发声状态均有标记。
- 采样钢琴：同时弹、逐音上 / 下行；11 种结构化伴奏，新增上行 / 下行、四音、十六分分解、交替与反拍；40–160 BPM、暂停继续 / 停止、循环、节拍器、预备拍、分手和音量。
- 7 组经典进行：包含卡农、4536251、爵士 1625；调内真实移调，每和弦 1 / 2 / 4 小节，原位 / 平稳连接、当前 / 下一和弦提示。
- 3 类进行加花：和弦内音回转、调内经过音、低音连接；只在换和弦前的小节末替换事件，逐步显示音高 / 手别 / 时值 / 作用。6 个跟练样例可以直接载入、修改并保存。
- 个人练习：创建保存、复制删除、收藏、实际播放时间 / 完成轮次，带版本的 JSON 导入导出；刷新恢复设置与练习。
- 暖白与墨绿界面，桌面 / 平板 / 手机布局、局部键盘滚动、失败恢复与减少动态效果支持。

## 浏览器与 HTTP 测试

本项目浏览器测试使用本机 Microsoft Edge 通道（无需额外下载浏览器）：

```sh
npm run test:e2e
```

若电脑没有 Edge，请安装可用的浏览器并在 `playwright.config.ts` 中调整 channel；当前自动化仅验证了本机 Edge 与模拟手机视口，未实测实体手机或 iOS Safari。首次音频解锁与系统音量仍需用户实际试听确认。

保持 `npm run preview` 运行后，另一终端可执行 `npm run test:smoke`。完整记录见 [验证记录](docs/verification.md)。

## 部署

提供多阶段 Dockerfile、Compose、非 root Nginx、SPA 回退、MIME 与哈希资源缓存配置。默认根路径，容器 8080 只绑定宿主机 loopback，前端不需要环境变量。详见 [服务器部署文档](docs/deploy.md)。本机 Docker Linux 引擎未运行，容器构建 / 启动尚未实测；没有执行远程部署。

## 文档与限制

[产品范围](docs/product.md) · [设计规范](docs/design.md) · [音乐模型](docs/music-model.md) · [音源与许可](docs/audio.md) · [部署](docs/deploy.md) · [验证](docs/verification.md) · [第二轮更新](docs/iteration-02.md) · [接手说明](AGENTS.md)

钢琴是 Salamander 单层 MP3 子集，未实现原库完整的多力度层、踏板共振与释放噪声。尚无 MIDI / 麦克风识别、自由编排和九 / 十一 / 十三和弦。平稳连接是有限音区内的启发式建议，不优化整个循环；加花会修改实际事件，不改变完整和弦的理论构成。当前加花限 4/4 拍。浏览器间不自动同步数据；升级或换域名前请导出备份。

分解与加花均为原创教学编配；卡农只提供和声骨架，不提供整曲旋律或第三方演奏录音。未使用外部图片和字体。钢琴采样作者 Alexander Holm，CC BY 3.0，署名与来源位于 `public/audio/salamander/LICENSE.txt`；文件哈希与原始 URL 位于同目录 manifest。详见音源文档。

运行时使用 React / React DOM，MIT 许可声明随站点保存在 `public/third-party-notices.txt`；构建和测试依赖的许可随 npm 包提供。

依赖兼容性已对照 [React](https://react.dev/learn)、[Vite Node 要求](https://vite.dev/guide/)、[Vitest](https://vitest.dev/guide/) 与 [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) 官方说明；安装包的 engines / peerDependencies 与精确版本见锁文件。
