# 圣迪乐 Omega-3 消费者智能经营系统 V2.0

[新版首页](https://roderickren1.github.io/sundaily-omega3-strategy/) · [V1.0 完整战略](https://roderickren1.github.io/sundaily-omega3-strategy/#strategy-v1) · [V2.0 经营深化](https://roderickren1.github.io/sundaily-omega3-strategy/#growth-strategy) · [产品体验实验室](https://roderickren1.github.io/sundaily-omega3-strategy/#experience-lab) · [商业验证实验室](https://roderickren1.github.io/sundaily-omega3-strategy/#growth-lab)

V2.0 在原有的会员战略与组织设计之上，加入消费者转化、动态需求补货、会员产品和经营验证。原有章节锚点继续可用，原商业价值模拟器位于商业验证实验室，保留 `#simulator` 地址。

## 本地预览

在项目目录运行 `python3 -m http.server 8080`，访问 `http://localhost:8080/`。静态 HTML、CSS 和 JavaScript，无需安装依赖或构建。GitHub Pages 从 `main` 分支根目录发布。

## 维护入口

- `content.js` 维护 V1.0 战略与行业案例证据说明。
- `strategy-v2.js`、`growth-conversion.js`、`growth-rhythm.js` 维护 V2.0 双引擎与六个深化模块。
- `consumer-engine.js` 维护两个实验室共享的会话内模拟状态及决策规则，刷新重置。用户没有账号、支付和真实订单接入。
- `experience-lab.js` 与 `growth-lab.js` 分别承接前台产品体验和商业验证。
- 正式影片交付后，在 `strategy-v2.js` 的 `launch-film` 元素上设置 `data-film-src`。影片加载成功时显示原生控件。
