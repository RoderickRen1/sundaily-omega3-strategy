import {
  decideNextAction, dispatchConsumer, estimateWindow, FEEDBACK_OPTIONS, getConsumerState, HOUSEHOLDS,
  LIFECYCLE_LABELS, PLAN_LABELS, RELATIONSHIP_LABELS, resetConsumer, subscribeConsumer,
} from './consumer-engine.js?v=4';

const services = [
  ['moments', 'Moments', '心意账户'],
  ['rhythm', 'Rhythm', '家庭补给'],
  ['discovery', 'Discovery', '品质探索'],
  ['lab', 'LAB', '消费者共创'],
];

const rhythmLevels = [
  ['reminder', 'Rhythm Reminder', '智能补货提醒', '接近需求窗口时，按您的授权提示补货。'],
  ['reorder', 'Rhythm Reorder', '便捷复购', '从常购商品出发，缩短重新选择的时间。'],
  ['flex', 'Rhythm Plan', '弹性周期购', '可以修改节奏、调整配送或暂停，每一期由您确认。'],
  ['care', 'Rhythm Care', '长期家庭补给', '单独为家人管理常购商品、补给节奏及授权。'],
];

const moments = [
  ['入会有惊喜', '入会礼遇', '让新会员立即感知加入的价值。', '示例权益包含品质探索和首购权益入口。'],
  ['首购有获得', '首购回馈', '围绕真实消费体验和已明确的回馈建立联系。', '示例权益包含商品体验回馈与使用说明。'],
  ['二购有理由', '二购礼遇', '先让消费者了解明确权益，再在真实需求临近时提供提醒。', '是否提醒由需求状态、授权和频控共同决定。'],
  ['长期购买有持续价值', '长期价值', '将便捷补给、家庭关爱与长期回馈放进同一账户。', '在多个家庭计划之间分别管理需求与服务。'],
];

const discovery = [
  ['trace', '批次与产地字段', '体验如何从包材进入对应商品页面，核对生产批次、产地与溯源字段。'],
  ['nutrition', '营养信息阅读', '体验如何按每份用量查看成分、计量单位和证据出处。字段需要通过实际商品资料核验。'],
  ['quality', '品质与使用说明', '体验如何找到保存、使用和售后入口，帮助验证购买前的品质判断。'],
];

const labTopics = [
  ['later', '补货提醒可以晚些再来'],
  ['favorite', '一键找到常购规格'],
  ['multi', '为家人独立管理补给'],
];

const products = ['Omega-3 日常装', 'Omega-3 轻享装', 'Omega-3 家庭装'];
const deliveries = ['由本家庭自选', '常用收货方式', '每期确认时选择'];
const momentByLifecycle = { visitor: 0, member: 0, first: 1, repeat: 2, loyal: 3 };
const feedbackLabels = Object.fromEntries(FEEDBACK_OPTIONS.map(({id, label}) => [id, label]));
const decisionLabels = { execute: '执行', delay: '延迟', silent: '保持静默' };
const traceLabels = { pass: '满足继续判断条件', trigger: '命中当前规则', skipped: '后续未判定' };

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const pressed = (selected) => `aria-pressed="${selected}"`;
const selected = (match) => match ? ' selected' : '';

function command(label, action, value = '', className = '') {
  return `<button type="button" class="exp-button ${className}" data-exp-action="${action}" data-exp-value="${escape(value)}">${escape(label)}</button>`;
}

function estimateText(window) {
  const {start, end} = window;
  if (start == null || end == null) return '等待更多反馈';
  return start === end ? `第 ${start} 天` : `第 ${start}–${end} 天`;
}

function currentFeedback(plan, day) {
  return plan.feedback && (plan.feedback.day === day || plan.snoozeUntil > day) ? plan.feedback : null;
}

function modelDemand(feedback, window, day) {
  if (feedback) return feedback.label;
  if (window.start == null) return '等待更多信号';
  if (day < window.start) return '尚未接近窗口';
  return day <= window.end ? '接近补货窗口' : '窗口已过，等待确认';
}

export function experienceLab() {
  return `<div class="experience-lab" data-experience-lab>
    <div class="exp-setup">
      <span class="exp-label">产品概念演示</span>
      <p>切换家庭、反馈库存或确认一次模拟补给，查看手机前台与经营后台如何同时更新。所有档案、权益和服务请求均为模拟。</p>
    </div>
    <div class="exp-split">
      <article class="exp-phone" id="exp-member-phone" aria-labelledby="exp-phone-title">
        <header class="exp-phone-header">
          <img src="./assets/mark.svg" alt="" width="35" height="35">
          <div><strong id="exp-phone-title">SUNDaily Membership</strong><span>圣迪乐会员中心</span></div>
          <span class="exp-device-mark" aria-hidden="true"></span>
        </header>
        <div class="exp-phone-main">
          <div class="exp-member-card">
            <p class="exp-member-label">圣迪乐 Omega-3</p>
            <strong>懂您的生活节奏。</strong>
            <p>也懂您在乎的人。</p>
            <span class="exp-member-stage" data-exp-lifecycle></span>
          </div>
          <div class="exp-services" role="group" aria-label="四大会员服务">
            ${services.map(([id, english, label]) => `<button type="button" data-exp-service="${id}" aria-controls="exp-service-body" ${pressed(id === 'rhythm')}><span>${english}</span><strong>${label}</strong></button>`).join('')}
          </div>
          <div id="exp-service-body" class="exp-service-body"></div>
          <p class="exp-feedback-message" data-exp-message role="status"></p>
          <a class="exp-jump" href="#exp-console">查看后台状态</a>
        </div>
      </article>
      <aside class="exp-console" id="exp-console" aria-labelledby="exp-console-title">
        <header class="exp-console-heading">
          <div><p class="eyebrow">Consumer Growth Console</p><h3 id="exp-console-title">消费者经营后台</h3></div>
          <span class="exp-label">模拟经营数据</span>
        </header>
        <div data-exp-console></div>
        <footer class="exp-console-footer">
          <a href="#growth-lab">进入商业验证实验室</a>
          <a class="exp-jump" href="#exp-member-phone">回到会员前台</a>
          <button type="button" class="exp-button" data-exp-action="reset">重置共享模拟状态</button>
        </footer>
      </aside>
    </div>
  </div>`;
}

function momentsView(state, stage) {
  const activeStage = stage ?? momentByLifecycle[state.lifecycle] ?? 0;
  const [caption, title, summary, condition] = moments[activeStage];
  return `<div class="exp-view-heading"><span>Moments</span><h4>心意账户</h4><p>确定的权益，合时的提醒。</p></div>
    <div class="exp-moment-track" role="group" aria-label="展示各阶段的概念礼遇">
      ${['入会', '首购', '二购', '长期'].map((label, index) => `<button type="button" data-exp-action="moment" data-exp-value="${index}" ${pressed(index === activeStage)}>${label}</button>`).join('')}
    </div>
    <div class="exp-content-card"><span class="exp-label">概念权益</span><h5>${title}</h5><p class="exp-card-lead">${caption}</p><p>${summary}</p><p>${condition}</p></div>
    ${state.lifecycle === 'visitor'
      ? command('模拟入会', 'register', '', 'exp-primary')
      : `<p class="exp-small-note">当前模拟会员状态为${LIFECYCLE_LABELS[state.lifecycle] ?? '已入会'}。可切换阶段预览相应礼遇。</p>`}`;
}

function planEditor(plan, draft) {
  const productChoices = [...new Set([plan.product, ...products].filter(Boolean))];
  const deliveryChoices = [...new Set([plan.delivery, ...deliveries].filter(Boolean))];
  return `<form class="exp-edit" data-exp-form>
    <h5>家庭补给设置</h5>
    <label for="exp-plan-product">常购商品</label>
    <select id="exp-plan-product" name="product">${productChoices.map((value) => `<option value="${escape(value)}"${selected(value === draft.product)}>${escape(value)}</option>`).join('')}</select>
    <label for="exp-plan-type">Rhythm 服务方式</label>
    <select id="exp-plan-type" name="plan">${rhythmLevels.map(([id, , label]) => `<option value="${id}"${selected(id === draft.plan)}>${label}</option>`).join('')}</select>
    <label for="exp-plan-days">参考采购间隔（天）</label>
    <input id="exp-plan-days" name="usualDays" type="number" step="1" min="3" max="45" value="${escape(draft.usualDays)}" required>
    <label for="exp-plan-delivery">模拟配送方式</label>
    <select id="exp-plan-delivery" name="delivery">${deliveryChoices.map((value) => `<option value="${escape(value)}"${selected(value === draft.delivery)}>${escape(value)}</option>`).join('')}</select>
    <p class="exp-small-note">参考间隔可设置 3–45 天，用于估计需求窗口。每期补给由家庭主动确认。</p>
    <div class="exp-actions"><button type="submit" class="exp-button exp-primary">保存设置</button>${command('取消编辑', 'cancel-edit')}</div>
  </form>`;
}

function rhythmView(state, plan, window, ui) {
  const activePlan = rhythmLevels.some(([id]) => id === plan.plan);
  return `<div class="exp-view-heading"><span>Rhythm</span><h4>家庭补给</h4><p>为每个家，设置合适的补给节奏。</p></div>
    <div class="exp-homes" role="group" aria-label="选择要管理的家庭">
      ${HOUSEHOLDS.map(({id, label}) => `<button type="button" data-exp-action="home" data-exp-value="${id}" ${pressed(id === state.activeHome)}>${escape(label)}</button>`).join('')}
    </div>
    <div class="exp-rhythm-card">
      <div class="exp-rhythm-heading"><div><span>预计补货窗口</span><strong>${estimateText(window)}</strong></div><div class="exp-rhythm-ring" aria-hidden="true"></div></div>
      <p>${escape(plan.name)} · ${escape(plan.product)}</p>
      <dl class="exp-plan-facts">
        <div><dt>当前服务</dt><dd>${escape(PLAN_LABELS[plan.plan] ?? '等待设置')}</dd></div>
        <div><dt>模拟配送</dt><dd>${escape(plan.delivery || '每期确认时选择')}</dd></div>
        <div><dt>预计库存</dt><dd>${escape(window.remaining)} 枚</dd></div>
        <div><dt>参考采购间隔</dt><dd>${escape(plan.usualDays)} 天</dd></div>
      </dl>
      <p class="exp-small-note">按模拟库存和消费反馈估计，实际需求由您确认。</p>
    </div>
    ${ui.draft ? planEditor(plan, ui.draft) : `<div class="exp-actions">
      ${command(['none', 'cancelled'].includes(plan.plan) ? '创建家庭补给' : plan.plan === 'paused' ? '恢复或调整计划' : '调整补给设置', 'edit', '', 'exp-primary')}
      ${activePlan ? command('暂停当前计划', 'pause') : ''}
    </div>`}
    <div class="exp-permission">
      <h5>提醒与授权</h5>
      <label class="exp-switch"><span>账户提醒许可</span><input type="checkbox" data-exp-toggle="permission" ${state.permission ? 'checked' : ''}></label>
      <label class="exp-switch"><span>本家庭补货授权</span><input type="checkbox" data-exp-toggle="authorization" ${plan.authorization ? 'checked' : ''}></label>
      <p>账户许可与当前家庭授权均开启后，模型才考虑主动提醒。此处授权随时可撤回并仅作用于本次概念体验。</p>
    </div>
    <h5 class="exp-panel-label">今天家里还需要什么？</h5>
    <div class="exp-feedback" role="group" aria-label="家庭需求反馈">
      ${FEEDBACK_OPTIONS.map(({id, label}) => `<button type="button" data-exp-action="feedback" data-exp-value="${id}" ${pressed(plan.feedback?.value === id)}>${escape(label)}</button>`).join('')}
    </div>
    <p class="exp-small-note">反馈会改变经营决定，并保留为本家庭的模拟自述信息。</p>
    ${ui.confirmRequest ? `<div class="exp-content-card exp-confirm">
      <h5>确认${escape(plan.name)}的模拟补给请求</h5>
      <p>${escape(plan.product)} · ${escape(plan.delivery || '每期确认时选择')}</p>
      <p>确认后只在本页写入主动服务请求。</p>
      <div class="exp-actions">${command('确认模拟补给', 'confirm-request', '', 'exp-primary')}${command('返回', 'cancel-request')}</div>
    </div>` : state.request
      ? `<p class="exp-request-state">模拟补给请求已记录，可在经营后台查看处理优先级。</p>`
      : `<div class="exp-actions">${command('预览本期补给确认', 'request')}</div>`}
    <details class="exp-rhythm-levels"><summary>了解 Rhythm 四种服务方式</summary>
      <dl>${rhythmLevels.map(([, english, label, detail]) => `<div><dt>${label}<span>${english}</span></dt><dd>${detail}</dd></div>`).join('')}</dl>
    </details>`;
}

function discoveryView(topic) {
  const [id, title, detail] = discovery.find(([key]) => key === topic) ?? discovery[0];
  return `<div class="exp-view-heading"><span>Discovery</span><h4>品质探索</h4><p>在购买前看懂商品信息，在体验后知道哪里可查。</p></div>
    <div class="exp-discovery-options" role="group" aria-label="选择品质探索场景">
      ${discovery.map(([key, label]) => `<button type="button" data-exp-action="discovery" data-exp-value="${key}" ${pressed(id === key)}>${label}</button>`).join('')}
    </div>
    <div class="exp-content-card">
      <span class="exp-label">字段示例</span>
      <h5>${title}</h5><p>${detail}</p>
      ${command('记录本次品质探索', 'record-discovery', id)}
    </div>`;
}

function labView(topic) {
  return `<div class="exp-view-heading"><span>LAB</span><h4>消费者共创</h4><p>选择一个场景，体验需求如何进入消费者研究。</p></div>
    <div class="exp-lab-options" role="group" aria-label="选择一个模拟共创提案">
      ${labTopics.map(([id, label]) => `<button type="button" data-exp-action="lab-topic" data-exp-value="${id}" ${pressed(id === topic)}>${label}</button>`).join('')}
    </div>
    <p class="exp-small-note">以模拟需求记录参与体验，提交后可查看对应事件。</p>
    <div class="exp-actions"><button type="button" class="exp-button exp-primary" data-exp-action="submit-topic"${topic ? '' : ' disabled'}>提交模拟提案</button></div>`;
}

function consoleView(state, plan, window) {
  const action = decideNextAction(state);
  const feedback = currentFeedback(plan, state.day);
  const conditions = [
    ['Lifecycle', '消费阶段', LIFECYCLE_LABELS[state.lifecycle] ?? '未记录', '模拟记录'],
    ['Demand', '需求状态', modelDemand(feedback, window, state.day), feedback ? '自述信息' : '模型估计'],
    ['Relationship', '品牌关系', RELATIONSHIP_LABELS[state.relationship] ?? '待识别', '模拟记录'],
    ['Rhythm', '周期计划', PLAN_LABELS[plan.plan] ?? '等待设置', '自述信息'],
    ['Service', '服务状态', state.serviceOpen ? '售后待处理' : state.pendingOrder ? '履约待处理' : state.request ? '主动补给请求' : '常规服务', '模拟记录'],
    ['Permission', '提醒许可', `账户${state.permission ? '已开启' : '已关闭'} · 家庭${plan.authorization ? '已授权' : '未授权'}`, '自述信息'],
  ];
  const items = state.events.slice(0, 6);
  return `<div class="exp-console-main">
    <div class="exp-profile"><strong>${escape(plan.name)}</strong><span>Consumer Passport · DEMO-01 · 模拟第 ${state.day} 天</span></div>
    <dl class="exp-console-facts">
      ${conditions.map(([key, label, data, source]) => `<div><dt><span>${key}</span> ${label}</dt><dd><strong>${escape(data)}</strong><span>${source}</span></dd></div>`).join('')}
    </dl>
    <div class="exp-console-window">
      <div><span>模型估计</span><strong>${estimateText(window)}</strong><p>当前家庭补货窗口 · ${escape(window.confidence)}</p></div>
      <p>${escape(window.reason)}</p>
    </div>
    <div class="exp-nba" data-outcome="${escape(action.outcome)}">
      <div class="exp-nba-heading"><span>Next Best Action</span><strong>${decisionLabels[action.outcome] ?? '待判断'}</strong></div>
      <h4>${escape(action.title)}</h4><p>${escape(action.reason)}</p>
      <dl class="exp-stop"><div><dt>停止条件</dt><dd>${escape(action.stop)}</dd></div></dl>
      ${action.trace.length ? `<details class="exp-trace"><summary>查看判断依据</summary><ol>${action.trace.map(({rule, status, detail}) => `<li><strong>${escape(rule)}</strong><span>${escape(traceLabels[status] ?? status)}</span><p>${escape(detail)}</p></li>`).join('')}</ol></details>` : ''}
    </div>
    <div class="exp-event-history">
      <h4>共享事件记录</h4><p>同时显示本页与商业验证实验室的模拟操作，按家庭标记。</p>
      ${items.length ? `<ol>${items.map(({day, label, category, home, detail}) => `<li>
        <div><strong>${escape(label)}</strong><span>第 ${escape(day)} 天 · ${escape(state.homes[home]?.name ?? '统一会员')}</span></div>
        <p>${escape(detail || category)}</p><span class="exp-event-source">${escape(category)}</span>
      </li>`).join('')}</ol>` : '<p>反馈或调整一次补给设置后，将在这里更新模拟事件。</p>'}
    </div>
  </div>`;
}

function actionButton(container, action, value) {
  return [...container.querySelectorAll('button[data-exp-action]')].find((element) =>
    element.dataset.expAction === action && element.dataset.expValue === value);
}

export function bindExperienceLab(root = document) {
  const container = root.querySelector('[data-experience-lab]');
  if (!container) return;
  const panel = container.querySelector('#exp-service-body');
  const consolePanel = container.querySelector('[data-exp-console]');
  const message = container.querySelector('[data-exp-message]');
  const ui = {service: 'rhythm', moment: null, draft: null, confirmRequest: false, discovery: 'trace', labTopic: null};
  let previousHome;

  function render(state) {
    if (previousHome && previousHome !== state.activeHome) {
      ui.draft = null;
      ui.confirmRequest = false;
    }
    previousHome = state.activeHome;
    const current = container.ownerDocument.activeElement;
    const focusFromPanel = current && panel.contains(current);
    const consentToggle = current?.dataset.expToggle;
    const expanded = [...container.querySelectorAll('details[open]')].map((node) => node.className);
    const plan = state.homes[state.activeHome];
    const window = estimateWindow(plan, state.day);
    container.querySelector('[data-exp-lifecycle]').textContent = `概念会员 · ${LIFECYCLE_LABELS[state.lifecycle] ?? '待识别'}`;
    container.querySelectorAll('[data-exp-service]').forEach((button) => {
      button.setAttribute('aria-pressed', String(ui.service === button.dataset.expService));
    });
    if (ui.service === 'rhythm') panel.innerHTML = rhythmView(state, plan, window, ui);
    if (ui.service === 'moments') panel.innerHTML = momentsView(state, ui.moment);
    if (ui.service === 'discovery') panel.innerHTML = discoveryView(ui.discovery);
    if (ui.service === 'lab') panel.innerHTML = labView(ui.labTopic);
    consolePanel.innerHTML = consoleView(state, plan, window);
    container.querySelectorAll('details').forEach((node) => { node.open = expanded.includes(node.className); });

    if (focusFromPanel) {
      const same = current.id ? container.ownerDocument.getElementById(current.id)
        : consentToggle ? panel.querySelector(`[data-exp-toggle="${consentToggle}"]`)
          : actionButton(panel, current.dataset.expAction, current.dataset.expValue);
      same?.focus({preventScroll: true});
    }
  }

  function focusAction(type, value = '') {
    actionButton(panel, type, value)?.focus({preventScroll: true});
  }

  function announce(text) { message.textContent = text; }

  subscribeConsumer(render);
  container.addEventListener('click', (event) => {
    const serviceButton = event.target.closest('[data-exp-service]');
    if (serviceButton) {
      ui.service = serviceButton.dataset.expService;
      ui.draft = null;
      ui.confirmRequest = false;
      ui.moment = null;
      announce('');
      render(getConsumerState());
      return;
    }

    const button = event.target.closest('button[data-exp-action]');
    if (!button) return;
    const {expAction: action, expValue: value = ''} = button.dataset;
    const state = getConsumerState();
    const home = state.activeHome;
    const plan = state.homes[home];

    switch (action) {
      case 'home':
        if (home === value) return;
        announce(`已切换至${state.homes[value].name}。`);
        dispatchConsumer('select-home', {home: value});
        break;
      case 'edit':
        ui.draft = {
          product: plan.product,
          plan: rhythmLevels.some(([key]) => key === plan.plan) ? plan.plan : plan.priorPlan ?? 'flex',
          usualDays: plan.usualDays,
          delivery: plan.delivery || deliveries[0],
        };
        ui.confirmRequest = false;
        render(state);
        panel.querySelector('#exp-plan-product')?.focus();
        break;
      case 'cancel-edit':
        ui.draft = null;
        render(state);
        focusAction('edit');
        break;
      case 'pause':
        announce(`已暂停${plan.name}的补给计划。经营后台会重新判断下一步。`);
        dispatchConsumer('event', {type: 'pause', home});
        focusAction('edit');
        break;
      case 'feedback':
        dispatchConsumer('feedback', {home, value});
        announce(`已记录「${feedbackLabels[value]}」。补给窗口和经营决定已更新。`);
        break;
      case 'request':
        ui.confirmRequest = true;
        ui.draft = null;
        render(state);
        actionButton(panel, 'confirm-request', '')?.focus();
        break;
      case 'cancel-request':
        ui.confirmRequest = false;
        render(state);
        focusAction('request');
        break;
      case 'confirm-request':
        ui.confirmRequest = false;
        dispatchConsumer('set-policy', {request: true});
        announce(`已记录${plan.name}的模拟补给请求。查看后台的优先处理决定。`);
        panel.querySelector('.exp-request-state')?.setAttribute('tabindex', '-1');
        panel.querySelector('.exp-request-state')?.focus({preventScroll: true});
        break;
      case 'moment':
        ui.moment = Number(value);
        render(state);
        break;
      case 'register':
        dispatchConsumer('event', {type: 'register', home});
        announce('已更新模拟会员阶段，可查看入会礼遇。');
        break;
      case 'discovery':
        ui.discovery = value;
        render(state);
        break;
      case 'record-discovery':
        dispatchConsumer('event', {type: 'quality-explore', home, detail: discovery.find(([id]) => id === value)?.[1]});
        announce('已记录一次品质探索事件。');
        break;
      case 'lab-topic':
        ui.labTopic = value;
        render(state);
        break;
      case 'submit-topic': {
        const topic = labTopics.find(([id]) => id === ui.labTopic);
        if (!topic) return;
        dispatchConsumer('event', {type: 'lab-feedback', home, detail: topic[1]});
        announce(`已记录模拟提案「${topic[1]}」。`);
        break;
      }
      case 'reset':
        ui.draft = null;
        ui.confirmRequest = false;
        ui.moment = null;
        ui.labTopic = null;
        resetConsumer();
        announce('共享模拟已恢复至初始状态。');
        break;
    }
  });

  container.addEventListener('input', (event) => {
    if (ui.draft && event.target.form?.hasAttribute('data-exp-form')) ui.draft[event.target.name] = event.target.value;
  });

  container.addEventListener('change', (event) => {
    const control = event.target;
    if (!control.dataset.expToggle) return;
    const {activeHome: home, homes} = getConsumerState();
    if (control.dataset.expToggle === 'permission') {
      dispatchConsumer('set-policy', {permission: control.checked});
      announce(`账户提醒许可已${control.checked ? '开启' : '关闭'}。`);
    } else {
      dispatchConsumer('update-home', {home, authorization: control.checked});
      announce(`${homes[home].name}的补货提醒授权已${control.checked ? '开启' : '关闭'}。`);
    }
  });

  container.addEventListener('submit', (event) => {
    if (!event.target.hasAttribute('data-exp-form')) return;
    event.preventDefault();
    const fields = new FormData(event.target);
    const {activeHome: home, homes} = getConsumerState();
    ui.draft = null;
    dispatchConsumer('update-home', {
      home,
      product: fields.get('product'),
      plan: fields.get('plan'),
      usualDays: Number(fields.get('usualDays')),
      delivery: fields.get('delivery'),
    });
    announce(`已保存${homes[home].name}的补给设置。模拟需求窗口已重新估计。`);
    focusAction('edit');
  });
}
