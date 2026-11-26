import {
  chapters, overview, opportunities, equity, research, benchmarks, family, dimensions, principles,
  privileges, rewards, prototype, systems, migration, passport, ecosystem, mechanisms, flywheels, flywheelTransitions,
  models, organizationLoop, exchanges, stages, priorities, assumptions,
} from './content.js?v=4';
import { v2Overview, moduleDirectory, bindV2Overview, v2ModuleLinks } from './strategy-v2.js?v=4';
import { conversionModules, bindConversionModules } from './growth-conversion.js?v=4';
import { rhythmModules, bindRhythmModules } from './growth-rhythm.js?v=4';
import { experienceLab, bindExperienceLab } from './experience-lab.js?v=4';
import { growthLab, bindGrowthLab } from './growth-lab.js?v=4';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const list = (items) => items.map(([title, body]) => `<div><dt>${title}</dt><dd>${body}</dd></div>`).join('');
const facts = (items, className = '') => `<dl class="facts ${className}">${list(items)}</dl>`;
const accordion = (items) => `<div class="accordion">${items.map(([title, body]) => `<details><summary>${title}</summary><p>${body}</p></details>`).join('')}</div>`;
const table = (headings, rows, classes = '') => `<div class="table-scroll" role="region" aria-label="${headings[0]}" tabindex="0"><table class="${classes}"><thead><tr>${headings.map((label) => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows.map(([title, ...values]) => `<tr><th scope="row">${title}</th>${values.map((value) => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const flow = (labels) => `<ol class="linear-flow">${labels.map((label) => `<li>${label}</li>`).join('')}</ol>`;
const sub = (title, html, note = '', id = '') => `<div class="subsection"${id ? ` id="${id}"` : ''}><h3>${title}</h3>${note ? `<p class="intro">${note}</p>` : ''}${html}</div>`;
const choices = (id, labels) => `<div class="choices" id="${id}" role="group" aria-label="${({ 'research-filters': '研究课题', 'architecture-choice': '会员价值结构', 'phone-choice': '会员价值账户入口', 'flywheel-choice': '增长飞轮', 'model-choice': '组织模式', 'stage-choice': '战略演进阶段' })[id] || '切换视图'}">${labels.map((label, index) => `<button type="button" data-choice="${index}" aria-pressed="${index === 0}">${label}</button>`).join('')}</div>`;
const systemLinks = () => `<div class="system-links">${systems.map(([name], index) => `<a href="#system-${index + 1}"><small>${String(index + 1).padStart(2, '0')}</small>${name}</a>`).join('')}</div>`;

function section(id, title, introduction, body, className = '') {
  const index = chapters.findIndex(([key]) => key === id);
  const [, label, english] = chapters[index];
  const next = chapters[index + 1];
  const continuation = next ? `<div class="chapter-next"><a href="#${next[0]}"><span>下一章</span><strong>${next[1]}</strong></a></div>` : '';
  return `<section id="${id}" class="chapter ${className}" aria-labelledby="heading-${id}">
    <div class="wrap"><header class="chapter-heading"><p class="eyebrow"><span>${label}</span> <span>${english}</span></p><h2 id="heading-${id}">${title}</h2>${introduction ? `<p class="intro">${introduction}</p>` : ''}</header>${body}${continuation}</div></section>`;
}

function circuit(id, labels, center, type = 'cycle') {
  const count = labels.length;
  const position = (index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    return [50 + Math.cos(angle) * 35, 50 + Math.sin(angle) * 36];
  };
  const positions = labels.map((_, index) => position(index));
  const arcs = positions.map(([x, y], index) => {
    const [endX, endY] = positions[(index + 1) % count];
    const [midX, midY] = position(index + 0.5);
    return `<path data-edge="${index}" d="M ${x * 6} ${y * 4} A 210 144 0 0 1 ${midX * 6} ${midY * 4} A 210 144 0 0 1 ${endX * 6} ${endY * 4}" marker-mid="url(#arrow-${id})"/>`;
  });
  const spokes = type === 'map' ? positions.map(([x, y], index) => `<path data-edge="${index}" class="spoke" d="M 300 200 L ${x * 6} ${y * 4}"/>`) : [];
  return `<div id="${id}" class="circuit ${type}" role="group" aria-label="${center[0]}">
    <svg viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="arrow-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path fill="#a76230" stroke="none" d="M0 0 L10 5 L0 10 Z"/></marker></defs>
    ${type === 'cycle' ? arcs.join('') : `<ellipse cx="300" cy="200" rx="210" ry="144"/>${spokes.join('')}`}</svg>
    <div class="circuit-center"><strong>${center[0]}</strong><span>${center[1]}</span></div>
    ${labels.map((label, index) => `<button type="button" class="circuit-node${type === 'map' && index === 5 ? ' reserve' : ''}" style="--x:${positions[index][0]}%;--y:${positions[index][1]}%" data-node="${index}" aria-pressed="false">${label}</button>`).join('')}
  </div>`;
}

const miniLoops = flywheels.map(([title, labels, feedback], index) => `<article class="mini-loop">
  ${circuit(`panorama-${index}`, labels, [title, '持续反哺'])}<p>${feedback}</p></article>`).join('');
const businessSimulator = sub('商业价值模拟器', `<div class="simulator"><form id="scenario" aria-label="商业价值测算假设"><div class="sim-heading"><span class="eyebrow">演示假设</span><button class="button button-small" type="reset">恢复默认</button></div>
      ${assumptions.map(([label, value, min, max, step, unit], index) => `<div class="slider"><div><label for="assumption-${index}">${label}</label><output for="assumption-${index}" aria-live="off"></output></div><input id="assumption-${index}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><div class="range-ends"><span>${min.toLocaleString('zh-CN')}${unit}</span><span>${max.toLocaleString('zh-CN')}${unit}</span></div></div>`).join('')}
      <div class="scenario-actions"><button type="button" class="button button-small" id="scenario-zero">试算零归因</button><a class="scenario-results-link" href="#scenario-result">查看测算结果</a></div></form>
      <div class="sim-results" id="scenario-result" tabindex="-1" role="region" aria-label="商业价值测算结果"><p class="eyebrow">基于上述假设计算</p>
        <p class="scenario-takeaway">先估算会员关联消费，再用归因占比估算增量，最后按贡献率折算商业贡献。</p>
        <dl id="scenario-results"></dl>
        <figure id="scenario-chart"><figcaption>金额对比 · 以会员关联消费额为 100%</figcaption><div id="scenario-bars"></div></figure>
        <p id="scenario-announcement" role="status"></p>
      </div></div><p class="note">演示值仅用于说明口径。实际归因占比须用对照基线验证。增量商业贡献为假设增量消费额乘以贡献率，尚未扣除独立会员运营投入。</p>`, '调整规模、消费、归因及贡献率。试算零归因时，可识别的会员消费仍计入关联消费，测算的增量和贡献均为零。', 'simulator');

const strategyChapters = chapters.slice(
  chapters.findIndex(([id]) => id === 'why'),
  chapters.findIndex(([id]) => id === 'growth-strategy'),
);
const chapterMarkup = [
  section('overview', '从品牌会员出发，<br>经营长期消费者关系。', '当前处于 Stage 0。先建立自主品牌会员规模、基础权益和统一身份，再逐步深化单客经济。', `
    ${v2Overview()}
    <div class="overview-grid">${overview.map(([title, value]) => `<div><span>${title}</span><strong>${value}</strong></div>`).join('')}</div>
    <nav class="executive-index" aria-label="管理者快速阅读">
      <a href="#current-stage"><strong>现在先做什么</strong><span>Stage 0 三大任务</span></a>
      <a href="#system"><strong>经营如何落地</strong><span>六大体系和各自职责</span></a>
      <a href="#simulator"><strong>如何计算经营价值</strong><span>商业价值模拟器</span></a>
    </nav>
    ${sub('六大体系速览', systemLinks())}`),
  section('strategy-v1', '经营一人，<br>辐射一家。', '从自主品牌会员经营出发，构建以消费者洞察为驱动、以规模增长与单客经济为双轮的长期消费者经营体系。', `
    <p class="v1-phrase" lang="en">From Consumer to Family.</p>
    <nav class="v2-module-index" aria-label="V1.0 原有战略章节">${strategyChapters.map(([id, label], index) => `<a href="#${id}"><small>${String(index + 1).padStart(2, '0')}</small><span>${label}</span></a>`).join('')}</nav>`),
  section('why', '从经营商品，<br>到经营消费者。', '在商品经营之上积累消费者资产，让一次交易能为下一次选择创造价值。', `
    <div class="feature-split growth-compare">
      <div class="panel"><p class="eyebrow">传统交易驱动</p><h3>从投入走向成交</h3>${flow(['资源投入', '市场触达', '商品成交', '销售收入'])}<p>销售收入是单次交易链路的商业结果。</p></div>
      <div class="panel"><p class="eyebrow">消费者资产驱动</p>${circuit('equity-loop', equity.map(([label]) => label), ['消费者资产', '规模 × 单客价值'])}<p class="selection-note" id="equity-note" aria-live="polite"></p></div>
    </div>
    ${sub('五大战略机会', accordion(opportunities.map(([title, basis, meaning]) => [`${title} · ${basis}`, meaning])), '定性战略判断，供后续用真实经营数据验证。')}`),
  section('benchmark', '从跨行业案例中，<br>提取可迁移的经营能力。', '聚焦机制、适用情境和迁移局限。案例机制与商业效果因果验证采用不同证据。', `
    <div class="research-mast"><div><strong>14</strong><span>跨行业对标品牌</span></div><div><strong>5</strong><span>核心研究命题</span></div></div>
    <details class="v2-evidence-details"><summary>资料证据与经营口径</summary>${facts([
      ['已确认战略共识', '圣迪乐的经营原则、Stage 0 优先级和长期组织方向。'],
      ['待验证经营假设', '待通过消费者研究、用户测试及有对照的经营试点验证。'],
      ['已核验行业事实', '以各案例所列原始资料及其覆盖范围为准。未找到一手资料的内容标明来源待复核。'],
      ['模拟经营数据', '用于展示计算、比较和规则反馈。'],
      ['产品概念演示', '使用会话内虚拟状态展示前后台行为。'],
    ])}</details>
    ${sub('三个战略级参照', `<div class="research-conclusion"><p>消费者洞察驱动的单客经济</p>${facts([['孩子王', '关系驱动'], ['欧莱雅', '洞察驱动'], ['Nespresso', '长期消费关系']])}</div>`)}
    ${sub('五个研究课题', table(['研究课题', '对标品牌', '核心启示'], research.map(([label, insight], index) => [`<a href="#case-library" data-research-topic="${index + 1}">${label}</a>`, benchmarks.filter((item) => item[1] === index).map(([name]) => name).join('、'), insight])), '点击课题可查看该组案例。')}
    ${sub('行业案例探索', choices('research-filters', ['全部案例', ...research.map(([label]) => label)]) + '<p id="research-count" class="research-count" role="status"></p><div id="benchmark-cards" class="case-grid"></div>', '打开案例，先读可迁移的做法、适用边界和证据状态。', 'case-library')}`, 'tone-cream'),
  section('strategy', '经营长期消费者关系，<br>赢得下一次选择。', '愿景是成为消费者每一次鸡蛋购买决策中的第一选择。', `
    ${facts([['使命', '经营一人，辐射一家。'], ['当前业务定位', '独立自主品牌会员运营业务'], ['长期组织定位', '事业部消费者增长中心'], ['长期北极星目标', '消费者资产总价值持续增长']], 'fact-columns')}
    <div class="feature-split subsection">
      <div><h3>家庭辐射模型</h3><p class="intro">以个体为经营主体。家庭与社会关系属于价值辐射范围，家人可按自身意愿参与。</p><div class="concentric" id="family-orbit" role="group" aria-label="家庭关系层"><i class="rings" aria-hidden="true"></i><button type="button" data-choice="2" class="outer">社会关系</button><button type="button" data-choice="1" class="middle">家庭成员</button><button type="button" data-choice="0" class="inner">核心消费者</button></div><div id="family-info" class="selection-note" aria-live="polite"></div></div>
      <div><h3>单客经济四维模型</h3><div class="dimension-grid">${dimensions.map(([title, label, body]) => `<div><span>${label}</span><h4>${title}</h4><p>${body}</p></div>`).join('')}</div></div>
    </div>
    ${sub('十二项经营原则', accordion(principles))}`),
  section('value', '先创造值得加入的会员，<br>再让更多消费者加入。', '以高端专属礼遇和家庭关爱，让经济与情感价值共同驱动长期关系。', `
    <div class="value-duet"><article class="glass"><span class="eyebrow">Economic Value</span><h3>经济价值</h3><p>直接消费回馈、长期消费权益、商品服务与采购便利性。</p></article><article class="glass"><span class="eyebrow">Emotional Value</span><h3>情感价值</h3><p>品牌认可、家庭关爱、专属体验、参与共创与长期陪伴。</p></article></div>
    <p class="pullquote">确定的利益，意外的心意。</p>
    ${sub('1—2—3—6 会员产品模型', choices('architecture-choice', ['1 个统一身份', '2 条成长轨道', '3 层会员价值', '6 大礼遇产品']) + '<div id="architecture-panel" class="state-panel" aria-live="polite"></div>', '统一品牌身份承接消费贡献和关系忠诚。蛋卡、月卡、季卡、年卡属于商品体系。')}
    ${sub('三种奖励机制', facts(rewards, 'fact-columns'), '回馈基于真实消费或关系节点。积分比例、返利金额与兑换门槛待后续验证。')}
    <div class="feature-split subsection presentation-pair"><div><p class="eyebrow">Shareable Premium</p><h3>可分享的高端</h3>${facts([['个人专属权益', '因为我是会员，所以我享有与众不同的价值。'], ['家庭关爱与共享权益', '因为我是会员，所以我也有能力让在乎的人享受到更好的价值。分享范围以具体礼遇规则为准。']])}</div>
      <div class="phone" aria-label="会员产品概念原型"><div class="phone-top"><span>会员产品概念原型</span><i aria-hidden="true"></i></div><div class="phone-card"><small>SUNDaily Omega-3</small><strong>每一次选择，<br>皆有心意。</strong></div>${choices('phone-choice', prototype.map(([title]) => title))}<div class="phone-state" id="phone-state" aria-live="polite"></div></div>
    </div>`, 'tone-cream'),
  section('system', '六大体系，<br>一个消费者经营中枢。', '战略设计以消费者洞察连接价值、规模、关系、资产与创新。会员生态为未来建设储备。', `
    <p class="system-instruction" id="system-instruction">选择图中的体系，查看它的职责。进入详情后，可以直接切换相邻体系。</p>
    <div class="system-stage" id="system-explorer"><div class="system-map">${circuit('systems-map', systems.map(([label]) => label), ['消费者洞察中枢', 'Consumer Intelligence'], 'map')}</div><div id="system-brief" class="glass system-brief" aria-live="polite"></div></div>
    <div class="system-content" id="system-content"></div>`, 'tone-dark'),
  section('growth', '每一次消费者经营，<br>都能反哺下一次增长。', '消费贡献建立经济关系，礼遇把信任传给家庭，洞察驱动创新，真实故事帮助触达新消费者。', `
    ${sub('四大增长飞轮', '<p class="loop-linkage">消费体验推动关系传播，关系带来新增消费者。消费与反馈沉淀洞察，创新丰富商品与真实内容，内容触达再带动消费。</p>' + choices('flywheel-choice', ['全景', ...flywheels.map(([label]) => label)]) + `<div id="flywheel-panel"><div class="mini-loop-grid">${miniLoops}</div></div>`, '选择一个飞轮或点击图中节点，查看每一步如何带来下一步。', 'flywheel-explorer')}
    ${sub('十大经营机制', `<div class="mechanism-links">${mechanisms.map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}</div>`)}`, 'tone-cream'),
  section('business', '规模增长 × 单客经济。', '前期用新增和累计会员建立消费者资产基本盘。长期通过复购、忠诚、家庭消费份额和关系价值深化单客经济。', `
    <div class="value-duet"><article class="glass"><span class="eyebrow">当前重点</span><h3>规模增长</h3><p>消费者获取、新增会员与累计规模。</p></article><article class="glass"><span class="eyebrow">长期重点</span><h3>单客经济</h3><p>复购、忠诚、家庭消费份额与长期价值。</p></article></div>
    ${sub('六大商业价值', facts([['规模增长', '沉淀可识别的自主品牌会员资产。'], ['消费增量', '验证因会员机制额外发生的消费。'], ['忠诚留存', '延长关系并提升品牌第一选择意愿。'], ['经营效率', '优化获取、触达和权益投入效率。'], ['品牌关系', '以专属礼遇深化信任与家庭关爱。'], ['创新增长', '将真实需求转化为商品与场景机会。']], 'fact-columns'))}
    <p class="decision-lab-link"><a class="button" href="#simulator">打开商业价值模拟器</a></p>
    ${sub('三层商业统计口径', facts([['会员关联消费', '所有能够识别的会员消费。'], ['会员运营影响消费', '与会员机制存在可识别关联的消费。'], ['可归因增量贡献', '相对于合理对照基线，由会员运营额外创造的价值。']], 'definition-stack'), '三层口径须分别测量，会员关联消费不能直接计作新增业绩。')}`),
  section('organization', '独立经营，协同赋能，<br>逐步升级。', '建立能够独立承担经营结果、并持续向事业部输出消费者洞察的组织能力。', `
    ${sub('当前与未来组织形态', choices('model-choice', models.map(([label]) => label)) + '<div id="model-panel" class="state-panel" aria-live="polite"></div>')}
    ${sub('四大组织职能', facts([['消费者增长', '拉新、激活、消费转化、关系增长。'], ['会员价值经营', '会员产品、权益、生命周期、忠诚。'], ['消费者资产与洞察', '身份、数据资产、需求研究、全域赋能。'], ['消费者创新与生态', 'SUNDaily LAB、创新机会及未来生态。']], 'fact-columns'), '经营策略、数字化能力和商业价值评估共同支撑四大职能，编制与部门设置待定。')}
    ${sub('全域经营闭环', `<div class="feature-split"><div class="panel">${circuit('org-loop', organizationLoop.map(([label]) => label), ['全域经营', '经营 → 洞察 → 经营'])}<div class="bypass"><strong>直接入会</strong><span>商品 · 内容 · 活动 · 家庭推荐 → 会员运营</span></div></div><div class="org-loop-notes">${facts(organizationLoop)}<p class="selection-note" id="org-note" aria-live="polite"></p></div></div>`)}
    ${sub('跨部门双向价值交换', table(['部门', '协同输入', '会员运营反哺'], exchanges))}
    ${sub('三类战略资源池', facts([['BUILD · 基础建设池', '会员产品、统一身份、数字化及组织能力。'], ['GROW · 规模增长池', '拉新、会员权益、激活、消费转化。'], ['INNOVATE · 价值创新池', '忠诚经营、消费者洞察、商品创新。']], 'fact-columns'), '前期优先 BUILD 和 GROW。以相对独立的经营预算为主，重大专项审批为补充。')}
    ${sub('四维经营考核', facts([['Scale · 规模', '新增会员、累计会员、渠道拉新贡献。'], ['Value · 价值', '消费转化、复购、真实增量贡献。'], ['Capability · 能力', '会员产品、资产体系、拉新机制、消费者洞察。'], ['Efficiency · 效率', 'CAC、权益成本、资源投入产出。']], 'fact-columns') + facts([['L1 核心经营考核', '新增会员、累计会员、体系建设。'], ['L2 经营健康监测', '注册转化率、CAC、激活率、首购率、二购率、复购率、权益成本。'], ['L3 长期战略研究', 'LTV、家庭消费份额、第一选择率、增量贡献、创新商业价值。']], 'definition-stack'), '前期看规模，中期看转化，长期看忠诚，始终看能力。')}`, 'tone-cream'),
  section('roadmap', '从 0 到 1，<br>再从 1 到长期增长。', '阶段依据能力成熟度划分。当前为 Stage 0，拉新与基本盘建设同步启动。', `
    ${choices('stage-choice', stages.map(([label], index) => `<small>Stage ${index}</small>${label}`))}
    <div id="stage-panel" class="state-panel" aria-live="polite"></div>
    ${sub('体系建设优先级', table(['经营体系', 'S0', 'S1', 'S2', 'S3', 'S4'], priorities.map((row, index) => [`<a href="#system-${index + 1}">${systems[index][0]}</a>`, ...row.map((value) => `<span class="priority" data-priority="${value}">${value}</span>`)]), 'priority-table'), '矩阵呈现定性战略优先级。预算与资源比例独立决策。')}
    ${sub('当前阶段三大任务', facts([['建规模', '以新增会员规模为核心经营成果。'], ['建能力', '建立会员产品、统一身份、获取及持续经营能力。'], ['证价值', '逐步验证真实消费、长期忠诚与企业经营价值。']], 'fact-columns'), '', 'current-stage')}`),
  section('summary', '从品牌会员到<br>消费者增长中心。', '北极星目标是消费者资产总价值持续增长。', `
    <div class="summary-map">
      <a class="map-primary" href="#strategy"><small>战略定位</small><strong>消费者增长中心</strong><span>当前自主会员经营 → 未来全域消费者经营</span></a>
      <div class="map-pair"><a href="#business"><small>双轮商业驱动</small><strong>规模增长 × 单客经济</strong></a><a href="#value"><small>双价值主张</small><strong>经济价值 × 情感价值</strong></a></div>
      <div class="map-systems"><a href="#system" class="map-hub">消费者洞察中枢</a>${systemLinks()}</div>
      <div class="map-pair"><a href="#flywheel-explorer"><small>四大增长飞轮</small><strong>消费 · 关系 · 创新 · 内容</strong></a><a href="#simulator"><small>商业成果</small><strong>会员规模 · 单客价值 · 全域增量</strong></a></div>
      <a class="map-primary" href="#organization"><small>底层保障</small><strong>组织机制 · 资源配置 · 数字化能力 · 经营考核</strong></a>
    </div>
    ${facts([['短期', '独立的品牌会员增长业务。'], ['中期', '持续创造消费价值、沉淀消费者资产的经营系统。'], ['长期', '事业部理解消费者、经营消费者、发现新增商业机会的消费者增长中心。']], 'fact-columns summary-horizon')}
    <details class="scope-note"><summary>方案边界与待验证事项</summary><p>实际会员目标、年度预算、权益成本与返利比例、KPI 权重、人员编制、数字化选型、试点与 SOP、渠道数据可用范围、合作协议与品牌体验资源均待确认。站内机制为战略设计，商业模拟为演示假设，行业案例按来源状态标注。</p></details>
    <div class="closing"><img src="./assets/mark.svg" alt="" width="52" height="52"><p>经营一人，辐射一家。</p><span lang="en">Every choice matters. Every family matters.</span></div>`, 'tone-dark'),
  section('growth-strategy', '把战略变成可重复的经营能力。', '用利益降低门槛，用需求建立习惯，用体验巩固忠诚。沿六个模块从一次购买走向长期的家庭补给。', `
    ${moduleDirectory()}${conversionModules()}${rhythmModules()}`, 'v2-growth'),
  section('experience-lab', '体验同一个家庭，<br>如何被持续服务。', '在会员前台做一次选择，同时观察 Growth Console 里的消费者档案、需求与经营动作如何响应。', experienceLab(), 'v2-lab v2-experience'),
  section('growth-lab', '看见下一步，<br>验证真实增量。', '在模拟经营台选择家庭、调整假设、提交反馈。用同一份状态解释补给窗口与决策，再用比较工具验证商业口径。', `${growthLab()}${businessSimulator}`, 'v2-lab v2-validation'),
];

$('#chapters').innerHTML = chapterMarkup.join('');

const primaryChapters = [
  ['overview', '战略总览', ''],
  ['strategy-v1', '完整战略', 'V1.0'],
  ['growth-strategy', '经营深化', 'V2.0'],
  ['experience-lab', '产品体验实验室', ''],
  ['growth-lab', '商业验证实验室', ''],
];
$('#nav').innerHTML = primaryChapters.map(([id, label, version]) => `<a href="#${id}">${label}${version ? ` <small>${version}</small>` : ''}</a>`).join('');
$('#mobile-nav').innerHTML = [
  ['SUNDaily Consumer OS', primaryChapters],
  ['V1.0 · 完整战略', strategyChapters],
  ['V2.0 · 经营深化', v2ModuleLinks],
].map(([heading, links]) => `<div class="directory-group"><strong>${heading}</strong>${links.map(([id, label]) => `<a href="#${id}">${label}</a>`).join('')}</div>`).join('');

function select(container, index, selector = '[data-choice]') {
  $$(selector, container).forEach((button, key) => button.setAttribute('aria-pressed', String(key === index)));
}

function handleChoices(container, render) {
  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-choice]');
    if (button) render(Number(button.dataset.choice));
  });
}

function activateCircuit(element, index) {
  select(element, index, '[data-node]');
  $$('[data-edge]', element).forEach((edge) => edge.classList.toggle('active-edge', Number(edge.dataset.edge) === index));
}

function bindCircuit(element, render) {
  const highlight = (button) => {
    $$('[data-edge]', element).forEach((edge) => edge.classList.toggle('hover-edge', edge.dataset.edge === button?.dataset.node));
  };
  element.addEventListener('pointerover', (event) => highlight(event.target.closest('[data-node]')));
  element.addEventListener('pointerleave', () => highlight(null));
  element.addEventListener('focusin', (event) => highlight(event.target.closest('[data-node]')));
  element.addEventListener('focusout', () => highlight(null));
  element.addEventListener('click', (event) => {
    const button = event.target.closest('[data-node]');
    if (button) render(Number(button.dataset.node), event);
  });
}

function circuitDetails(id, labels, output) {
  const element = $(id);
  const render = (index) => {
    activateCircuit(element, index);
    const [title, text] = labels[index];
    $(output).innerHTML = `<strong>${title}</strong> · ${text}`;
  };
  bindCircuit(element, render);
  render(0);
}

circuitDetails('#equity-loop', equity, '#equity-note');
circuitDetails('#org-loop', organizationLoop, '#org-note');

const dialog = $('#detail-dialog');
let visibleCases = [];

function openCase(index) {
  const [brand, group, background, mechanism, logic, transfer, limit, evidence, source] = benchmarks[index];
  const position = visibleCases.indexOf(index);
  const neighborButton = (label, neighbor) => `<button type="button" class="button button-small" data-neighbor="${neighbor ?? ''}"${neighbor === undefined ? ' disabled' : ''}>${label}</button>`;
  $('#dialog-body').innerHTML = `<span class="eyebrow">${research[group][0]}</span><h2 id="dialog-title" tabindex="-1">${brand}</h2>
    <div class="case-navigation" role="group" aria-label="当前筛选中的案例">
      <span>第 ${position + 1} / ${visibleCases.length} 个案例</span>
      <div>${neighborButton('上一案例', visibleCases[position - 1])}${neighborButton('下一案例', visibleCases[position + 1])}</div>
    </div>
    ${facts([['圣迪乐迁移方向', transfer], ['迁移局限', limit], ['来源及证据状态', `${evidence}${source ? `<br><a href="${source}" target="_blank" rel="noopener noreferrer">查看官方原始资料</a>` : ''}`], ['参考机制', mechanism], ['经营逻辑', logic], ['品牌背景', background]])}`;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  $('#dialog-title').focus({ preventScroll: true });
}
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
  const neighbor = event.target.closest('button[data-neighbor]');
  if (neighbor && !neighbor.disabled) openCase(Number(neighbor.dataset.neighbor));
});

function renderCases(index) {
  select($('#research-filters'), index);
  visibleCases = [...benchmarks.keys()].filter((key) => index === 0 || benchmarks[key][1] === index - 1);
  $('#research-count').textContent = `显示 ${visibleCases.length} / ${benchmarks.length} 个案例`;
  $('#benchmark-cards').innerHTML = visibleCases.map((key) => {
    const [name, group, , mechanism, , , , , source] = benchmarks[key];
    return `<button type="button" class="case-card" data-case="${key}" aria-haspopup="dialog" aria-controls="detail-dialog"><small>${research[group][0]}</small><strong>${name}</strong><span class="case-mechanism">${mechanism}</span><span class="case-action"><span class="case-link">查看案例</span><span class="case-evidence">${source ? '含官方资料' : '来源待复核'}</span></span></button>`;
  }).join('');
}
handleChoices($('#research-filters'), renderCases);
$('#benchmark-cards').addEventListener('click', (event) => {
  const card = event.target.closest('[data-case]');
  if (card) openCase(Number(card.dataset.case));
});
renderCases(0);

function renderFamily(index) {
  $('#family-orbit').dataset.layer = index;
  $$('[data-choice]', $('#family-orbit')).forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.choice) === index)));
  $('#family-info').innerHTML = `<strong>${family[index][0]}</strong><p>${family[index][1]}</p>`;
}
handleChoices($('#family-orbit'), renderFamily);
renderFamily(0);

const architecture = [
  facts([['统一会员身份', '以自主品牌身份承接入会、权益、可识别消费与关系记录，逐步连接各渠道。']]),
  facts([['消费贡献轨', '稳定、透明、确定性的经济回馈。'], ['关系忠诚轨', '长期关系认可与个性化专属礼遇。']], 'fact-columns'),
  facts([['基础价值', '值得加入。'], ['关系价值', '值得留下。'], ['独特价值', '难以替代。']], 'fact-columns'),
  table(['礼遇', '英文概念', '经营任务', '权益方向', '当前定位'], privileges),
];
function renderArchitecture(index) {
  select($('#architecture-choice'), index);
  $('#architecture-panel').innerHTML = architecture[index];
}
handleChoices($('#architecture-choice'), renderArchitecture);
renderArchitecture(0);

function renderPhone(index) {
  select($('#phone-choice'), index);
  const [, label, title, desc] = prototype[index];
  $('#phone-state').innerHTML = `<small>${label}</small><strong>${title}</strong><p>${desc}</p>`;
}
handleChoices($('#phone-choice'), renderPhone);
renderPhone(0);

const systemDetails = [
  () => `${facts([['一套统一身份', '用自主品牌身份承接可识别消费、价值与关系。'], ['两条成长轨', '以消费贡献提供透明经济回馈，以关系忠诚提供长期认可与个性化礼遇。'], ['三层价值与六类礼遇', '先建立值得加入的基础价值，再建设关系和独特价值。'], ['价值账户', '将标准化基础权益、个性化专属礼遇与三种奖励机制放在简洁前台。']], 'fact-columns')}<a class="button" href="#value">查看完整会员产品架构</a>`,
  () => `${facts([['基本盘', '存量消费者资产化优先。'], ['增长盘', '增量消费者获取同步推进。'], ['放大器', '以家庭关爱、礼赠与真实推荐推动关系网络获客。']], 'fact-columns')}
    ${sub('两条获取路径', `<p>存量消费者</p>${flow(['匿名消费者', '身份识别', '消费会员', '长期忠诚'])}<p>潜在消费者</p>${flow(['目标人群', '价值吸引', '品牌会员', '消费会员'])}`)}
    ${sub('五个入口汇入统一会员资产池', facts([['商品连接', '包装、溯源、商品权益'], ['交易连接', '线上订单、线下真实消费'], ['场景连接', '品牌活动、垂类渠道、真实生活场景'], ['内容连接', '品牌传播、内容电商、UGC'], ['关系连接', '家庭关爱、礼赠、真实推荐']], 'fact-columns'))}
    <p class="note">核心成果包括新增会员、累计会员规模、注册转化及渠道拉新贡献。</p>`,
  () => `${circuit('lifecycle-loop', lifecycle.map(([label]) => label), ['品牌第一选择权', 'First Choice'])}<p class="selection-note" id="lifecycle-note" aria-live="polite"></p>
    <p class="note">流失预警、需求识别和关系修复贯穿生命周期。</p>
    ${sub('消费者价值迁移', '<div class="migration-rows">' + migration.map(([from, to], index) => `<button aria-pressed="${index === 0}" data-migration="${index}"><span>${from}</span><span aria-hidden="true">⟶</span><strong>${to}</strong></button>`).join('') + '</div><p id="migration-note" class="selection-note" aria-live="polite"></p>', '状态可重叠，依据真实消费、传播与创新贡献识别，会员可直接进入适合的经营场景。')}
    ${sub('五项运营机制', facts([['消费成长', '识别从首购到稳定复购的真实消费变化。'], ['需求触发', '在补货及家庭需求等关键节点提供恰当价值。'], ['忠诚回馈', '认可长期消费和品牌第一选择意愿。'], ['关系拓展', '借由关爱、推荐和共创拓展关系价值。'], ['流失与关系修复', '识别风险，优先识别原因并修复体验。']], 'fact-columns'))}
    ${sub('三种活跃度', facts([['消费活跃', '主要经营依据，反映真实交易和复购。'], ['关系活跃', '深度经营依据，反映分享、推荐及共创。'], ['互动活跃', '辅助诊断。DAU、签到与发言仅反映部分数字互动。']], 'fact-columns'))}`,
  () => `${sub('四层消费者资产', flow(['连接资产', '行为资产', '洞察资产', '关系资产']))}
    ${sub('Consumer Passport · 六维消费者画像', circuit('passport-map', passport.map(([label]) => label), ['消费者画像', 'Consumer Passport'], 'map') + '<p class="selection-note" id="passport-note" aria-live="polite"></p>')}
    ${facts([['渐进式画像', '优先积累最小必要信息，再按真实场景沉淀。分别记录消费者主动表达、实际观察行为与品牌推断，并保护消费者隐私。'], ['洞察全域赋能', '为品牌、内容电商、货架、线下渠道、商品研发及会员运营提供依据。'], ['消费者资产池', '当前优先建设自主品牌会员资产，长期逐步形成事业部统一消费者资产池。']], 'fact-columns')}`,
  () => `<div class="lab-head"><span class="eyebrow">SUNDaily LAB</span><h4>让真实生活定义下一代商品。</h4><p>让会员先于市场体验创新，让市场共享会员创造的价值。</p></div>
    ${circuit('innovation-loop', innovation.map(([label]) => label), ['消费者驱动创新', 'SUNDaily LAB'])}<p class="selection-note" id="innovation-note" aria-live="polite"></p>
    ${sub('三大创新资产池', facts([['消费者研究池', '沉淀研究样本、真实生活与行为证据。'], ['消费者需求池', '积累反复出现的痛点与未满足需求。'], ['商业机会池', '按价值、可行性与验证结果管理商业机会。']], 'fact-columns'))}
    ${sub('五大创新方向', '<p>商品创新 · 场景创新 · 服务创新 · 体验创新 · 商业模式创新</p>')}
    ${facts([['样本覆盖', '忠诚、普通、潜在、流失、竞品消费者及非会员目标人群。'], ['职责与决策', '消费者增长中心主动发现需求、提出议题、推动跨部门研究并追踪应用；业务部门共同完成最终立项和商业决策。'], ['结果反馈', '向参与者适当反馈研究或验证结果，是否采纳由实际验证与商业决策决定。']], 'fact-columns')}`,
  () => `<p class="pullquote">会员关系自主经营，会员价值未来开放共建。</p>
    <div class="concentric" id="ecosystem-orbit" role="group" aria-label="会员生态阶段"><i class="rings" aria-hidden="true"></i><button type="button" data-choice="2" class="outer">开放式会员生态</button><button type="button" data-choice="1" class="middle">选择性合作</button><button type="button" data-choice="0" class="inner">自主品牌会员</button></div>
    <div id="ecosystem-note" class="selection-note" aria-live="polite"></div>
    ${sub('生态合作模式', facts([['权益互通型', '按具体礼遇和授权范围提供相互权益。'], ['消费者共营型', '围绕共同目标人群开展场景联动与验证。'], ['战略共创型', '在价值和履约得到验证后探索联合创新。']], 'fact-columns'))}
    ${sub('伙伴筛选维度', '<p>人群匹配 · 需求关联 · 品牌匹配 · 资源互补 · 商业增量 · 履约与信任</p>', '孩子王属于潜在合作概念案例，共营、数据使用及履约均以未来正式协议为前提。')}`,
];

const lifecycle = [
  ['获取', '将匿名消费者识别为自主品牌会员。'], ['激活', '交付首次可感知价值。'], ['转化', '推动首购或下一次真实消费。'],
  ['留存与复购', '用采购周期和回馈维持关系。'], ['价值拓展', '探索更多家庭场景和长期关系。'], ['推荐与共创', '通过真实口碑和创新反馈反哺获取及经营。'],
];
const innovation = [
  ['需求发现', '从购买动机、消费场景和真实反馈中发现痛点。'], ['机会定义', '明确目标人群、未满足需求与初步商业机会。'],
  ['概念共创', '邀请适当样本参与概念研讨和原型体验。'], ['消费者验证', '在真实场景收集反馈并检验需求与可行性。'],
  ['商业转化', '由相关业务部门共同推动立项及商业决策。'], ['结果反馈', '反馈处理进度与结果，沉淀为下一轮需求研究。'],
];

$('#system-content').innerHTML = systems.map(([name, english, task], index) => {
  const previous = systems[index - 1];
  const next = systems[index + 1];
  return `<article id="system-${index + 1}" class="system-detail" hidden><header>
    <p class="eyebrow">${index + 1} / ${systems.length} · ${english}</p><h3>${name}</h3><p class="intro">${task}</p>
    <nav class="system-read-nav" aria-label="${name}章节导航">
      <a href="#system-explorer">返回体系图</a>
      ${previous ? `<a href="#system-${index}">上一体系 · ${previous[0]}</a>` : ''}
      ${next ? `<a href="#system-${index + 2}">下一体系 · ${next[0]}</a>` : ''}
    </nav>
  </header>${systemDetails[index]()}</article>`;
}).join('');

const systemMap = $('#systems-map');
const systemBrief = $('#system-brief');
systemMap.setAttribute('aria-describedby', 'system-instruction');
$$('[data-node]', systemMap).forEach((button, index) => button.setAttribute('aria-controls', `system-brief system-${index + 1}`));

function renderSystem(index, event) {
  activateCircuit(systemMap, index);
  $$('.system-detail').forEach((article, key) => { article.hidden = key !== index; });
  const [label, english, task] = systems[index];
  systemBrief.innerHTML = `<span class="eyebrow">${index + 1} / ${systems.length} · ${english}</span><h3>${label}</h3><p>${task}</p><a class="button" href="#system-${index + 1}">查看体系详情</a>`;
  if (event?.detail > 0 && matchMedia('(max-width: 850px)').matches && systemBrief.getBoundingClientRect().top > innerHeight - 100) {
    systemBrief.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
}
bindCircuit(systemMap, renderSystem);
renderSystem(0);
circuitDetails('#lifecycle-loop', lifecycle, '#lifecycle-note');
circuitDetails('#innovation-loop', innovation, '#innovation-note');
circuitDetails('#passport-map', passport.map(([label, information, application]) => [label, `${information}。${application}`]), '#passport-note');

const migrationActions = [
  '通过清晰的相遇价值推动首购。', '在真实消费后以补货或二购礼遇支持稳定复购。',
  '识别低频原因，按真实需要设计持续消费机会。', '结合长期信任与第一选择意愿识别忠诚。',
  '通过关爱与共享权益拓展家庭需求。', '为真实口碑、授权内容和推荐提供分享入口。',
  '邀请适合的消费者参与新品验证和结构化共创。', '识别流失原因，以适当时机和价值修复关系。',
];
function renderMigration(index) {
  select($('#system-3'), index, '[data-migration]');
  $('#migration-note').textContent = migrationActions[index];
}
$$('[data-migration]').forEach((button) => button.addEventListener('click', () => renderMigration(Number(button.dataset.migration))));
renderMigration(0);

function renderEcosystem(index) {
  $('#ecosystem-orbit').dataset.layer = index;
  $$('[data-choice]', $('#ecosystem-orbit')).forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.choice) === index)));
  const [title, status, description] = ecosystem[index];
  $('#ecosystem-note').innerHTML = `<strong>${title} · ${status}</strong><p>${description}</p>`;
}
handleChoices($('#ecosystem-orbit'), renderEcosystem);
renderEcosystem(0);

const flywheelPanel = $('#flywheel-panel');
const panorama = flywheelPanel.innerHTML;
let flyTimer;

function stopFlywheel() {
  if (flyTimer === undefined) return;
  clearInterval(flyTimer);
  flyTimer = undefined;
  $('#play-flywheel').textContent = '播放飞轮';
  $('#play-flywheel').setAttribute('aria-pressed', 'false');
  $('#wheel-current').setAttribute('aria-live', 'polite');
}

function bindPanorama() {
  $$('.mini-loop .circuit', flywheelPanel).forEach((element, index) => {
    bindCircuit(element, (step) => renderFlywheel(index + 1, step, true));
  });
}

function renderFlywheel(choice, initialStep = 0, focusNode = false) {
  stopFlywheel();
  select($('#flywheel-choice'), choice);
  if (choice === 0) {
    flywheelPanel.innerHTML = panorama;
    bindPanorama();
    return;
  }
  const [title, nodes, feedback] = flywheels[choice - 1];
  flywheelPanel.innerHTML = `<div class="feature-split flywheel-single">
    <div class="panel">${circuit('active-wheel', nodes, [title, '循环增长'])}</div>
    <div class="flywheel-text"><h4>${title}飞轮</h4><p>${feedback}</p>
      <div class="selection-note" id="wheel-current" aria-live="polite" aria-atomic="true">
        <span id="wheel-position"></span><strong id="wheel-step"></strong><p id="wheel-story"></p>
      </div>
      <div class="wheel-controls" role="group" aria-label="飞轮步骤">
        <button type="button" class="button button-small" id="wheel-prev" aria-controls="wheel-current">上一步</button>
        <button type="button" class="button button-small" id="play-flywheel" aria-pressed="false" aria-controls="wheel-current">播放飞轮</button>
        <button type="button" class="button button-small" id="wheel-next" aria-controls="wheel-current">下一步</button>
      </div>
    </div>
  </div>`;
  const wheel = $('#active-wheel');
  let step = initialStep;

  function showStep(index) {
    step = (index + nodes.length) % nodes.length;
    activateCircuit(wheel, step);
    $('#wheel-position').textContent = `第 ${step + 1} / ${nodes.length} 步`;
    $('#wheel-step').textContent = `${nodes[step]} → ${nodes[(step + 1) % nodes.length]}`;
    $('#wheel-story').textContent = flywheelTransitions[choice - 1][step];
  }

  function chooseStep(index) {
    stopFlywheel();
    showStep(index);
  }

  bindCircuit(wheel, chooseStep);
  showStep(initialStep);
  if (focusNode) {
    const node = $(`[data-node="${step}"]`, wheel);
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
  $('#wheel-prev').addEventListener('click', () => chooseStep(step - 1));
  $('#wheel-next').addEventListener('click', () => chooseStep(step + 1));
  $('#play-flywheel').addEventListener('click', (event) => {
    if (flyTimer !== undefined) {
      stopFlywheel();
      return;
    }
    event.currentTarget.textContent = '暂停飞轮';
    event.currentTarget.setAttribute('aria-pressed', 'true');
    $('#wheel-current').setAttribute('aria-live', 'off');
    flyTimer = setInterval(() => showStep(step + 1), 2500);
  });
}

const flywheelChoice = $('#flywheel-choice');
handleChoices(flywheelChoice, (index) => {
  if ($(`[data-choice="${index}"]`, flywheelChoice).getAttribute('aria-pressed') !== 'true') renderFlywheel(index);
});
bindPanorama();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopFlywheel();
});

function renderModel(index) {
  select($('#model-choice'), index);
  const [label, status, task, collaboration, basis] = models[index];
  $('#model-panel').innerHTML = `<p class="eyebrow">${label}</p><h4>${status}</h4>${facts([['经营责任', task], ['协作方式', collaboration], ['所需能力', basis]], 'fact-columns')}`;
}
handleChoices($('#model-choice'), renderModel);
renderModel(0);

function renderStage(index) {
  select($('#stage-choice'), index);
  const [name, english, capacity, task, evidence] = stages[index];
  $('#stage-panel').innerHTML = `<p class="eyebrow">Stage ${index} · ${english}</p><h4>${name}</h4>${facts([['经营重点', task], ['能力建设', capacity], ['验证条件', evidence]], 'fact-columns')}`;
  $$('.priority-table tr').forEach((row) => [...row.cells].forEach((cell, key) => cell.classList.toggle('selected-col', key === index + 1)));
}
handleChoices($('#stage-choice'), renderStage);
renderStage(0);

const scenario = $('#scenario');
const scenarioInputs = $$('input[type="range"]', scenario);
const format = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });
function renderScenario(announce = false) {
  const [size, customerRate, spend, attribution, margin] = scenarioInputs.map((input) => input.valueAsNumber);
  scenarioInputs.forEach((input, index) => {
    const output = $('output', input.parentElement);
    const value = `${format.format(input.valueAsNumber)} ${assumptions[index][5]}`;
    output.value = value;
    input.setAttribute('aria-valuetext', value);
  });
  const customers = size * customerRate / 100;
  const linked = customers * spend;
  const growth = linked * attribution / 100;
  const contribution = growth * margin / 100;
  const results = [
    ['消费会员数', customers, '人', '会员规模 × 年度消费会员占比'],
    ['会员关联消费额', linked / 10000, '万元', '消费会员数 × 年均购买金额'],
    ['假设增量消费额', growth / 10000, '万元', '会员关联消费额 × 可归因增量消费占比'],
    ['假设增量商业贡献', contribution / 10000, '万元', '假设增量消费额 × 贡献率'],
  ];
  $('#scenario-results').innerHTML = results.map(([label, value, unit, formula]) => `<div><dt>${label}<small class="scenario-formula">${formula}</small></dt><dd>${format.format(value)} <small>${unit}</small></dd></div>`).join('');
  $('#scenario-bars').innerHTML = results.slice(1).map(([label, value], index) => {
    const ratio = 100 * value / (linked / 10000);
    return `<div class="scenario-bar"><span>${label}</span><strong>${format.format(ratio)}%</strong><i aria-hidden="true" style="--bar:${ratio}%;--tone:${index}"></i></div>`;
  }).join('');
  if (announce) $('#scenario-announcement').textContent = `测算更新。会员关联消费额 ${format.format(linked / 10000)} 万元，假设增量消费额 ${format.format(growth / 10000)} 万元，假设增量商业贡献 ${format.format(contribution / 10000)} 万元。`;
}
scenario.addEventListener('input', () => renderScenario());
scenario.addEventListener('change', () => renderScenario(true));
scenario.addEventListener('reset', () => requestAnimationFrame(() => renderScenario(true)));
$('#scenario-zero').addEventListener('click', () => {
  scenarioInputs[3].value = '0';
  renderScenario(true);
});
renderScenario();

const mobileNav = $('#mobile-nav');
const menu = $('#menu-button');
function toggleMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  mobileNav.hidden = !open;
}
menu.addEventListener('click', () => toggleMenu(mobileNav.hidden));
mobileNav.addEventListener('click', (event) => { if (event.target.closest('a')) toggleMenu(false); });

const chapterElements = chapters.map(([id]) => document.getElementById(id));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const presentButton = $('#present');
const presentControls = $('#present-controls');
const slideJump = $('#slide-jump');
const slideLabel = $('#slide-label');
const prevSlide = $('#prev-slide');
const nextSlide = $('#next-slide');
const fullscreenButton = $('#fullscreen');
const presentFeedback = $('#present-feedback');
const presentationShortcuts = $('#present-shortcuts');
const navigationShell = $('.nav-shell');
let currentChapter = 0;
let presenting = false;
let requestedFullscreen = false;
let positionQueued = false;

chapters.forEach(([, label], index) => slideJump.add(new Option(label, String(index))));
presentButton.setAttribute('aria-controls', 'present-controls');
presentButton.setAttribute('aria-expanded', 'false');

function updatePresentationControls() {
  const label = `${currentChapter + 1} / ${chapters.length}`;
  if (slideLabel.value !== label) slideLabel.value = label;
  if (slideJump.selectedIndex !== currentChapter) slideJump.selectedIndex = currentChapter;

  const focused = document.activeElement;
  prevSlide.disabled = currentChapter === 0;
  nextSlide.disabled = currentChapter === chapters.length - 1;
  if (focused === prevSlide && prevSlide.disabled) nextSlide.focus({ preventScroll: true });
  if (focused === nextSlide && nextSlide.disabled) prevSlide.focus({ preventScroll: true });
}

function chapterTopInset() {
  return presenting ? 0 : navigationShell.offsetHeight;
}

function updatePosition() {
  positionQueued = false;
  const reference = chapterTopInset() + 16;
  const page = document.documentElement;
  const max = page.scrollHeight - innerHeight;
  const progress = max > 0 ? scrollY / max : 0;
  if (scrollY <= 1) currentChapter = 0;
  else if (max - scrollY <= 1) currentChapter = chapters.length - 1;
  else currentChapter = chapterElements.reduce((active, element, index) => element.getBoundingClientRect().top <= reference ? index : active, 0);

  $('#reading-progress').style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
  const chapterId = chapters[currentChapter][0];
  const v1Chapter = chapterId === 'strategy-v1' || strategyChapters.some(([id]) => id === chapterId);
  $$('.site-header a[href^="#"]').forEach((link) => {
    const targetId = link.hash.slice(1);
    if (targetId === chapterId || (targetId === 'strategy-v1' && v1Chapter && link.closest('#nav'))) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  if (presenting) updatePresentationControls();
}
function schedulePositionUpdate() {
  if (!positionQueued) {
    positionQueued = true;
    requestAnimationFrame(updatePosition);
  }
}
addEventListener('scroll', schedulePositionUpdate, { passive: true });
addEventListener('resize', schedulePositionUpdate);
updatePosition();

function goToChapter(index, focusHeading = false) {
  if (index < 0 || index >= chapters.length) return;
  const chapter = chapterElements[index];
  history.replaceState(null, '', `#${chapter.id}`);
  if (index === 0) window.scrollTo({ top: 0, behavior: 'instant' });
  else chapter.scrollIntoView({ behavior: 'instant' });
  if (focusHeading) {
    const heading = chapter.querySelector('h1, h2');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }
  updatePosition();
}

function setPresentation(active) {
  if (presenting === active) return;
  updatePosition();
  const anchor = chapterElements[currentChapter];
  const anchorOffset = anchor.getBoundingClientRect().top - chapterTopInset();
  const atStart = scrollY <= 1;

  presenting = active;
  document.body.classList.toggle('presenting', active);
  presentControls.hidden = !active;
  presentButton.setAttribute('aria-expanded', String(active));
  if (active) toggleMenu(false);

  if (!atStart) {
    const offset = anchor.getBoundingClientRect().top - chapterTopInset();
    window.scrollBy({ top: offset - anchorOffset, behavior: 'instant' });
  }
  updatePosition();

  if (active) {
    (nextSlide.disabled ? prevSlide : nextSlide).focus({ preventScroll: true });
  } else {
    if (requestedFullscreen && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    requestedFullscreen = false;
    presentFeedback.hidden = true;
    presentButton.focus({ preventScroll: true });
  }
}
presentButton.addEventListener('click', () => setPresentation(true));
$('#exit-present').addEventListener('click', () => setPresentation(false));
prevSlide.addEventListener('click', () => { updatePosition(); goToChapter(currentChapter - 1); });
nextSlide.addEventListener('click', () => { updatePosition(); goToChapter(currentChapter + 1); });
slideJump.addEventListener('change', () => goToChapter(slideJump.selectedIndex));

fullscreenButton.hidden = !document.fullscreenEnabled || typeof document.documentElement.requestFullscreen !== 'function';
fullscreenButton.addEventListener('click', async () => {
  presentFeedback.hidden = true;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
      requestedFullscreen = document.fullscreenElement === document.documentElement;
      if (!presenting && requestedFullscreen) await document.exitFullscreen();
    }
  } catch {
    presentFeedback.hidden = false;
  }
});
document.addEventListener('fullscreenchange', () => {
  const fullscreenActive = Boolean(document.fullscreenElement);
  if (!fullscreenActive) requestedFullscreen = false;
  fullscreenButton.textContent = fullscreenActive ? '退出全屏' : '全屏';
  fullscreenButton.setAttribute('aria-pressed', String(fullscreenActive));
  presentationShortcuts.textContent = fullscreenActive ? '← / → 切换章节 · Esc 退出全屏' : '← / → 切换章节 · Esc 退出汇报';
  schedulePositionUpdate();
});
document.addEventListener('keydown', (event) => {
  if (dialog.open || event.defaultPrevented || event.isComposing) return;
  if (event.key === 'Escape') {
    if (!mobileNav.hidden) {
      toggleMenu(false);
      menu.focus({ preventScroll: true });
    } else if (presenting && !document.fullscreenElement) {
      event.preventDefault();
      setPresentation(false);
    }
    return;
  }
  if (!presenting || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

  const target = event.target instanceof Element ? event.target : document.activeElement;
  const inToolbar = presentControls.contains(target);
  if (target?.closest('input, textarea, select, [contenteditable], .table-scroll')) return;
  if (!inToolbar && target?.closest('button, a, summary')) return;

  event.preventDefault();
  updatePosition();
  goToChapter(currentChapter + (event.key === 'ArrowRight' ? 1 : -1), !inToolbar);
});

function navigateHash({ instant = false, focus = false } = {}) {
  const target = document.getElementById(location.hash.slice(1));
  if (!target?.closest('main')) return;
  const systemHash = target.id.match(/^system-([1-6])$/);
  if (systemHash) renderSystem(Number(systemHash[1]) - 1);
  if (focus) {
    const destination = target.id === 'system-explorer'
      ? $('[data-node][aria-pressed="true"]', target)
      : $(':scope > h3, :scope > header h3, :scope > .wrap > .chapter-heading h2, :scope > .wrap h1', target) || target;
    if (!destination.matches('button')) destination.setAttribute('tabindex', '-1');
    destination.focus({ preventScroll: true });
  }
  target.scrollIntoView({ behavior: instant || reducedMotion.matches ? 'instant' : 'smooth' });
}
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = document.getElementById(link.hash.slice(1));
  if (!target?.closest('main')) return;
  event.preventDefault();
  if (link.hasAttribute('data-research-topic')) renderCases(Number(link.dataset.researchTopic));
  if (link.hash !== location.hash) history.pushState(null, '', link.hash);
  navigateHash({ focus: true });
});
addEventListener('hashchange', () => navigateHash({ instant: true, focus: true }));
bindV2Overview();
bindConversionModules();
bindRhythmModules();
bindExperienceLab();
bindGrowthLab();
if (location.hash) requestAnimationFrame(() => navigateHash({ instant: true }));

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const reveal = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach(({ target }) => {
      target.classList.add('entered');
      reveal.unobserve(target);
    });
  }, { threshold: 0.13 });
  $$('.chapter-heading, .growth-compare, .system-stage, .summary-map').forEach((element) => reveal.observe(element));
}

if ('IntersectionObserver' in window) {
  const wheelVisibility = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) stopFlywheel();
  });
  wheelVisibility.observe(flywheelPanel);
}
