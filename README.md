# 圣迪乐消费者经营战略平台

[品牌入口](https://roderickren1.github.io/sundaily-omega3-strategy/) · [V1.0 战略体系](https://roderickren1.github.io/sundaily-omega3-strategy/v1/) · [V2.0 经营深化](https://roderickren1.github.io/sundaily-omega3-strategy/v2/) · [产品体验实验室](https://roderickren1.github.io/sundaily-omega3-strategy/v2/product-lab/) · [商业验证实验室](https://roderickren1.github.io/sundaily-omega3-strategy/v2/growth-lab/) · [发布影片及引导](https://roderickren1.github.io/sundaily-omega3-strategy/v2/launch/)

V1.0 为战略基础，V2.0 深化转化、周期购、产品体验和商业验证。两个版本都有独立的总览、目录和章节。每个商业工作台拥有独立地址。

## 构建与预览

`node build-pages.mjs` 从 `routes.js` 生成各路由的静态页面。更新路由或页面外壳后，请重新生成并提交对应的 `index.html` 文件。GitHub Pages 发布 `main` 分支根目录。

预览可从项目目录运行 `python3 -m http.server 8080`，访问 `http://localhost:8080/`。测试影片进度跳转时，请使用支持 HTTP 字节范围请求的静态服务。

运行 `node --test tests/*.test.mjs` 验证路由、模型和沙盒状态。

## 维护入口

- `routes.js` 维护版本、章节、工具与旧地址映射。`platform.js` 实现工作空间目录、当前位置、上一页与下一页。
- `content.js` 和 `app.js` 维护 V1.0 战略内容与交互。原商业价值模拟器位于 `/v1/business/simulator/`。
- `strategy-v2.js`、`growth-conversion.js` 和 `growth-rhythm.js` 维护 V2.0 双引擎与六个研究模块。
- `experience-lab.js` 承接产品沙盒，`growth-lab.js` 承接联动后台与既有模型，`growth-workbenches.js` 和 `growth-models.js` 维护六个独立商业工作台及公式。
- `guided-experience.js` 维护跨页新手引导与独立工具引导。影片、封面和字幕位于 `assets/keynote/`，播放器位于 `/v2/launch/`。

旧分享片段（如 `/#strategy-v1`、`/#experience-lab`、`/#lab-increment`）会定位到对应地址。原页面级兼容入口仍可访问。

## 模拟状态

产品与后台共用 `consumer-engine.js` 的模拟消费者和 `sandbox-state.js` 的规则。每个商业工作台独立保存当前输入。状态通过 `sessionStorage` 存在当前浏览器标签页，支持切换页面、刷新、前进及后退。切换产品场景、主动重置或显式开启引导会按相应操作重新初始化样例。
