# 练琴工作台界面重构 · 2026-10-18

## 环境与原有修改

在当前 main 工作目录继续开发。开始时只有任务说明文件的删除与新增：`chordflow_codex_prompts_v2.md` 删除、`chordflow_prompts.md` 未跟踪。这两项未修改、未暂存，也不纳入界面提交。

## Skills 安装与使用

`frontend-design` 已存在于 `C:\Users\asus\.codex\skills\frontend-design`，阅读其 SKILL.md 后沿用，没有覆盖本机现有版本。

`web-design-guidelines` 原本缺失。先通过系统 skill-installer 查询 curated 目录，接口返回 HTTP 403；随后直接使用它的官方 GitHub 安装脚本：

```powershell
python C:/Users/asus/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo vercel-labs/agent-skills --path skills/web-design-guidelines
```

安装成功至 `C:\Users\asus\.codex\skills\web-design-guidelines`。阅读新 skill，并获取其要求的最新规则：<https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md>。本轮直接阅读后应用；后续 Codex 会话可自动发现新安装的 skill。

## 实际浏览器检查与决策

使用本机 Microsoft Edge，通过项目现有 Playwright 实际打开 `http://127.0.0.1:5173/`，没有使用模拟页面代替检查。启动时页面已运行，保留原开发服务。

原 1366×768 页面：主区可用高 620px、内容高 1239px，键盘从屏幕 y≈929px 开始，首屏完全不可见。巨幅和弦、重复页眉、常驻说明和重复试听占据了核心区域。

重构将桌面导航收至 176px，取消重复标题与外层卡片，将和弦信息合并、教学移至上下文侧栏和折叠说明，钢琴与唯一播放器紧邻。其他页面复用同一键盘和播放器结构。手机使用完整文档滚动，播放器不固定。

新增的试听对象与状态仅用于呈现；原音频调度、乐理推导、自动音区、设置存储及数据格式不变。原有 26 项浏览器功能回归保留，只将已删除的重复试听入口断言改为唯一的“同时弹”。新增首屏几何和手机播放状态检查，不能以元素“存在”代替进入首屏。

## 验证

- Edge 实际检查并截图：1366×768、1920×1080、390×844，另外沿用 320px 回归。其他三个页面均检查桌面及手机布局。
- 桌面默认 C：1366 宽时键盘 y≈352–600px，试听区域 y≈600–697px；1920 宽时键盘 y≈358–606px，试听区域 y≈606–703px。未滚动即可完整操作。
- 四音和弦 F#maj7 第三转位另做首屏边界断言，页面无横向溢出。
- 检查查询与选择、转位、同时弹、上行试听、停止、连续播放、暂停继续、切页停止、手别、音区、采样重试、保存和备份。
- `npm run check`：类型检查、ESLint、61 个核心测试、生产构建。
- `npm run test:e2e`：桌面及触控手机 Edge，总计 32 项。

生产静态资源由 Vite 输出至 dist，既有部署文件保留。未执行远程部署。本次只验证本机 Edge；没有声称验证真实手机硬件或其他浏览器。

## 后续修正：底部留白与搜索框

根据用户截图，在 2048×1024 的实际 Edge 页面复现了双重滚动：应用高 1024px，外层文档却被撑至 1984px。原因是保存练习的读屏标签使用绝对定位，缺少就近定位上下文，越出了内部滚动区。为 `.workspace-panel` 添加 `position: relative`，隐藏表单元素留在内部，外层文档恢复为 1024px；进行内容仍正常滚动，说明区后保留约 24px 正常间距。

搜索移到根音和类型旁边；输入框和提交按钮共享外边框及 `focus-within` 状态，替换仅围住输入框的截断粗轮廓，保留按钮自身的键盘焦点。搜索与提交行为不变。

新增回归覆盖文档高度、外层无法额外滚动、进行底部位置及保存入口。重新检查桌面与手机截图、搜索提交和完整项目检查。

验证结果：`npx playwright test tests/layout.spec.ts tests/chords.spec.ts` 10 项通过；`npm run check` 的类型检查、ESLint、61 个核心测试和生产构建全部通过。另用实际 Edge 验证输入后 Enter 搜索、Tab 到提交按钮后 Enter 搜索。修正截图为 `docs/screenshots/progression-bottom-2048.png` 与 `docs/screenshots/search-focus.png`，三种尺寸的探索页截图也已更新。
