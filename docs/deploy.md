# 和序 · Chordflow 部署说明

本轮只准备本地可运行项目和部署文件。没有连接服务器、创建远程仓库、注册域名或执行上线。服务器与 SSH 信息未知，以下命令待提供信息并明确要求上线后执行。

## 交付形态

纯静态 SPA，默认部署于域名根路径 `/`，不需要 API、数据库或前端环境变量。浏览器中不应放任何秘密。Vite base 维持默认 `/`；当前没有声明支持子路径，不能只移动文件到 `/chordflow/` 就视为支持。

字体与品牌素材随 `public/` 进入构建产物：`/fonts/` 下有两份 WOFF2、来源校验清单和字体许可，根目录有 brand-mark.svg、wordmark.svg、favicon.svg。无需外部字体 CDN。Nginx 使用标准 MIME 表提供字体，并对 `/fonts/` 缺失文件返回 404。`test:smoke` 检查字体、字标的 MIME / SHA-256 及许可；普通部署无需 Python 或重新生成字体。

Docker 使用两阶段构建：`node:24.15.0-alpine` 安装锁定依赖并构建，`nginx:1.30.6-alpine` 最终仅提供 `dist/`。固定补丁版本，构建产物可通过 Git 短 SHA 镜像标签和 OCI revision 追踪；这些是标签固定，不是镜像 digest 固定。正式发布可记录 `docker image inspect` 返回的镜像 ID / digest。

Nginx 配置为非 root 用户、8080 端口，PID / 临时目录都放 `/tmp`，Compose 使用只读根文件系统和临时 tmpfs；程序没有服务器持久数据。`ENTRYPOINT` 直接运行 Nginx，不需要写入式环境模板替换。

默认映射到服务器 `127.0.0.1:8080`，不直接暴露公网，适合宿主机反向代理。若反向代理也在其他容器内，应改成共享 Docker 网络并代理服务名 `chordflow:8080`，不能从另一容器代理它自己的 `127.0.0.1`。

## 本地与 Linux 构建启动

需要正在运行的 Linux Docker Engine / Docker Desktop Linux containers 以及 Compose v2。安装本地 Node 的方式见 README。

```sh
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail=100 -f
```

浏览器打开 [本机容器地址](http://127.0.0.1:8080)。健康检查为 `/healthz`。

可选复制 `.env.example` 到 `.env`：PowerShell 用 `Copy-Item .env.example .env`；Linux 用 `cp .env.example .env`。两个变量仅由 Compose 读取，不进入前端：

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `CHORDFLOW_TAG` | `0.1.0` | 本地构建镜像标签及 revision 标识 |
| `HOST_PORT` | `8080` | 宿主机 loopback 监听端口 |

在启动前可先验证 Nginx 语法：

```sh
docker compose run --rm --no-deps chordflow -t
```

`nginx -t` 会检查配置和文件权限。此命令必须在镜像构建后运行。停止服务用 `docker compose down`，练习备份仍由浏览器保存，不在容器卷中。

## HTTP 和浏览器验证

先确保目标正在运行，再执行：

```sh
npm run test:smoke -- http://127.0.0.1:8080 --production
```

此脚本检查首页、构建 JS/CSS MIME、30 个本地 MP3 的 MIME / SHA-256、采样署名、`/practice/saved` 的 SPA 回退、缓存头、CSP、健康检查和缺失静态资源的 404。深层 URL 目前加载同一个应用入口，页面导航仍是应用内状态，不承诺恢复某个 URL 对应标签页。

构建后也可先在本地预览执行普通烟雾测试：

```sh
npm run build
npm run preview
```

保持预览运行，在另一个终端执行 `npm run test:smoke`。默认检查 4173 端口，不把 Vite 预览结果当成 Nginx 验证。

完整浏览器路径可指向目标服务（本机已安装 Edge，配置使用 `msedge` 通道）：

PowerShell：

```powershell
$env:E2E_BASE_URL = 'http://127.0.0.1:8080'
npm run test:e2e
Remove-Item Env:E2E_BASE_URL
```

Linux（需另外安装对应的浏览器，或将配置的 channel 改为本机可用浏览器）：

```sh
E2E_BASE_URL=http://127.0.0.1:8080 npm run test:e2e
```

尚未验证的浏览器 / 设备不要标成兼容。自动化音频节点和非零波形验证不代替人工试听。

## 静态资源策略

- `index.html` 和 SPA 回退使用 `Cache-Control: no-cache`，允许浏览器每次重新验证。
- Vite `/assets/` 内容哈希资源在 200 / 304 时缓存一年并标为 immutable；错误响应不会被长缓存。
- `/assets/` 或 `/audio/` 缺失文件返回 404，不错误回退 HTML。
- 标准 `mime.types` 提供 JavaScript、CSS、SVG、WAV、MP3 等 MIME。Salamander 钢琴采样约 1.92 MiB，作为构建中的 `/audio/salamander/` 资源随容器分发；不依赖外部 CDN。署名、许可与 manifest 不得删去。
- CSP 仅允许同源脚本与资源；动态琴键位置 / 播放头需要内联 style，因此 `style-src` 保留 `unsafe-inline`；脚本不允许内联。

## HTTPS 与域名

先把 `YOUR_DOMAIN` 的 DNS 指向 `SERVER_IP`，再由宿主机反向代理终止 HTTPS。参考 `deploy/reverse-proxy.conf.example`，替换真实域名和证书路径，经 `nginx -t` 通过后再启用。证书取得 / 续期方式依服务器现有工具决定，也可由已有 Caddy / Traefik 承担。

不要把占位符当作可直接加载的配置；不要把私钥提交到 Git。公网防火墙通常仅开放现有 SSH 以及代理的 80 / 443，容器 8080 保持 loopback。网站从 HTTP 转到 HTTPS、换端口或换域名会改变浏览器来源，需要先导出练习再在新来源导入。

## 可追踪更新与回滚

Linux 发布时用新提交短 SHA 作为标签：

```sh
export CHORDFLOW_TAG="$(git rev-parse --short HEAD)"
docker compose build
docker compose run --rm --no-deps chordflow -t
docker compose up -d --no-build
docker compose ps
npm run test:smoke -- http://127.0.0.1:8080 --production
```

将这个标签记入发布记录，也可写进本机未提交的 `.env`，避免下次新终端忘记当前标签。更新前保留上一镜像及其标签，勿立即清理。PowerShell 等价设置为 `$env:CHORDFLOW_TAG = git rev-parse --short HEAD`，其余 Docker 命令一致。

回滚不改写 Git 历史；切回已存在的上一镜像：

```sh
CHORDFLOW_TAG=PREVIOUS_TAG docker compose up -d --no-build
docker compose logs --tail=100
```

PowerShell 先设置 `$env:CHORDFLOW_TAG = 'PREVIOUS_TAG'` 再执行 `docker compose up -d --no-build`。确认稳定后更新 `.env` 中的当前标签。标签必须是实际保留的镜像；备份源代码不能替代镜像存档。

## 练习备份

在“我的练习”点“导出 JSON 备份”，保存设置、收藏、练习和实际播放统计。文件包含 `format: chordflow-backup`、`version: 1`。导入限制 1 MB、100 个练习、200 个收藏，先完整校验再替换。升级、换浏览器、清理缓存、换域名 / 协议前先导出。服务器上没有个人练习数据库可代为恢复。

## 本次验证限制

Windows 下 `docker compose config --quiet` 已通过，但 Docker Linux 引擎未运行（`dockerDesktopLinuxEngine` named pipe 不存在）。因此本轮没有成功执行镜像构建、`nginx -t` 或容器 HTTP 测试。部署前必须补跑上述检查，不能以本地 Vite 的结果替代。具体结果见 [验证记录](verification.md)。

参考：[Nginx 官方镜像](https://hub.docker.com/_/nginx)、[Node 官方镜像](https://hub.docker.com/_/node)、[Nginx 缓存头指令](https://nginx.org/en/docs/http/ngx_http_headers_module.html)。
