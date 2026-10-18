# 品牌与交互打磨 · 2026-10-18

## Skills 安装

按照用户提供的 [emilkowalski/skills](https://github.com/emilkowalski/skills)，先读取仓库并枚举直接包含 SKILL.md 的目录，再通过 Codex 系统 skill-installer 的 GitHub 安装脚本批量安装。不是把 README 当成 skill，也没有把远程仓库代码加到前端运行时。

使用的安装入口：

```powershell
python C:/Users/asus/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo emilkowalski/skills --path <技能目录列表>
```

安装的 15 个目录为 `skills/animate`、`skills/animate-expo`、`skills/animation-performance`、`skills/animation-vocabulary`、`skills/apple-design`、`skills/ask-sonner`、`skills/break-ui`、`skills/emil-design-eng`、`skills/find-animation-opportunities`、`skills/improve-animations`、`skills/mobile-native`、`skills/pick-ui-library`、`skills/prototype`、`skills/review-animations`、`skills/write-swift`。目标均为 `C:\Users\asus\.codex\skills\<技能名>`，后续对话可自动发现。

本轮直接阅读并应用 emil-design-eng；移动端参考 mobile-native；动效复查参考 review-animations 及其 STANDARDS.md。其他技能已安装，未将 Swift、Expo 等无关工作流套入本项目。

## 视觉与品牌

延续已经验证的键盘居中、紧凑信息区、上下文指导和移动顺序。调整集中于界面材质与状态：冷白工作面、石墨灰主按钮，钢蓝与琥珀分别对应右手、左手。导航和音型使用白底、浅边界、细微阴影、勾选或底线表达当前项。构成音使用静态音程条，避免看起来像另一组可点击按钮。

新品牌为自制 CF 字母图形，与得意黑“和序”轮廓字标组合。它取代旧的绿色方块钢琴图标和系统粗体文字。favicon 与导航图形一致；琴身复用中文字标。品牌字标有自己的风格，小字号正文保持清楚的无衬线字体。

正文采用 Geist 与 Noto Sans SC 的本地可变字体子集，总计约 168 KiB。字体子集改名为 Chordflow Sans / Chordflow Sans SC；得意黑只用于两个品牌字形的 SVG 轮廓。开源许可、来源 URL 和文件 SHA-256 随项目保存，普通构建无外部字体请求，也不运行 Python。

需要更新界面文字覆盖时，在仓库根目录执行：

```powershell
python -m pip install --target .cache/font-tools fonttools brotli
python scripts/build-fonts.py
```

新增用户练习名称中未覆盖的字符会正常回退到系统中文字体，不会丢字。修改文件后按清单检查素材及许可，重新构建。

## 按 Emil 指导复查

| Before | After | Why |
| --- | --- | --- |
| 全局 hover 在触屏也可能触发 | `src/styles.css:12` 的 hover 仅作用于精确指针 | 避免手机点按后残留鼠标状态 |
| 普通按钮缺少按下确认 | `src/styles.css:17` 仅指针操作用 `.98` 缩放，按下 100ms / 释放 160ms | 轻微反馈，不延迟点击与声音 |
| 鼠标转键盘时可能仍有回弹过渡 | `src/styles.css:11` 键盘明确清除 transform 与 transition | 从鼠标切换到 Enter 操作也立即响应 |
| 导航、转位与琴键可继承全局效果 | `src/styles.css:46` 与 `src/components/Piano.module.css:6` 不给高频项添加动画 | 练琴的时间感优先，不给音乐事件加装饰性补间 |
| 播放文案切换挤动后续控件 | `src/styles.css:126` 播放 / 暂停 / 继续宽度均为 102px | 操作位置保持稳定 |
| 手机输入字体小于 16px | `src/styles.css:281` 粗指针下输入与选择器至少 16px | 避免 Safari 聚焦时自动放大 |
| 所有选中项依赖同色背景 | 使用勾选、细线、明暗与手别文字 | 选中和演奏信息各自清楚 |

动效结论：Approve。只使用可中断的 CSS transform 过渡，没有进场表演、循环装饰、布局属性动画或播放头补间。采用指南中的 `cubic-bezier(0.23, 1, 0.32, 1)`；键盘与高频音符操作无动画，减少动态效果时过渡为 0s。

## 实际验证

- 用本机 Edge 打开开发页面，复查 1366×768、1920×1080 和 390×844；既有 320px 回归保留。键盘与试听在桌面首屏仍完整显示，长进行没有外层多余滚动。
- 字体状态实际为 loaded；指针按下测得 scale .98 / 100ms，切换到键盘后 transform 为 none / 0s。
- 播放、暂停、继续实测宽度均为 102px；手机模拟中输入字号 16px，释放后按钮无残留变形，减少动态效果为 0s。
- `npm run check`：类型检查、ESLint、61 个核心测试与生产构建。
- `npm run test:e2e`：34 项桌面及触屏手机 Edge 回归。
- 本地生产预览 `http://127.0.0.1:4173/` 的 HTTP smoke：构建 JS/CSS、两个字体与字标的 MIME / SHA-256、品牌图标、字体许可、30 个钢琴采样及 SPA fallback。

手机检查采用 Edge 触控模拟。iOS 原生输入缩放、浏览器安全区与实体触感尚需手机硬件确认；没有将模拟结果当作真机测试。Nginx 增加字体缺失文件的 404 规则；本轮未运行容器或远程部署。

已有的任务说明文件删除与新增保持原状，不纳入本轮提交。music、audio、data、storage、备份格式与项目依赖保持原有实现。
