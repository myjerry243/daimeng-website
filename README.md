# Daimeng Technology — Aluminium Surface Treatment Website

戴盟科技（佛山钻石科技有限公司）国际营销网站。纯静态站，源码生成 → `dist/` → 发布。

- 线上地址：**https://myjerry243.github.io/daimeng-website/**
- canonical / `og:url` / `sitemap.xml` 均指向上面这个 GitHub Pages 地址，**不指向客户正式域名**。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `src/build.py` | 站点生成器（纯标准库 Python），输出到 `dist/` |
| `src/pages.py` | 除首页外的其余路由内容 |
| `src/style.css` / `src/app.js` | 样式与前端脚本，构建时复制到 `dist/assets/` |
| `dist/` | **构建产物**（不要手改，改 `src/` 后重新生成） |
| `tools/check-site.py` | 站内链接、资源、标题、结构化数据静态检查 |
| `server.mjs` | 本地预览服务器，并承载询价接口 `/api/enquiries` |
| `data/enquiries/` | 本地询价记录（已 gitignore，不入库） |

## 发布路径前缀（重要）

GitHub Pages **项目型**站点发布在 `https://<用户名>.github.io/<仓库名>/` 子路径下，
而站点源码里的链接是根绝对路径（`/assets/style.css`、`/solutions/`）。构建的最后一步
会自动给所有 `href="/…"` 和 `src="/…"` 加上前缀 `/daimeng-website/`，否则线上会
**无样式、图片全挂、站内链接全断**。

两个环境变量控制（默认值即为线上发布所需的值，一般不用改）：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `SITE_URL` | `https://myjerry243.github.io/daimeng-website` | canonical / sitemap / 结构化数据用的站点根地址 |
| `SITE_PREFIX` | `/daimeng-website` | 链接前缀。发布在域名根目录时设为空字符串 |

## 本地预览

```bash
python src/build.py     # 生成 dist/
node server.mjs         # http://127.0.0.1:4173/
```

`server.mjs` 会自动剥掉 `/daimeng-website/` 前缀，所以 `http://127.0.0.1:4173/`
和 `http://127.0.0.1:4173/daimeng-website/` 都能打开，与线上路径一致。

Windows 也可直接双击 `Start-Website.cmd`。

## 构建与部署

推送到 `main` 分支后，GitHub Actions（`.github/workflows/deploy.yml`）会：

1. `python src/build.py` 生成 `dist/`（含前缀改写）
2. `python tools/check-site.py` 校验站内链接与资源
3. 将 `dist/` 发布到 GitHub Pages

首次部署时曾因 Pages 尚未启用导致 `Configure Pages` 步骤失败（`Get Pages site failed`），
**重跑该工作流即可**，与代码无关。

## 已知差异：询价表单

本地 `server.mjs` 提供 `/api/enquiries` 接口，提交后写入 `data/enquiries/`。

GitHub Pages 是纯静态托管，**没有这个接口**。此时表单会自动降级：仍然生成完整需求
简报，并给出 `mailto:` 链接，由访客在自己邮箱里发送，**询价不会丢失**。线上提交后看到
的英文提示即为该降级路径，属预期行为。

若要让线上表单直接入库，需要接入一个真实后端（Serverless 函数 / CRM 表单接口），
并把 `src/app.js` 中的 `/api/enquiries` 指向该地址。

## 内容来源

见 `SOURCES.md`（业务资料与图片来源）与 `验证记录.md`（本地验证记录）。
