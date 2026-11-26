const engines = [
  {
    id: 'conversion',
    name: '消费者转化引擎',
    english: 'Conversion Engine',
    steps: ['触达', '利益感知', '入会', '首购', '二购'],
    detail: '从真实入口识别访问意图，用可感知权益和有依据的商品信息降低阻力，再以体验和真实补货需求承接下一次购买。',
    chapter: '#conversion',
  },
  {
    id: 'replenishment',
    name: '动态补货引擎',
    english: 'Replenishment Engine',
    steps: ['需求识别', '周期估计', '补货确认', '持续复购', '家庭关爱'],
    detail: '分别观察家庭消耗、品类购买和品牌复购。持续校准需求窗口，经消费者确认再承接补给。',
    chapter: '#rhythm-research',
  },
];

export const v2ModuleLinks = [
  ['decision', '消费者购买决策'],
  ['conversion', '全域转化链路'],
  ['first-repeat', '首购与二购'],
  ['rhythm-research', '家庭消费周期'],
  ['rhythm-product', '周期购产品与 UX'],
  ['consumer-intelligence', '数据触发与验证'],
];

function filmContainer() {
  return `<section class="v2-film" id="launch-film-section" aria-labelledby="v2-film-title">
    <div class="v2-film-cover"><img src="./assets/hero-egg.jpg" alt="" loading="lazy" width="1280" height="1280"></div>
    <div class="v2-film-description"><p class="eyebrow">One-Take · 30 秒</p><h3 id="v2-film-title">产品发布影片</h3><p id="launch-film-status" role="status">正式影片待接入。</p></div>
    <video id="launch-film" controls playsinline preload="none" poster="./assets/hero-egg.jpg" data-film-src="" aria-labelledby="v2-film-title" hidden></video>
  </section>`;
}

export function v2Overview() {
  return `<div class="v2-evolution" aria-label="从战略到经营能力的演进">
    <div><p class="eyebrow">V1.0 · Strategy</p><h3>建立战略基础</h3><p>明确品牌会员的定位和价值主张，建立六大体系、增长机制与组织保障。</p><a href="#strategy-v1">阅读完整战略</a></div>
    <div><p class="eyebrow">V2.0 · Operating System</p><h3>深化关键经营能力</h3><p>理解每一次购买和下一次真实需求，用可体验的产品和可验证的经营模型推进落地。</p><a href="#growth-strategy">进入经营深化</a></div>
  </div>
  <section class="v2-engines" id="engines" aria-labelledby="v2-engines-title">
    <header><p class="eyebrow">Operating Architecture</p><h3 id="v2-engines-title">两个引擎，同一个经营中枢。</h3><p>两项能力深化原有六大会员体系，共同服务 Stage 0 的自主品牌会员规模增长，并为周期复购和单客价值积累能力。</p></header>
    <div class="v2-engine-diagram">
      <svg viewBox="0 0 900 170" preserveAspectRatio="none" aria-hidden="true"><path data-engine-wire="conversion" d="M140 42 C140 114 285 135 450 135"/><path data-engine-wire="replenishment" d="M760 42 C760 114 615 135 450 135"/><circle cx="450" cy="135" r="5"/></svg>
      <div class="v2-engine-buttons" role="group" aria-label="双引擎">
      ${engines.map(({ id, name, english }, index) => `<button type="button" data-engine="${id}" aria-pressed="${index === 0}" aria-controls="v2-engine-detail"><span>${english}</span><strong>${name}</strong></button>`).join('')}</div>
      <div class="v2-engine-hub"><strong>统一消费者身份</strong><span>Consumer Passport · Next Best Action</span></div>
    </div>
    <div class="v2-engine-detail" id="v2-engine-detail" aria-live="polite"></div>
    <p class="v2-engine-outcome"><strong>共同目标</strong><span>会员规模增长 · 周期复购 · 单客价值增长</span></p>
  </section>
  ${filmContainer()}`;
}

export function moduleDirectory() {
  return `<nav class="v2-module-index" aria-label="V2.0 六大经营深化模块">
    ${v2ModuleLinks.map(([id, label], index) => `<a href="#${id}"><small>0${index + 1}</small><span>${label}</span></a>`).join('')}
  </nav>`;
}

export function bindV2Overview(root = document) {
  const section = root.querySelector('#engines');
  const buttons = [...section.querySelectorAll('[data-engine]')];
  const detail = root.querySelector('#v2-engine-detail');

  function choose(id) {
    const selected = engines.find(engine => engine.id === id);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.engine === id)));
    section.dataset.activeEngine = id;
    detail.innerHTML = `<ol class="v2-inline-steps">${selected.steps.map(step => `<li>${step}</li>`).join('')}</ol>
      <p>${selected.detail}</p><div class="v2-engine-links"><a href="${selected.chapter}">阅读${selected.name}</a><a href="#experience-lab">进入产品体验</a></div>`;
  }
  buttons.forEach(button => button.addEventListener('click', () => choose(button.dataset.engine)));
  choose(engines[0].id);

  const video = root.querySelector('#launch-film');
  const source = video.dataset.filmSrc.trim();
  if (source) {
    const status = root.querySelector('#launch-film-status');
    const filmLink = root.querySelector('#hero-film-link');
    video.addEventListener('loadedmetadata', () => {
      video.hidden = false;
      status.hidden = true;
      filmLink.textContent = '30 秒发布影片';
    });
    video.addEventListener('error', () => {
      video.hidden = true;
      status.hidden = false;
      status.textContent = '影片暂未加载，请稍后重试。';
      filmLink.textContent = '30 秒发布影片 · 暂未加载';
    });
    video.preload = 'metadata';
    video.src = source;
  }
}
