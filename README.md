# Daimeng Technology — Aluminium Surface Treatment Website

戴盟科技（佛山钻石科技有限公司）国际营销网站。纯静态站，源码生成 → `dist/` → 发布。

- 线上地址：https://myjerry243.github.io/daimeng-website/
- 正式域名（canonical / sitemap 指向）：https://www.daimengtech.com

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

## 本地预览

```bash
python src/build.py     # 生成 dist/
node server.mjs         # http://127.0.0.1:4173/
```

Windows 也可直接双击 `Start-Website.cmd`。

## 构建与部署

推送到 `main` 分支后，GitHub Actions（`.github/workflows/deploy.yml`）会：

1. `python src/build.py` 生成 `dist/`
2. `python tools/check-site.py` 校验站内链接与资源
3. 将 `dist/` 发布到 GitHub Pages

也可以本地执行 `python src/build.py` 后手动发布。

## 已知差异：询价表单

本地 `server.mjs` 提供 `/api/enquiries` 接口，提交后写入 `data/enquiries/`。

GitHub Pages 是纯静态托管，**没有这个接口**。此时表单会自动降级：仍生成完整需求简报，
并给出 `mailto:` 链接，由访客在自己邮箱里发送，不会丢失询价。测到线上提交后收到的
英文提示即为该降级路径，属预期行为。

若要让线上表单直接入库，需要接入一个真实后端（Serverless 函数 / CRM 表单接口），
并把 `src/app.js` 中的 `/api/enquiries` 指向该地址。

## 内容来源

见 `SOURCES.md`（业务资料与图片来源）与 `验证记录.md`（本地验证记录）。
