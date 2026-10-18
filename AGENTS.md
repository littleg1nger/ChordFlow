# ChordFlow 工程说明

## 结构与命令

React + TypeScript + Vite，纯静态前端；npm，Node 24.15.0（见 .nvmrc）。

- `npm ci` 安装锁定依赖
- `npm run dev` 开发服务
- `npm run typecheck` / `npm run lint` / `npm test` / `npm run build` 必须在交付前通过
- `npm run test:e2e` Chromium 浏览器路径验证
- `npm run preview` 本地生产预览；不是生产服务器
- 预览运行后 `npm run test:smoke`；容器运行后 `npm run test:smoke -- http://127.0.0.1:8080 --production`

Playwright 默认使用本机已安装 Edge。设置 `E2E_BASE_URL` 可对预览或容器运行同一套路径测试。详细限制与已执行结果见 docs/verification.md；本轮未运行 Docker Linux 引擎，不能将 Compose 语法校验称为容器验证。

领域函数在 src/music，教学内容在 src/data，Web Audio 在 src/audio，本地数据在 src/storage，视图与组件不得自行重算节奏。

## 必须保护的约定

C4=MIDI 60；理论拼写与 MIDI 分离，保留 E#、Bbb 等。四分音符 480 tick。音名、度数、调内罗马级数和指法数字分别标注。三音音型不能无提示套在七和弦上。

切页及参数修改停止重置；暂停可继续；隐藏页面暂停；一个主动播放会话。音频必须用户手势解锁，不用 setInterval 作音乐时钟。测试必须区分调度验证和人工听音。

localStorage 及 JSON 导入均视为不可信数据，验证版本、范围、枚举、大小与完整结构。不要在前端变量里存秘密。

维护 docs 下产品、设计、音乐与部署说明。每个通过验证的实质阶段作本地 Git 提交；不覆盖用户修改、不改写历史或 Git 身份、不创建远程。远程部署必须等用户提供服务器信息并明确要求上线。

## 进一步实现前留意

src/features/Explorer、Patterns、Progressions、Practice 是四个功能视图；src/components/Piano.module.css 为精确键盘图形样式。全局 tokens / 布局在 src/tokens.css 和 src/styles.css。useUserData 保证写入失败时继续在内存练习，并让播放器记录可在 pagehide 同步保存。

Alberti 限三音且左手最高音低于右手最低音。根五八限含纯五度的和弦，右手只保持第一拍，给左手高八度让位。逐步定位后从中途开始的首轮不能计为完整轮次。平稳连接保留全部声部，采用有限候选的顺序贪心，不优化循环末尾到开头。

默认音源为 public/audio/salamander 中的 30 个本地 MP3，CC BY 3.0 / Alexander Holm。许可、来源与 SHA-256 必须随素材保留；samples.test 核对文件。先由用户手势恢复 context，再加载 / 解码，最后才调度与计时。失败原子降级并允许重试。异步 play / retry 返回时必须检查取消 token，不能覆盖后台暂停状态或恢复旧发声。

新增音型共 11 类、进行 7 组、加花 3 类、样例 6 个。music/fills.ts 负责小节末事件替换 / 裁剪，music/scale.ts 负责大调 / 自然小调经过音。经过音不能并入完整和弦构成，当前只在 4/4 最后小节加花。原位 / 完整基础配置与实际事件分别展示。

keyboard-range.ts 根据全部实际 MIDI 自动选择视图；进行要固定整组范围，不随每次播放头跳动。保留手动范围。v1 存储新增可选 fill / autoRange 兼容旧备份，不能丢失收藏 / 练习 / 统计。详见 docs/iteration-02.md。
