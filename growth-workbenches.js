import { readSession, writeSession, removeSession } from './session.js?v=1';
import {
  conversionFunnel, existingBuyerPath, acquisitionEconomics, rhythmForecast,
  calibrateRhythm, compareExperiment, incrementalEconomics,
} from './growth-models.js?v=8';
import { evaluateSandbox, forecastSandbox } from './sandbox-state.js?v=8';

const numeric = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });
const fmt = value => numeric.format(Math.abs(value) < .005 ? 0 : value);
const show = (value, unit = '') => value == null || !Number.isFinite(value) ? '— 不适用' : fmt(value) + unit;
const pct = value => show(value == null ? null : value * 100, '%');
const pp = value => show(value == null ? null : value * 100, ' 个百分点');
const signed = (value, unit = '') => (value > .005 ? '+' : '') + show(value, unit);
const number = (name, label, value, max = 100, step = 1, min = 0, optional = false) =>
  `<label class="gl-field">${label}<input type="number" name="${name}" min="${min}" max="${max}" step="${step}" inputmode="${step === 1 ? 'numeric' : 'decimal'}" value="${value}" ${optional ? '' : 'required'}></label>`;
const choose = (name, label, choices, initial = choices[0][0]) =>
  `<label class="gl-field">${label}<select name="${name}">${choices.map(([key, text]) => `<option value="${key}" ${key === initial ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
const reset = text => `<button class="button button-small" type="reset">${text ?? '恢复演示参数'}</button>`;
const inputs = (id, fields, resetText) => `<form id="${id}" class="wb-form"><div class="wb-fields">${fields}</div><div class="wb-actions">${reset(resetText)}</div></form>`;
const outputs = (id, label) => `<div id="${id}" class="wb-output" role="region" aria-label="${label}" aria-live="polite"></div>`;
const table = (label, headings, rows, css = '') => `<div class="table-scroll wb-table" role="region" aria-label="${label}" tabindex="0"><table class="${css}"><thead><tr>${headings.map(text => `<th scope="col">${text}</th>`).join('')}</tr></thead><tbody>
  ${rows.map(([label, ...columns]) => `<tr><th scope="row">${label}</th>${columns.map(text => `<td>${text}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const metrics = (items, hero = false) => `<dl class="wb-metrics ${hero ? 'wb-metrics-feature' : ''}">${items.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;

const labs = [
  ['lab-funnel', 'Conversion Funnel', '转化漏斗'],
  ['lab-acquisition', 'Acquisition Economics', '转化权益成本'],
  ['lab-rhythm', 'Rhythm Intelligence', '家庭消费预测'],
  ['lab-decision', 'Decision Intelligence', '经营规则实验'],
  ['lab-cohort', 'Cohort & Experiment', '消费者研究实验'],
  ['lab-increment', 'Incremental Economics', '增量商业价值'],
];

function section(index, question, body, notes) {
  const [id, english, title] = labs[index];
  return `<section class="wb-section" id="${id}" aria-labelledby="${id}-title">
    <header class="wb-heading"><div><p class="eyebrow">LAB 0${index + 1} · ${english}</p><h1 id="${id}-title">${title}</h1></div><p>${question}</p></header>
    <button class="button button-small wb-guide" type="button" data-guide-lab="${id.slice(4)}">工作台操作引导</button>
    ${body}${notes ? `<p class="wb-note">${notes}</p>` : ''}
    <a class="wb-return" href="#lab-directory">返回工作台目录 ↑</a></section>`;
}

const stageLabels = ['利益感知', '入会', '首购', '二购', '周期购采用'];
const cohortWindows = [7,14,30,60];
const cohortPercent = new Intl.NumberFormat('zh-CN', { style:'percent', maximumFractionDigits:1 });
const dimensions = {
  channel: ['获客渠道', ['包装扫码','内容电商','线下导购']],
  sku: ['首购商品规格', ['轻享装','日常装','家庭装']],
  benefit: ['入会权益机制', ['即时权益','体验型权益','服务型权益']],
  rhythm: ['家庭消费节奏', ['稳定高频','稳定低频','波动采购']],
  purchases: ['购买次数', ['基线期 0 次','基线期 1 次','基线期 2 次及以上']],
};
const toggles = [['yes','是'],['no','否']];
const decisionFields = [
  ['lifecycle','消费阶段',[['visitor','尚未入会'],['member','已入会未购'],['first','首购后'],['repeat','规律复购']], 'first'],
  ['permission','授权补货提醒',toggles,'yes'], ['marketing','授权营销触达',toggles,'yes'],
  ['service','服务状态',[['normal','无在办服务'],['request','消费者主动发起服务'],['aftersales','有售后问题']],'normal'],
  ['stock','家庭库存',[['low','接近耗尽'],['ample','仍有库存'],['bought','已在其他渠道补货'],['unknown','未知']],'low'],
  ['need','消费者补货意向',[['unknown','尚未反馈'],['yes','主动确认需要'],['no','明确暂不需要']],'unknown'],
  ['plan','周期计划',[['none','未创建'],['running','运行中'],['paused','已暂停'],['cancelled','已取消']],'none'],
  ['due','已到本期确认日',toggles,'no'], ['recent','近期已经触达',toggles,'no'], ['pending','存在待履约订单',toggles,'no'],
  ['barrier','价格或渠道阻力',[['none','暂无'],['price','价格阻力'],['channel','渠道阻力'],['both','价格和渠道阻力']],'none'],
];
const presets = [
  ['day8','首购后第 8 天',{}], ['ample','仍有库存',{stock:'ample'}], ['bought','已经补货',{stock:'bought'}],
  ['paused','已暂停计划',{plan:'paused'}], ['service','售后问题',{service:'aftersales',permission:'no',marketing:'no',pending:'yes'}],
  ['silent','无触达许可',{permission:'no',marketing:'no'}],
  ['repeat','规律用户确认需求',{lifecycle:'repeat',need:'yes',plan:'running',due:'yes'}],
];

export function growthWorkbenches(selected) {
  const directory=`
    <nav id="lab-directory" class="wb-index" aria-label="六个商业验证工作台">${labs.map(([id, english, title], index) =>
      `<a href="#${id}"><small>LAB 0${index + 1}</small><strong>${title}</strong><span>${english}</span></a>`).join('')}</nav>`;
  const sections=[
    () => section(0, '哪一段流失最多？同样的转化改善，能带来多少二购和周期购采用？',
      `${inputs('wb-funnel-form', number('reach','潜客触达（人）',10000,1e8) +
        [60,40,35,45,25].map((value, i) => number('rate'+i,stageLabels[i]+'率（%）',value,100,.01)).join(''))}
        ${outputs('wb-funnel-out','条件漏斗与敏感性结果')}
        <h4 class="wb-subtitle">先购买后入会</h4><p class="wb-note">起点为已购买的存量消费者，会员化后才计算该路径的复购与补货服务采用。</p>
        <div class="wb-split">${inputs('wb-buyers-form',number('buyers','已购消费者（人）',2000,1e8)+number('join','已购会员化率（%）',30,100,.01)+number('repeat','入会后复购率（%）',45,100,.01)+number('adopt','复购后补货服务采用率（%）',25,100,.01))}${outputs('wb-buyers-out','存量消费者结果')}</div>`,
      '两条路径分别计算，起点和条件分母独立。敏感性按单节点最多提高 5 个百分点测算。资源优先级还需要比较改善成本、可行性和增量贡献。'),
    () => section(1, '为了让新会员完成首次和第二次购买，需要投入多少权益成本？',
      `<div class="wb-split">${inputs('wb-acquisition-form', number('members','新增会员（人）',10000,1e8)+number('welcome','人均入会权益实付成本（元）',2,1e7,.01)+
        number('firstRate','首购转化率（%）',30,100,.01)+number('firstCost','每位实际首购权益成本（元）',5,1e7,.01)+number('repeatRate','二购转化率（%）',40,100,.01)+number('repeatCost','每位实际二购权益成本（元）',3,1e7,.01))}
        ${outputs('wb-acquisition-out','权益投资和分摊结果')}</div>`,
      '人均入会权益仅分摊入会费用。每位首购或二购分摊额均以三项总权益投入除以该阶段人数。流量、人员及系统等投入另计，完整获客成本需使用更广口径。'),
    () => section(2, '这一批库存可能何时耗尽？家庭可能什么时候就想补货？',
      `<div class="wb-split"><form id="wb-rhythm-form" class="wb-form"><div class="wb-fields">
        ${number('purchased','本次购买（枚）',20,10000)}${number('inventory','已有库存（枚）',0,10000)}
        ${number('daily','日均消耗（枚 / 天）',2,100,.01,0,true)}
        ${number('volatility','消耗速度波动（%）',25,99.99,.01)}${number('lead','购买或配送提前量（天）',2,365,.1)}
        ${number('threshold','实际补货阈值（枚）',4,10000,.1)}</div>
        <details class="wb-calibration"><summary>用消费者反馈校准</summary><div class="wb-fields">
          ${number('observedDay','反馈发生在第几天',8,1000,.1,.1,true)}
          ${number('remaining','反馈剩余库存（枚）',10,20000,.1,0,true)}
          ${choose('additional','观测期间额外购买',[['none','确认没有额外购买'],['known','有购买且数量已知'],['unknown','是否购买或数量未知']])}
          ${number('additionalQty','额外购买量（枚）','',10000,.1,0,true)}
          ${number('losses','非消耗造成的损耗（枚）',0,10000,.1,0,true)}</div></details>
        <div class="wb-actions">${reset()}</div></form>${outputs('wb-rhythm-out','库存轨迹及反馈校准')}</div>`,
      '快耗与慢耗构成情景范围，无统计置信度含义。经校准的日耗来自已知库存变化，未知购买或损耗先补齐信息。补货阈值为消费者偏好。本工具用于经营研究，食品保质期及膳食判断需另用适用依据。'),
    () => section(3, '面对同一个家庭，应该提供服务、延迟还是保持静默？',
      `<div class="wb-presets" role="group" aria-label="模拟规则预设">${presets.map(([id, label]) => `<button class="button button-small" type="button" data-wb-preset="${id}" aria-pressed="${id === 'day8'}">${label}</button>`).join('')}</div>
        <div class="wb-split">${inputs('wb-decision-form',decisionFields.map(([name,label,options,initial]) => choose(name,label,options,initial)).join(''))}
        ${outputs('wb-decision-out','决策状态与规则轨迹')}</div>`,
      '本工作台用与产品体验实验室相同的规则函数推演独立的消费者状态。任何选择均不发送提醒，也不会改变产品沙盒档案。'),
    () => section(4, '二购改善能在同样成熟度的群组中复现吗？',
      `<div class="wb-research" id="growth-research">
        <h4>同期群分析</h4><p class="wb-note">按首购发生时间划分队列。切换条件后查看 7、14、30 和 60 天累计二购率。</p>
        ${inputs('wb-cohort-form', choose('dimension','研究维度', Object.entries(dimensions).map(([id,[label]]) => [id,label]))+
          choose('segment','筛选分类',dimensions.channel[1].map((name,index) => [String(index),name])), '重置同期群筛选')}
        ${outputs('wb-cohort-out','首购同期群热力图')}
        <h4 class="wb-subtitle">A/B 对照实验</h4>
        <div class="wb-split">${inputs('wb-ab-form', number('controlSize','对照组（人）',1000,1e8)+number('controlRate','对照组指标率（%）',30,100,.01)+
          number('testSize','实验组（人）',1000,1e8)+number('testRate','实验组指标率（%）',38,100,.01)+number('days','共同观察窗口（天）',30,365,1,1)+
          choose('metric','主要实验指标',[['repeat','二购率'],['fulfillment','计划实际履约率'],['adoption','补货服务采用率']]),'重置实验参数')}
          ${outputs('wb-ab-out','A/B 指标直接比较')}</div>
        <p class="wb-note">实验设计采用随机分组、相同观察期和统一指标口径，按初始分组评估结果。家庭成员存在相互影响时可按会员或家庭分组。长期观察累计消费、购买是否提前、库存变化及消费者体验。</p>
      </div>`,
      '热力图全部为模拟样本。未满随访窗的单元用空值。指标差值为设定情景下的估计，正式实验须另行检验统计与经营意义。'),
    () => section(5, '二购率至少要提升多少，才能覆盖新增触达、权益和固定运营投入？',
      `<div class="wb-split">${inputs('wb-increment-form', number('targets','目标消费者（人）',10000,1e8)+number('baseline','自然二购率 P0（%）',30,100,.01)+
        number('treated','干预后二购率 P1（%）',38,100,.01)+number('margin','每笔增量二购贡献毛利（元）',15,1e7,.01,-1e7)+number('contact','每位目标消费者触达成本（元）',.3,1e7,.01)+
        number('reward','每位实际二购新增权益成本（元）',1,1e7,.01)+number('fixed','本期固定运营投入（元）',2000,1e10,.01))}
        ${outputs('wb-increment-out','增量贡献与盈亏平衡')}</div>`,
      '以每位增量二购消费者对应一笔新增订单测算。权益成本覆盖干预组全部实际二购消费者。输入贡献毛利应已扣商品、渠道与履约变动成本，单列权益只扣一次。结果为演示的增量贡献。真实预测与企业会计净利润需引入各自的完整数据。'),
  ];
  const index=labs.findIndex(([id])=>id===selected);
  return `<div id="growth-workbenches">
    <p class="wb-disclaimer"><strong>演示假设</strong> 本区使用独立的人群参数和模拟样本。产品体验实验室的单个模拟家庭不会写入这里的人群指标。</p>
    ${index<0?directory+dataBoundaries():sections[index]()}</div>`;
}

function dataBoundaries() {
  const rows = [
    ['会员规模 / 消费会员规模','前者计有效会员总数，后者计观察期内有验证消费的会员。'],
    ['已购消费者会员化 / 新增品牌消费者','既有购买者加入会员属于身份转化；新增品牌消费者须证明是首次购买本品牌。'],
    ['首购 / 二购','同一品牌、同一消费者按可验证的交易时序和观察窗口识别。'],
    ['周期计划创建 / 实际履约','建立计划和完成当期订单交付分别记录。'],
    ['品牌复购 / 品类购买','品牌复购只计圣迪乐；同品类外部购买可校准需求节奏。'],
    ['会员关联消费 / 可归因增量消费','关联消费按会员身份识别；增量消费相对于可信对照基线估计。'],
    ['消费者支出 / 企业实际销售收入','消费者支付额与企业确认的销售收入分别核对渠道、退款和有效订单口径。'],
    ['贡献毛利 / 企业净利润','贡献毛利依据商品与渠道等变动成本口径；净利润还包含其他支出、税费等会计项目。'],
  ];
  return `<details class="wb-boundaries"><summary>指标口径与模拟数据边界</summary><dl>${rows.map(([term, definition])=>`<div><dt>${term}</dt><dd>${definition}</dd></div>`).join('')}</dl></details>`;
}

function funnelView(values) {
  const { reach } = values;
  const rates = stageLabels.map((_, i) => values['rate' + i] / 100);
  const {stages, sensitivity, fullRate} = conversionFunnel(reach, rates);
  return `<ol class="wb-flow" aria-label="逐级转化路径">
    ${[['潜客触达', reach, reach ? 1 : 0, null], ...stages.map((s, i) => [stageLabels[i], s.count, s.cumulative, s.lost])].map(([label, count, fraction, lost]) =>
      `<li><span>${label}</span><strong>${show(count, ' 人')}</strong><div class="wb-track" aria-hidden="true"><i style="width:${100 * (fraction ?? 0)}%"></i></div><small>${lost === null ? '路径起点' : '本环节流失 ' + show(lost, ' 人')}</small></li>`).join('')}
    </ol>${metrics([['全链路转化率 · 周期购采用 / 触达',pct(fullRate)]])}
    ${table('逐级漏斗', ['阶段','条件转化率','人数','环节流失','占触达'], stages.map((s, i) => [
      stageLabels[i], stages[i - 1]?.count === 0 || reach === 0 ? show(null) : pct(s.rate),
      show(s.count,' 人'), show(s.lost,' 人'), pct(s.cumulative),
    ]))}
    <h4 class="wb-subtitle">单节点改善测算</h4>
    <p class="wb-note">每一行单独提高该节点，其他参数维持当前值。阶段人数为模型期望值。</p>
    ${table('敏感性结果',['调整节点','实际提高','二购人数变化','周期购人数变化'],
      sensitivity.map((s,i) => [stageLabels[i],pp(s.change),signed(s.second,' 人'),signed(s.adoption,' 人')]))}`;
}

function buyerView({buyers, join, repeat, adopt}) {
  const {members, repeat: repeatBuyers, adoption, totalRate} = existingBuyerPath(buyers, join / 100, repeat / 100, adopt / 100);
  return metrics([['已购会员化',show(members,' 人')],['入会后复购',show(repeatBuyers,' 人')],['补货服务采用',show(adoption,' 人')],['已购人群全链路采用率',pct(totalRate)]]);
}

function amountBar(label, value, scale, style = '') {
  const width = Math.min(100, 100 * Math.abs(value) / scale);
  return `<div class="wb-bar"><div><span>${label}</span><strong>${show(value,' 元')}</strong></div><div class="wb-track" aria-hidden="true"><i class="${style}" style="width:${width}%"></i></div></div>`;
}

function acquisitionView({members, welcome, firstRate, firstCost, repeatRate, repeatCost}) {
  const {first, second, components, total, perMember, perFirst, perSecond} = acquisitionEconomics(members, welcome, firstRate / 100, firstCost, repeatRate / 100, repeatCost);
  return `${metrics([['权益总投入',show(total,' 元')],['首购 / 二购人数',`${show(first)} / ${show(second,' 人')}`]], true)}
    ${metrics([['人均入会权益成本',show(perMember,' 元 / 人')],['每位首购会员分摊',show(perFirst,' 元 / 人')],['每位二购会员分摊',show(perSecond,' 元 / 人')]])}
    <div class="wb-bars"><h5>总投入构成</h5>${['入会权益','首购权益','二购权益'].map((label,i) => amountBar(label, components[i], Math.max(total, 1), ['','wb-bar-warm','wb-bar-gold'][i])).join('')}</div>`;
}

function inventoryChart(model, daily, volatility, threshold) {
  const {stock, late, start, end, decisionDay} = model;
  const days = Math.max(1, late) * 1.06;
  const capacity = Math.max(1, stock, threshold) * 1.06;
  const x = day => 49 + 557 * day / days;
  const y = count => 163 - 130 * count / capacity;
  const coordinates = pace => [0, Math.min(days, stock / pace), days].map(day => `${x(day)},${y(Math.max(0,stock - day * pace))}`);
  const baseline = coordinates(daily);
  const slow = coordinates(daily * (1 - volatility));
  const fast = coordinates(daily * (1 + volatility));
  const labels = Array.from({length:5}, (_, index) => days * index / 4);
  return `<figure class="wb-chart"><svg viewBox="0 0 640 210" role="img" aria-label="随时间递减的库存估计，含快慢消耗范围、补货窗口和消费者补货阈值">
    <rect class="wb-window" x="${x(start)}" y="29" width="${Math.max(end === start ? 1 : 0,x(end) - x(start))}" height="134"/>
    <line class="wb-axis" x1="49" y1="27" x2="49" y2="163"/><line class="wb-axis" x1="49" y1="163" x2="606" y2="163"/>
    <polygon class="wb-band" points="${[...slow,...[...fast].reverse()].join(' ')}"/>
    <line class="wb-threshold" x1="49" y1="${y(threshold)}" x2="606" y2="${y(threshold)}"/>
    <polyline class="wb-curve" points="${baseline.join(' ')}"/>
    <circle class="wb-marker" cx="${x(decisionDay)}" cy="${y(Math.min(stock,threshold))}" r="4.5"/>
    <text x="19" y="18">枚</text><text x="39" y="168" text-anchor="end">0</text>
    ${stock ? `<text x="40" y="${y(stock) - 5}" text-anchor="end">${fmt(stock)}</text>` : ''}
    ${labels.map(day => `<text x="${x(day)}" y="184" text-anchor="middle">${fmt(day)}</text>`).join('')}
    <text x="606" y="202" text-anchor="end">天</text>
  </svg><figcaption class="wb-legend"><span>基准库存</span><span>消耗波动范围</span><span>建议补货窗口</span><span>消费者补货阈值</span></figcaption></figure>`;
}

function timeRange(start, end) {
  return start === end ? show(start,' 天') : `${fmt(start)}–${show(end,' 天')}`;
}

function rhythmView(values) {
  const {purchased, inventory, daily, volatility, lead, threshold, observedDay, remaining, additional, additionalQty, losses} = values;
  const model = rhythmForecast(purchased, inventory, daily, volatility / 100, lead, threshold);
  const added = additional === 'none' ? 0 : additional === 'known' ? additionalQty : null;
  const calibrated = calibrateRhythm(purchased + inventory, observedDay, remaining, added, losses, threshold);
  const forecast = model
    ? metrics([['基础消耗周期',show(model.duration,' 天')],['预计耗尽区间',timeRange(model.early,model.late)],['建议补货窗口',timeRange(model.start,model.end)],['预计触达补货阈值','第 ' + show(model.decisionDay,' 天')]], true) + inventoryChart(model, daily, volatility / 100, threshold)
    : '<p class="wb-message">日均消耗待补充，填写大于 0 的数值后生成库存预测。</p>';
  const feedback = calibrated
    ? metrics([['观察平均消耗',show(calibrated.rate,' 枚 / 天')],['预计剩余消耗',show(calibrated.timeLeft,' 天')],['校准总周期',show(calibrated.duration,' 天')],['校准后到达阈值',calibrated.decisionDay == null ? show(null) : '第 ' + show(calibrated.decisionDay,' 天')]])
    : '<p class="wb-message">缺少有效反馈或库存变化无法解释。请核对原库存、反馈日、剩余量、额外购买及损耗。</p>';
  return `${forecast}<div class="wb-feedback"><h5>消费者反馈校准</h5>${feedback}</div>`;
}

const eventLabels = {
  lifecycle: '消费阶段变化', permission: '补货授权变化', marketing: '营销授权变化', service: '服务状态变化',
  stock: '家庭库存反馈', need: '消费者意向反馈', plan: '计划状态变化', due: '计划确认时间变化',
  recent: '触达历史变化', pending: '订单履约状态变化', barrier: '购买阻力反馈',
};

function decisionView(values, event) {
  const day = 8;
  const hasInventoryFeedback = ['ample','bought'].includes(values.stock);
  const feedback = values.need === 'yes' ? 'needed' : ({ample:'stock', bought:'bought'})[values.stock];
  const state = {day, lifecycle:values.lifecycle, permission:true, lastContact:values.recent === 'yes' ? day : null,
    frequencyDays:3, sandbox:{marketing:values.marketing === 'yes'}};
  const home = {authorization:values.permission === 'yes', serviceOpen:values.service === 'aftersales',
    request:values.service === 'request', pendingOrder:values.pending === 'yes', needDeclined:values.need === 'no',
    plan:values.plan === 'running' ? 'flex' : values.plan, scheduleMode:'regular', nextConfirm:values.due === 'yes' ? day : 18,
    feedback:feedback ? {value:feedback, day} : null, snoozeUntil:hasInventoryFeedback ? day + 3 : null,
    stock:({low:20, ample:15, bought:20, unknown:null})[values.stock], stockDay:hasInventoryFeedback ? day : 0,
    rate:2, barrier:values.barrier};
  const window = forecastSandbox(home, day);
  const result = evaluateSandbox(state, home, window);
  const label = (name, key) => decisionFields.find(field => field[0] === name)[2].find(option => option[0] === key)[1];
  const status = `${label('lifecycle',values.lifecycle)} · ${label('stock',values.stock)} · 库存估计 ${show(window.remaining,' 枚')}`;
  const blocked = result.kind === 'service'
    ? '暂停相关促销及自动补货询问。'
    : result.outcome === 'execute' ? '停止重复触达及未经确认的自动下单。'
    : '停止发起当前补货触达、周期确认及自动下单。';
  return `<aside class="wb-decision wb-decision-${result.outcome}">
    <p class="eyebrow">${({execute:'可执行',delay:'延后',silent:'保持静默'})[result.outcome]}</p><h4>${result.title}</h4><p>${result.reason}</p>
    <dl><dt>当前消费者状态</dt><dd>${status}</dd><dt>触发事件</dt><dd>${event}</dd>
    <dt>命中规则</dt><dd>${result.trace.find(step => step.status === 'trigger').rule}</dd>
    <dt>停止动作</dt><dd>${blocked}${values.marketing === 'no' ? ' 保持营销静默。' : ''}</dd>
    <dt>重新评估条件</dt><dd>${result.stop}</dd></dl></aside>
    <details class="wb-trace"><summary>查看规则检查顺序</summary><ol>${result.trace.map(step =>
      `<li data-status="${step.status}"><strong>${step.rule}</strong><span>${({trigger:'命中',pass:'通过',skipped:'跳过'})[step.status]}</span></li>`).join('')}</ol></details>`;
}

function cohortView({dimension, segment}) {
  const [dimensionLabel, groups] = dimensions[dimension];
  const offset = Object.keys(dimensions).indexOf(dimension) * 2 + Number(segment) * 3;
  const followUp = [['08/24–08/30', 70], ['09/07–09/13', 56], ['09/21–09/27', 42],
    ['10/05–10/11', 28], ['10/19–10/25', 14], ['10/26–11/01', 7], ['11/02–11/08', 0]];
  const cohorts = followUp.map(([period, observed], i) => {
    const sample = 220 + offset * 9 + i * 24;
    return [`<span class="wb-cohort-period">${period}</span><small>随访 ${observed} 天</small>`, show(sample,' 人'), ...cohortWindows.map((window, j) => {
      if (observed < window) return '<span class="wb-immature" aria-label="未满观察窗">—</span>';
      const rate = Math.round(sample * ([11,21,32,43][j] + offset + (i % 3) * 2) / 100) / sample;
      return `<span class="wb-heat" style="--wb-heat:${rate.toFixed(3)}">${cohortPercent.format(rate)}</span>`;
    })];
  });
  return `<p class="wb-note"><strong>模拟样本</strong> · ${dimensionLabel} / ${groups[Number(segment)]}。模拟截点为 11 月 8 日，随访天数按首购周末计算，每行以同期群为分母。</p>
    ${table('同期群累计二购热力矩阵',['首购队列与随访','样本',...cohortWindows.map(day => `${day} 天`)],cohorts,'wb-heatmap')}
    <p class="wb-note">暖色越深代表累计二购率越高。— 表示尚未满观察窗。购买次数维度使用实验前基线对应的品类购买次数。</p>`;
}

function experimentView({controlSize, controlRate, testSize, testRate, days}, metric) {
  const {absolute, relative, added} = compareExperiment(controlSize, testSize, controlRate / 100, testRate / 100);
  return `<p class="wb-note"><strong>模拟对照</strong> · ${metric} · 共同观察 ${fmt(days)} 天</p>
    <div class="wb-compare">${[['对照组',controlSize,controlRate], ['实验组',testSize,testRate]].map(([name,size,rate],i) =>
      `<div><h5>${name}</h5><strong>${pct(size ? rate / 100 : null)}</strong><span>${show(size,' 人')}</span>
      <div class="wb-track" aria-hidden="true"><i class="${i ? '' : 'wb-bar-gold'}" style="width:${size ? rate : 0}%"></i></div></div>`).join('')}</div>
    ${metrics([['绝对提升',pp(absolute)],['相对提升',pct(relative)],['实验组估计增量',signed(added,' 人')]])}`;
}

function incrementView({targets, baseline, treated, margin, contact, reward, fixed}) {
  const {added, gross, components, cost, net, lift, room, breakEven} =
    incrementalEconomics(targets, baseline / 100, treated / 100, margin, contact, reward, fixed);
  const labels = {
    reachable:pp(lift), already:'0 个百分点 · 基线已覆盖成本', 'no-targets':show(null),
    flat:'0 个百分点 · 基线已平衡，提升后增量贡献仍为零',
    'no-positive':'当前假设下无可行正向提升区间',
    unreachable:`不可达 · 所需 ${pp(lift)}，最多可提高 ${pp(room)}`,
  };
  const scale = Math.max(Math.abs(gross), cost, Math.abs(net), 1);
  return `${metrics([['扣除新增投入后的增量贡献',show(net,' 元')],['估计增量二购人数',signed(added,' 人')]],true)}
    <div class="wb-bars"><h5>贡献与新增投入</h5>
      ${amountBar('增量贡献毛利',gross,scale,gross < 0 ? 'wb-bar-negative' : '')}
      ${amountBar('新增运营成本',cost,scale,'wb-bar-gold')}
      ${amountBar('扣除投入后的贡献',net,scale,net < 0 ? 'wb-bar-negative' : 'wb-bar-warm')}
    </div>
    ${metrics([['触达成本',show(components[0],' 元')],['权益成本',show(components[1],' 元')],['固定投入',show(components[2],' 元')]])}
    <p class="wb-break-even"><strong>盈亏平衡所需的二购率提升</strong><span>${labels[breakEven]}</span></p>`;
}

export function bindGrowthWorkbenches(root = document) {
  const scope = root.querySelector('#growth-workbenches');
  if (!scope) return;
  const renderers = {
    funnel:funnelView, buyers:buyerView, acquisition:acquisitionView, rhythm:rhythmView,
    decision:decisionView, cohort:cohortView, ab:experimentView, increment:incrementView,
  };
  for (const [id, render] of Object.entries(renderers)) {
    const form = scope.querySelector('#wb-' + id + '-form');
    const output = scope.querySelector('#wb-' + id + '-out');
    if(!form||!output)continue;
    const key = 'workbench-'+id;
    const saved = readSession(key,{});
    const controls = form.elements;
    const presetsInScope = id === 'decision' ? [...scope.querySelectorAll('[data-wb-preset]')] : [];
    let context = saved.context ?? (id === 'decision' ? '首购后第 8 天 · 演示预设' : '');
    let preset = saved.preset ?? 'day8';
    const updatePresets = active => {
      preset=active;
      presetsInScope.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.wbPreset === active)));
    };
    const persist = () => writeSession(key,{context,preset,values:Object.fromEntries([...controls].filter(control=>control.name).map(control=>[control.name,control.value]))});
    for(const [name,value] of Object.entries(saved.values ?? {})){
      if(controls[name]&&name!=='segment')controls[name].value=value;
    }
    if(id==='decision')updatePresets(preset);

    function update(refillSegments = false) {
      if (id === 'cohort' && refillSegments) {
        controls.segment.replaceChildren(...dimensions[controls.dimension.value][1].map((label,i) => new Option(label,String(i))));
      }
      if (id === 'rhythm') controls.additionalQty.disabled = controls.additional.value !== 'known';
      const invalid = [...controls].find(control => control.name && !control.validity.valid);
      if (invalid) {
        output.innerHTML = '<p class="wb-message">请完成输入，并核对数值范围及小数位数。转化率范围为 0–100%。</p>';
        return;
      }
      const values = Object.fromEntries([...controls].filter(control => control.name).map(control => [
        control.name, control.type === 'number' ? (Number.isFinite(control.valueAsNumber) ? control.valueAsNumber : null) : control.value,
      ]));
      const traceWasOpen = output.querySelector('.wb-trace')?.open;
      output.innerHTML = render(values, id === 'ab' ? controls.metric.selectedOptions[0].textContent : context);
      if (traceWasOpen) output.querySelector('.wb-trace').open = true;
    }

    form.addEventListener('input', event => {
      if (id === 'decision') {
        context = eventLabels[event.target.name];
        updatePresets('');
      }
      update(event.target.name === 'dimension');
      persist();
    });
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('reset', () => {
      if (id === 'rhythm') form.querySelector('.wb-calibration').open = false;
      if (id === 'decision') {
        context = '首购后第 8 天 · 演示预设';
        updatePresets('day8');
      }
      queueMicrotask(() => {
        update(true);
        removeSession(key);
      });
    });
    for (const button of presetsInScope) {
      button.addEventListener('click', () => {
        const [key, title, overrides] = presets.find(preset => preset[0] === button.dataset.wbPreset);
        for (const [name,,, initial] of decisionFields) controls[name].value = overrides[name] ?? initial;
        context = title + ' · 演示预设';
        updatePresets(key);
        update();
        persist();
      });
    }
    update(true);
    if(id==='cohort'&&saved.values?.segment!=null){
      controls.segment.value=saved.values.segment;
      if(!controls.segment.value)controls.segment.value='0';
      update();
    }
  }
}

export function resetWorkbenchSession(){
  for(const id of ['funnel','buyers','acquisition','rhythm','decision','cohort','ab','increment']){
    removeSession('workbench-'+id);
    document.getElementById('wb-'+id+'-form')?.reset();
  }
}
