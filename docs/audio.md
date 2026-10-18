# 钢琴采样与验证

默认音源改为 Alexander Holm 的 Salamander Grand Piano（Yamaha C5），使用 Tone.js 官方示例提供的 30 个 MP3 锚点，覆盖 A0–C8。相邻锚点间隔小三度，88 键最多重采样一个半音。全部文件随项目部署，共约 1.92 MiB；浏览器只请求本站 `/audio/salamander/`，不依赖远程 CDN。

原始库是多力度层 SFZ；本项目是轻量的单层 MP3 子集，通过音量模拟力度，增加短释放包络；没有宣称实现完整原库的踏板共振 / 多力度采样。节拍器保留短合成点击音。

首次用户手势先恢复 AudioContext，再并发加载 / 解码采样；完成后才调度播放，因此下载等待不计为练习时间。缓冲区只加载一次。任何文件失败时原子地切为合成音，并显示降级及重试按钮。停止或切页可以取消待播请求的发声意图；加载可继续用于缓存，不会自行发声。

许可为 CC BY 3.0，署名与改动说明随音源放在 `public/audio/salamander/LICENSE.txt`。样本文件未改动。`manifest.json` 保存来源、大小和 SHA-256。`node scripts/vendor-piano.mjs` 可以重新获取缺失的素材；核心测试核对本地文件哈希。

来源：[原始库说明及许可](https://github.com/sfzinstruments/SalamanderGrandPiano)、[FreePats](https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html)、[Tone.js 官方采样示例](https://github.com/Tonejs/Tone.js/blob/dev/examples/sampler.html)。

自动化验证应检查实际 AudioBufferSource 的采样速率、音频分析器非零波形、失败降级及重试、停止和取消加载后的待播意图。实际音箱 / 耳机的听感仍需人工试听确认。
