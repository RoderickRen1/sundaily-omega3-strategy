import {
  HOUSEHOLDS, FEEDBACK_OPTIONS, EVENT_TYPES, PLAN_LABELS, LIFECYCLE_LABELS, RELATIONSHIP_LABELS,
  dispatchConsumer, getConsumerState, subscribeConsumer, resetConsumer, estimateWindow, decideNextAction,
} from './consumer-engine.js?v=7';

const numeric = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });
const amount = (value) => numeric.format(value);
const percent = (value) => `${amount(100 * value)}%`;
const escaped = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const selectOptions = (entries) => entries.map(({id, label}) => `<option value="${id}">${label}</option>`).join('');
const pills = (id, entries) => `<div class="choices gl-choices" id="${id}">${entries.map(({id, label}, index) =>
  `<button type="button" data-gl-choice="${id}" aria-pressed="${!index}">${label}</button>`).join('')}</div>`;
const knob = (name, caption, value, min, max, step = 1) => `<label class="gl-field">${caption}
  <input name="${name}" type="number" min="${min}" max="${max}" step="${step}" inputmode="${step === 1 ? 'numeric' : 'decimal'}" value="${value}"></label>`;
const check = (name, caption) => `<label class="gl-check"><input type="checkbox" name="${name}"><span>${caption}</span></label>`;
const metrics = (entries) => `<dl class="gl-metrics">${entries.map(([label, value]) =>
  `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;

const studies = [
  { id: 'cohort', label: '同期群' }, { id: 'ab', label: 'A/B 对照' },
  { id: 'increment', label: '增量贡献' }, { id: 'unit', label: '单客经济' },
];

export function growthLab() {
  return `<div class="growth-lab" id="growth-console">
    <div class="gl-intro">
      <div><p class="eyebrow">Consumer Growth Console</p><h3>从家庭信号，到经营决策</h3></div>
      <p>这套后台与<a href="#experience-lab">产品体验实验室</a>共用同一个模拟消费者。切换家庭、调整库存或提交模拟需求反馈，查看系统为何执行、延迟或保持静默。</p>
    </div>
    <div class="gl-toolbar">
      <label class="gl-field gl-home">选择家庭<select id="gl-home">${selectOptions(HOUSEHOLDS)}</select></label>
      <div class="gl-clock"><strong id="gl-day">第 24 天</strong><span>模拟时间</span></div>
      <div class="gl-toolbar-actions"><button class="button button-small" type="button" data-gl-advance="1">推进 1 天</button>
        <button class="button button-small" type="button" data-gl-advance="3">推进 3 天</button>
        <button class="button button-small" type="button" id="gl-reset">重置体验与后台样例</button></div>
    </div>
    <div class="gl-two">
      <article class="gl-panel gl-forecast">
        <p class="gl-kind">模型估计 · 模拟经营数据</p>
        <h4>动态需求窗口</h4>
        <p class="gl-description">按当前库存和家庭日耗估算补货窗口。品类采购间隔是独立的研究参考。收到主动库存反馈后重新估计。</p>
        <div id="gl-window"></div>
        <form id="gl-forecast-inputs" class="gl-inputs">
          ${knob('stock', '今天报告的库存（枚）', 7, 0, 120, .1)}
          ${knob('rate', '家庭日耗估计（枚 / 天）', 1.2, .1, 6, .05)}
          ${knob('usualDays', '品类采购间隔（天）', 10, 3, 45)}
          <button type="submit" class="button button-small">应用家庭假设</button>
        </form>
        <p id="gl-window-reason" class="gl-description"></p>
        <div class="gl-feedback" role="group" aria-label="选择家庭消费反馈">
          ${FEEDBACK_OPTIONS.map(({id, label}) => `<button type="button" class="button button-small" data-gl-feedback="${id}" aria-pressed="false">${label}</button>`).join('')}
        </div>
      </article>
      <article class="gl-panel gl-decision">
        <p class="gl-kind">产品概念演示 · Next Best Action</p>
        <h4>最优下一步经营决策</h4>
        <div id="gl-decision" aria-live="polite"></div>
        <div class="gl-decision-actions"><button class="button button-small button-primary" id="gl-execute" type="button">模拟执行</button><span>仅写入模拟事件</span></div>
        <details class="gl-trace" open>
          <summary>逐条查看判断与停止条件</summary>
          <ol id="gl-trace"></ol>
        </details>
      </article>
    </div>
    <div class="gl-state">
      <div class="gl-deck"><h4>消费者状态与触达规则</h4><p class="gl-description">账户许可与触达上限在会员身份下共享。家庭授权、订单、服务、库存及需求分别判断。</p></div>
      <dl id="gl-dimensions" class="gl-dimensions"></dl>
      <form class="gl-policy" id="gl-policy">
        ${check('request', '该家庭有主动服务请求')}
        ${check('permission', '账号允许主动经营触达')}
        ${check('authorization', '该家庭授权补货提醒')}
        ${check('pendingOrder', '该家庭有待履约订单')}
        ${check('serviceOpen', '该家庭有在办售后')}
        ${knob('frequencyDays', '账号触达间隔（天）', 4, 0, 30)}
        <label class="gl-field">品牌关系自述<select name="relationship">${selectOptions(Object.entries(RELATIONSHIP_LABELS).map(([id, label]) => ({id, label})))}</select></label>
        <button type="button" class="button button-small" id="gl-record-contact">记录本日已触达</button>
      </form>
    </div>
    <div class="gl-events">
      <div class="gl-deck"><h4>模拟事件记录</h4><p class="gl-description">区分业务记录、消费者自述与模型估计。包装访问、支付和履约分开记录。</p></div>
      <form id="gl-event-form" class="gl-event-form">
        <label class="gl-field">选择业务事件<select id="gl-event-choice" name="type">${selectOptions(EVENT_TYPES)}</select></label>
        <button class="button button-small" type="submit">写入模拟事件</button>
        <p id="gl-event-meaning" class="gl-description"></p><p id="gl-event-status" class="gl-description" role="status"></p>
      </form>
      <div class="table-scroll" role="region" aria-label="模拟事件流水" tabindex="0">
        <table class="gl-event-table"><thead><tr><th scope="col">时间 / 家庭</th><th scope="col">事件</th><th scope="col">信息类型</th><th scope="col">业务含义</th></tr></thead>
        <tbody id="gl-event-log"></tbody></table>
      </div>
    </div>
    <section class="gl-validation" id="growth-validation">
      <div class="gl-intro"><div><p class="eyebrow">Growth Validation</p><h3>验证经营是否创造增量</h3></div>
        <p>先观察获取、激活和消费成熟度，再用同口径对照计算增量与经营成本。以下样本、金额与参数均为模拟。</p></div>
      <dl class="gl-measures">
        <div><dt>获取与激活</dt><dd>新增会员、渠道转化、首次有效会员动作。</dd></div>
        <div><dt>首购与二购</dt><dd>经交易验证的首购、达观察期后的二购。</dd></div>
        <div><dt>周期与单客价值</dt><dd>触达抑制、复购间隔、增量贡献、获客与服务成本。</dd></div>
      </dl>
      ${pills('gl-study-toggle', studies)}
      <article data-gl-study="cohort" class="gl-study">
        <h4>同期群分析</h4>
        <p class="gl-description">按入会批次观察首购，再以首购日期为起点计算二购。二购分母仅使用已达到相同观察窗的首购会员。</p>
        <label class="gl-field gl-cohort-choice">首购后观察窗<select id="gl-cohort-window"><option value="14">14 天</option><option value="28" selected>28 天</option><option value="56">56 天</option></select></label>
        <div class="table-scroll" role="region" aria-label="同期群购买指标" tabindex="0"><table>
          <thead><tr><th scope="col">模拟同期群</th><th scope="col">新增会员</th><th scope="col">首购验证</th><th scope="col">达到观察窗的首购会员</th><th scope="col">窗内二购验证</th></tr></thead>
          <tbody id="gl-cohort-table"></tbody>
        </table></div>
      </article>
      <article data-gl-study="ab" class="gl-study" hidden>
        <h4>A/B 对照实验</h4>
        <p class="gl-description">示例按同一观察期比较对照组和实验组的已验证购买转化。两个组分别以分配到该组的人数为分母。</p>
        <form id="gl-ab" class="gl-inputs">
          ${knob('controlSize', '对照组人数', 1000, 1, 1000000)}
          ${knob('controlSales', '对照组转化人数', 180, 0, 1000000)}
          ${knob('testSize', '实验组人数', 1000, 1, 1000000)}
          ${knob('testSales', '实验组转化人数', 220, 0, 1000000)}
        </form>
        <div id="gl-ab-output" aria-live="polite"></div>
        <p class="gl-description">该区间用 Wilson 分数区间组合计算，适用于此独立分组的示例。正式实验还须确认随机分组、归因与共同观察期。</p>
      </article>
      <article data-gl-study="increment" class="gl-study" hidden>
        <h4>可归因增量贡献</h4>
        <p class="gl-description">使用当前 A/B 模拟率差，假设每位增量转化者贡献一笔订单。规模外推适用同一实验人群与归因规则，真实业务中的归因需另行验证。</p>
        <form id="gl-increment" class="gl-inputs">
          ${knob('audience', '适用实验人群（人）', 10000, 1, 1000000)}
          ${knob('basket', '转化净收入（元 / 单）', 90, 0, 100000, .1)}
          ${knob('grossRate', '增量贡献率（%）', 30, 0, 100, .1)}
          ${knob('programCost', '独立经营投入（元）', 5000, 0, 10000000, .1)}
        </form>
        <div id="gl-increment-output" aria-live="polite"></div>
        <p class="gl-description">增量转化 = 适用人数 × 率差。增量贡献 = 增量转化 × 每单净收入 × 贡献率。净贡献扣除独立经营投入。</p>
      </article>
      <article data-gl-study="unit" class="gl-study" hidden>
        <h4>单客经营经济模型</h4>
        <p class="gl-description">所有金额按相同经营期计算。增量贡献引用上一页的模拟模型，并在此拆分获客和服务两类成本。</p>
        <form id="gl-unit" class="gl-inputs">
          ${knob('members', '可归因新增会员（人）', 400, 1, 1000000)}
          ${knob('acquisition', '获客成本合计（元）', 3800, 0, 10000000, .1)}
          ${knob('service', '服务成本合计（元）', 1200, 0, 10000000, .1)}
        </form>
        <div id="gl-unit-output" aria-live="polite"></div>
        <p class="gl-description">单客净贡献 =（增量贡献 − 获客成本 − 服务成本）÷ 同期可归因新增会员数。该分母来自独立的新增会员归因假设。</p>
      </article>
      <p class="gl-bookmark"><a href="#simulator">查看 V1.0 商业价值模拟器</a></p>
    </section>
  </div>`;
}

const outcomeLabels = { execute: '执行', delay: '延迟', silent: '静默' };
const traceLabels = { pass: '通过', trigger: '决定', skipped: '无需评估' };

function chart(window, home, day) {
  const width = 536, height = 104, left = 30, top = 13;
  const horizon = Math.max(14, window.end - day + 2);
  const end = day + horizon;
  const x = (date) => left + (date - day) * width / horizon;
  const ceiling = Math.max(12, window.remaining + 1);
  const y = (value) => top + height * (1 - Math.min(value, ceiling) / ceiling);
  const series = [day, Math.min(end, day + window.remaining / home.rate), end].map((date) =>
    `${x(date)},${y(Math.max(0, window.remaining - home.rate * (date - day)))}`).join(' ');
  const ticks = [day, day + Math.round(horizon / 2), end];
  return `<svg class="gl-chart" viewBox="0 0 600 125" role="img" aria-label="第 ${day} 天起的估计库存曲线。阴影表示第 ${window.start} 至 ${window.end} 天的需求窗口。">
    ${window.end >= day ? `<rect class="gl-chart-range" x="${x(Math.max(day, window.start))}" y="${top}" width="${Math.max(3, x(window.end) - x(Math.max(day, window.start)))}" height="${height}"></rect>` : ''}
    <path class="gl-chart-axis" d="M${left} ${top}v${height}h${width}"></path>
    <polyline class="gl-chart-stock" points="${series}" />
    <circle class="gl-chart-point" cx="${left}" cy="${y(window.remaining)}" r="4"></circle>
  </svg><div class="gl-chart-ticks" aria-hidden="true">${ticks.map((date) => `<span>第 ${date} 天</span>`).join('')}</div>`;
}

const cohort = [
  ['样例第 1 周', 800, 280, {14:[265, 52], 28:[246, 80], 56:[201, 98]}],
  ['样例第 2 周', 700, 257, {14:[224, 54], 28:[200, 74], 56:[0, 0]}],
  ['样例第 3 周', 650, 230, {14:[167, 38], 28:[0, 0], 56:[0, 0]}],
];

function wilson(successes, sample) {
  const ratio = successes / sample;
  const z = 1.96;
  const denominator = 1 + z * z / sample;
  const center = (ratio + z * z / (2 * sample)) / denominator;
  const radius = z * Math.sqrt((ratio * (1 - ratio) + z * z / (4 * sample)) / sample) / denominator;
  return [center - radius, center + radius];
}

function diffInterval(controlSales, controlSize, testSales, testSize) {
  const a = controlSales / controlSize;
  const b = testSales / testSize;
  const [aLow, aHigh] = wilson(controlSales, controlSize);
  const [bLow, bHigh] = wilson(testSales, testSize);
  return [
    b - a - Math.hypot(b - bLow, aHigh - a),
    b - a + Math.hypot(bHigh - b, a - aLow),
  ];
}

export function bindGrowthLab(root = document) {
  const lab = root.querySelector('#growth-console');
  if (!lab) return;
  const q = (selector) => lab.querySelector(selector);
  const qa = (selector) => [...lab.querySelectorAll(selector)];
  const forecastForm = q('#gl-forecast-inputs');
  const policyForm = q('#gl-policy');
  const eventForm = q('#gl-event-form');
  const eventChoice = q('#gl-event-choice');

  function updateConsole(state) {
    const home = state.homes[state.activeHome];
    const window = estimateWindow(home, state.day);
    const action = decideNextAction(state);

    q('#gl-home').value = state.activeHome;
    q('#gl-day').textContent = `第 ${state.day} 天`;
    forecastForm.elements.stock.value = window.remaining ?? '';
    forecastForm.elements.rate.value = home.rate;
    forecastForm.elements.usualDays.value = home.usualDays;
    for (const key of ['request', 'permission', 'authorization', 'pendingOrder', 'serviceOpen']) {
      policyForm.elements[key].checked = key === 'authorization' ? home.authorization : state[key];
    }
    policyForm.elements.frequencyDays.value = state.frequencyDays;
    policyForm.elements.relationship.value = state.relationship;
    qa('[data-gl-feedback]').forEach((button) => {
      button.setAttribute('aria-pressed', String(home.feedback?.value === button.dataset.glFeedback));
    });

    q('#gl-window').innerHTML = `
      ${metrics([['估计需求窗口', window.start == null ? '未知' : `第 ${window.start}–${window.end} 天`], ['估计剩余库存', window.remaining == null ? '未知' : `${amount(window.remaining)} 枚`]])}
      ${window.start == null ? '' : chart(window, home, state.day) + '<p class="gl-chart-key"><span>库存变化</span><span>需求窗口</span></p>'}`;
    q('#gl-window-reason').textContent = `${window.confidence}。 ${window.reason}`;
    q('#gl-decision').innerHTML = `<div class="gl-decision-result" data-outcome="${action.outcome}">
      <span class="gl-outcome">${outcomeLabels[action.outcome]}</span><strong>${escaped(action.title)}</strong>
      <p>${escaped(action.reason)}</p><p><b>停止或重算条件</b> ${escaped(action.stop)}</p></div>`;
    q('#gl-execute').disabled = action.outcome !== 'execute';
    q('#gl-trace').innerHTML = action.trace.map(({rule, status, detail}) =>
      `<li data-status="${status}"><span>${traceLabels[status]}</span><div><strong>${rule}</strong><p>${escaped(detail)}</p></div></li>`).join('');

    const dimensions = [
      ['Lifecycle 消费阶段', LIFECYCLE_LABELS[state.lifecycle], '业务记录'],
      ['Demand 需求状态', window.start == null ? '未知' : state.day >= window.start && state.day <= window.end ? '进入估计需求窗口' : '等待预计窗口', '模型估计'],
      ['Relationship 品牌关系', RELATIONSHIP_LABELS[state.relationship], '消费者自述'],
      ['Rhythm 周期计划', PLAN_LABELS[home.plan], '消费者自述'],
      ['Service 服务状态', home.request ? '有主动请求' : home.serviceOpen ? '售后进行中' : home.pendingOrder ? '待履约' : '暂无待处理服务', home.request ? '消费者自述' : '业务记录'],
      ['Permission 触达许可', state.permission && home.authorization ? '账号与家庭均授权' : '主动触达禁止', '消费者自述'],
    ];
    const activeOrder = state.sandbox?.orders.some(order => order.home === home.id && order.status === 'paid');
    policyForm.elements.pendingOrder.disabled = Boolean(activeOrder);
    policyForm.elements.serviceOpen.disabled = home.serviceCase?.status === 'open';
    q('#gl-dimensions').innerHTML = dimensions.map(([label, value, source]) =>
      `<div><dt>${label}</dt><dd>${value}<small>${source}</small></dd></div>`).join('');
    q('#gl-event-log').innerHTML = state.events.map(({ day, label, category, home, detail }) =>
      `<tr><td>第 ${day} 天 · ${escaped(state.homes[home].name)}</td><th scope="row">${escaped(label)}</th><td>${escaped(category)}</td><td>${escaped(detail)}</td></tr>`).join('');
  }

  q('#gl-home').addEventListener('change', (event) => dispatchConsumer('select-home', { home: event.target.value }));
  q('#gl-reset').addEventListener('click', resetConsumer);
  q('#gl-execute').addEventListener('click', () => dispatchConsumer('send-action'));
  q('#gl-record-contact').addEventListener('click', () => dispatchConsumer('set-policy', { lastContact: getConsumerState().day }));
  qa('[data-gl-advance]').forEach((button) => button.addEventListener('click', () => dispatchConsumer('advance', {days: Number(button.dataset.glAdvance)})));
  qa('[data-gl-feedback]').forEach((button) => button.addEventListener('click', () => dispatchConsumer('feedback', {value: button.dataset.glFeedback})));
  forecastForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (forecastForm.reportValidity()) dispatchConsumer('update-home', Object.fromEntries(new FormData(forecastForm)));
  });

  policyForm.addEventListener('change', (event) => {
    const { name, type, checked, valueAsNumber } = event.target;
    if (name === 'authorization') dispatchConsumer('event', {type:'permission', granted:checked});
    else if (name === 'relationship') dispatchConsumer('set-policy', { relationship: event.target.value });
    else if (type === 'checkbox') dispatchConsumer('set-policy', { [name]: checked });
    else if (event.target.reportValidity()) dispatchConsumer('set-policy', { [name]: valueAsNumber });
  });
  function updateEventMeaning() {
    q('#gl-event-meaning').textContent = EVENT_TYPES.find(({id}) => id === eventChoice.value).meaning;
  }
  eventChoice.addEventListener('change', updateEventMeaning);
  eventForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const before = getConsumerState().sandbox?.eventSerial;
    const after = dispatchConsumer('event', { type: eventChoice.value });
    q('#gl-event-status').textContent = before === after.sandbox?.eventSerial
      ? '当前家庭没有符合条件的记录，或该动作已经完成。' : '已记录模拟事件。';
  });

  const controls = qa('#gl-study-toggle [data-gl-choice]');
  controls.forEach((button) => button.addEventListener('click', () => {
    controls.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    qa('[data-gl-study]').forEach((study) => { study.hidden = study.dataset.glStudy !== button.dataset.glChoice; });
  }));

  function updateCohort() {
    const days = q('#gl-cohort-window').value;
    q('#gl-cohort-table').innerHTML = cohort.map(([label, members, first, windows]) => {
      const [eligible, repeat] = windows[days];
      return `<tr><th scope="row">${label}</th><td>${amount(members)}</td><td>${amount(first)} · ${percent(first / members)}</td>
        <td>${eligible ? amount(eligible) : '观察期未满'}</td><td>${eligible ? `${amount(repeat)} · ${percent(repeat / eligible)}` : '—'}</td></tr>`;
    }).join('');
  }

  const forms = ['#gl-ab', '#gl-increment', '#gl-unit'].map(q);
  function readNumbers(form) {
    if (!Array.from(form.elements).every((input) => input.validity.valid && Number.isFinite(input.valueAsNumber))) return null;
    return Object.fromEntries(Array.from(form.elements, ({name, valueAsNumber}) => [name, valueAsNumber]));
  }
  const describeDelta = (ratio) => `${ratio > 0 ? '+' : ''}${amount(ratio * 100)} 个百分点`;
  function updateStudies() {
    const [ab, growth, unit] = forms.map(readNumbers);
    const validTest = ab && ab.controlSales <= ab.controlSize && ab.testSales <= ab.testSize;
    if (!validTest) {
      q('#gl-ab-output').textContent = '请输入有效人数，转化人数范围为零至所在组的样本人数。';
      q('#gl-increment-output').textContent = '填写有效的 A/B 实验参数后查看增量。';
      q('#gl-unit-output').textContent = '填写有效的 A/B 实验参数后查看单客结果。';
      return;
    }
    const {controlSize, controlSales, testSize, testSales} = ab;
    const [controlRate, testRate] = [controlSales / controlSize, testSales / testSize];
    const delta = testRate - controlRate;
    const [lower, upper] = diffInterval(controlSales, controlSize, testSales, testSize);
    q('#gl-ab-output').innerHTML = metrics([
      ['对照组转化率', percent(controlRate)], ['实验组转化率', percent(testRate)],
      ['绝对转化率差', describeDelta(delta)],
      ['模拟 95% 区间', `${amount(lower * 100)} 至 ${amount(upper * 100)} 个百分点`],
    ]) + `<p class="gl-description">${lower <= 0 && upper >= 0 ? '按设定的样本数量和独立分组假设计算，模拟区间包含零。' : '按设定的样本数量和独立分组假设计算，模拟区间位于零的一侧。真实效果须以正式对照实验验证。'}</p>`;

    if (!growth) {
      q('#gl-increment-output').textContent = '请输入有效的经营参数。';
      q('#gl-unit-output').textContent = '填写有效的增量经营参数后查看单客结果。';
      return;
    }
    const expectedOrders = growth.audience * delta;
    const revenue = expectedOrders * growth.basket;
    const contribution = revenue * growth.grossRate / 100;
    q('#gl-increment-output').innerHTML = metrics([
      ['估计增量转化', `${amount(expectedOrders)} 单`], ['估计增量成交金额', `${amount(revenue)} 元`],
      ['估计增量贡献', `${amount(contribution)} 元`], ['扣除独立经营投入', `${amount(contribution - growth.programCost)} 元`],
    ]);
    q('#gl-unit-output').innerHTML = unit ? metrics([
      ['获客成本 CAC', `${amount(unit.acquisition / unit.members)} 元 / 人`],
      ['单客经营成本', `${amount((unit.acquisition + unit.service) / unit.members)} 元 / 人`],
      ['单客增量贡献', `${amount(contribution / unit.members)} 元 / 人`],
      ['单客净贡献', `${amount((contribution - unit.acquisition - unit.service) / unit.members)} 元 / 人`],
    ]) : '请输入有效的获客与服务参数。';
  }
  forms.forEach((form) => {
    form.addEventListener('input', updateStudies);
    form.addEventListener('submit', (event) => event.preventDefault());
  });
  q('#gl-cohort-window').addEventListener('change', updateCohort);
  updateEventMeaning();
  updateCohort();
  updateStudies();
  subscribeConsumer(updateConsole);
}
