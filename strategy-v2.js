import { guideEntry } from './guided-experience.js?v=1';

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

const filmChapters = [
  [0,'00:00','从战略到产品'],
  [30,'00:30','产品体验操作'],
  [70,'01:10','商业验证操作'],
  [105,'01:45','战略收口'],
];

function filmContainer() {
  return `<section class="v2-film" id="launch-film-section" aria-labelledby="v2-film-title">
    <div class="v2-film-cover"><img src="./assets/keynote/cover.jpg" alt="" loading="lazy" width="1280" height="720"></div>
    <div class="v2-film-description"><p class="eyebrow">One-Take · 02:00</p><h3 id="v2-film-title">从战略构想到消费者智能经营</h3><p>管理层产品发布与操作教学 · 中文旁白与字幕</p></div>
    <div class="keynote-player">
      <video id="launch-film" controls playsinline preload="none" poster="./assets/keynote/cover.jpg"
        src="./assets/keynote/sundaily-keynote-1080p.mp4" aria-labelledby="v2-film-title">
        <track kind="captions" srclang="zh-CN" label="简体中文" src="./assets/keynote/subtitles.zh.vtt" default>
      </video>
      <p id="launch-film-status" role="status" hidden>影片暂未加载。可重试播放或先进入引导体验。</p>
      <nav class="keynote-chapters" aria-label="影片章节">${filmChapters.map(([seconds, stamp, label])=>
        `<button class="button button-small" type="button" data-keynote-time="${seconds}"><time>${stamp}</time> ${label}</button>`).join('')}</nav>
      <p class="note keynote-credit">普通话合成配音采用 Piper Chaowen。Hi-Fi TTS 数据集（Cori Samuel，读者 92）按
        <a href="https://www.openslr.org/109/" target="_blank" rel="noopener">CC BY 4.0</a> 署名。</p>
    </div>
    ${guideEntry()}
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
  const status = root.querySelector('#launch-film-status');
  const sectionFilm = root.querySelector('#launch-film-section');
  const replay = root.querySelector('#keynote-replay');
  let chapterTime=null;
  video.addEventListener('loadedmetadata',()=>{
    if(chapterTime!==null){video.currentTime=chapterTime;chapterTime=null;}
  });
  function seek(time) {
    if(video.readyState===0){
      chapterTime=time;
      if(video.preload==='none'||video.error){
        video.preload='metadata';
        video.load();
      }
    }else{
      video.currentTime=time;
    }
    video.scrollIntoView({block:'center'});
    video.focus({preventScroll:true});
  }
  sectionFilm.querySelectorAll('[data-keynote-time]').forEach(button => button.addEventListener('click', () => seek(Number(button.dataset.keynoteTime))));
  video.addEventListener('error',()=>{status.hidden=false;});
  video.addEventListener('loadeddata',()=>{status.hidden=true;});
  video.addEventListener('ended',()=>{
    sectionFilm.classList.add('keynote-ended');
    replay.hidden=false;
    sectionFilm.querySelector('[data-guide-start]').focus({preventScroll:true});
  });
  replay.addEventListener('click',()=>{
    sectionFilm.classList.remove('keynote-ended');
    seek(0);
    video.play().catch(()=>{status.hidden=false;});
  });
}
