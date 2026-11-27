# 圣迪乐 Omega-3 消费者智能经营系统 V2.0

[新版首页](https://roderickren1.github.io/sundaily-omega3-strategy/) · [V1.0 完整战略](https://roderickren1.github.io/sundaily-omega3-strategy/#strategy-v1) · [V2.0 经营深化](https://roderickren1.github.io/sundaily-omega3-strategy/#growth-strategy) · [产品体验实验室](https://roderickren1.github.io/sundaily-omega3-strategy/#experience-lab) · [商业验证实验室](https://roderickren1.github.io/sundaily-omega3-strategy/#growth-lab)

V2.0 在原有的会员战略与组织设计之上，加入消费者转化、动态需求补货、会员产品和经营验证。原有章节锚点继续可用，原商业价值模拟器位于商业验证实验室，保留 `#simulator` 地址。

## 本地预览

在项目目录运行 `python3 -m http.server 8080`，访问 `http://localhost:8080/`。静态 HTML、CSS 和 JavaScript，无需安装依赖或构建。GitHub Pages 从 `main` 分支根目录发布。

## 维护入口

- `content.js` 维护 V1.0 战略与行业案例证据说明。
- `strategy-v2.js`、`growth-conversion.js`、`growth-rhythm.js` 维护 V2.0 双引擎与六个深化模块。
- `consumer-engine.js` 维护产品前台与联动后台的会话内状态。两者使用 `sandbox-state.js` 的统一经营规则。
- `experience-lab.js` 承接产品体验，`growth-lab.js` 保留联动演示，`growth-workbenches.js` 与 `growth-models.js` 维护六个商业验证工作台及公式。
- 发布影片、封面和中文字幕位于 `assets/keynote/`，播放与章节定位由 `strategy-v2.js` 管理。
- `guided-experience.js` 实现全程新手引导与六个独立工作台引导，以实际页面事件和经营状态确认操作。

## 产品体验沙盒

在产品体验实验室切换六个场景。切换桌面模式或移动端视角会继续使用当前共享状态，切换场景或重置会重新初始化。订单、履约、权益、家庭、授权、时间和事件仅在当前页面模拟。

`sandbox-state.js` 集中维护情景数据、交易和计划状态、权益与下一步决策。商业验证工作台独立管理人口参数、实验样本及决策场景。经营规则工作台直接复用产品体验的规则函数。

运行 `node --test tests/*.test.mjs` 验证经营模型及沙盒状态。
