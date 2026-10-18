# 和序 · Chordflow

从和弦开始，弹出自己的伴奏。From chords to accompaniment.

一个面向钢琴初学者的简体中文和弦与即兴伴奏工具。纯静态前端，教学数据随站点部署；设置和个人练习仅保存在当前浏览器。

## 本地运行（Windows PowerShell / macOS / Linux）

使用 `.nvmrc` 中的 Node 24.15.0 和 npm。Windows 中先进入项目目录：

```powershell
Set-Location C:\Users\asus\Documents\chordflow
npm ci
npm run dev
```

开发地址：http://127.0.0.1:5173 。首次发声需要点击播放或琴键。当前音源为本地 Web Audio 合成键盘音，没有远程音色下载。

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

生产构建在 `dist/`，预览地址 http://127.0.0.1:4173 。生产使用 Nginx；不要用 Vite 开发服务对外上线。

文档：[产品范围](docs/product.md)、[设计规范](docs/design.md)、[音乐模型](docs/music-model.md)。部署和验证记录将在对应阶段补全。

所有教学内容为原创教学示例；未使用外部图片、字体或音频素材。参考功能来源和已知范围见产品文档。
