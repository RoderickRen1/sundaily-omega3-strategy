export const SCENARIOS = [
  ['scan', '包装扫码 → 会员注册', '已查看包装，身份和购买均待验证。'],
  ['content', '内容触达 → 首次购买', '从家庭早餐内容进入，可直接购买体验规格。'],
  ['repeat', '首购 → 二购', '已收到 20 枚鸡蛋。日均消耗 2 枚，提前 2 天识别需求。'],
  ['cycle', '规律复购 → 周期购', '已有多次有效购买，可按家庭设置弹性周期计划。'],
  ['family', 'Multi-Home 家庭关爱', '我的家已有计划，可为家人创建独立计划。'],
  ['exception', '非理想消费者行为', '对比库存、授权、在途、售后与忽略提醒等分支。'],
];

export const BENEFITS = [
  ['welcome', '入会礼遇', '完成模拟注册后可用。'],
  ['first', '首购回馈', '已入会且至少有一次验证消费。'],
  ['repeat', '二购礼遇', '已入会且至少有两次验证消费。'],
  ['loyal', '长期关系认可', '稳定消费后仍需消费者明确表达优先选择。'],
  ['care', '家庭关爱权益', '已入会并为家人的家庭设置补给服务。'],
];

/** @type {Array<[string, number]>} */
export const SPECS = [
  ['Omega-3 轻享装', 10], ['Omega-3 日常装', 20], ['Omega-3 家庭装', 30], ['Omega-3 蛋卡礼赠', 20],
];

export function benefitEntries(state) {
  const { sandbox: lab, verifiedPurchases } = state;
  const unlocked = [true, verifiedPurchases >= 1, verifiedPurchases >= 2,
    verifiedPurchases >= 4 && state.relationship === 'preferred',
    Object.values(state.homes).some(home => home.id !== 'mine' && ['flex','care','paused'].includes(home.plan)),
  ];
  return BENEFITS.map(([id, title, rule], index) => ({
    id, title, rule, status: lab.redeemed.includes(id) ? '已使用' : lab.registered && unlocked[index] ? '可使用' : '待解锁',
  }));
}

export function forecastSandbox(home, day) {
  if (home.stock == null || !home.rate) {
    return { start: null, end: null, remaining: null, confidence: '未知', reason: '等待收货记录或家庭主动报告库存。' };
  }
  const remaining = Math.max(0, home.stock - home.rate * Math.max(0, day - home.stockDay));
  const empty = home.stockDay + Math.ceil(home.stock / home.rate);
  const start = Math.max(home.stockDay, empty - 2, home.snoozeUntil ?? 0);
  return { start, end: Math.max(start, empty), remaining: Math.round(remaining * 10) / 10,
    confidence: '模型估计', reason: '以家庭库存和日耗估算耗尽时间，预留 2 天补货提前量。' };
}

export function initializeSandbox(state, id) {
  const entry = SCENARIOS.find(([key]) => key === id) ?? SCENARIOS[0];
  id = entry[0];
  const verified = { repeat: 1, cycle: 3, family: 3, exception: 1 }[id] ?? 0;
  const active = state.homes.mine;
  state.day = 0;
  state.activeHome = 'mine';
  state.permission = true;
  state.frequencyDays = 3;
  state.lastContact = null;
  state.verifiedPurchases = verified;
  state.lifecycle = verified > 1 ? 'repeat' : verified ? 'first' : 'visitor';
  state.relationship = verified ? 'familiar' : 'new';
  state.sandbox = {
    id, registered: verified > 0, registrations: 0, marketing: true, redeemed: [], notes: [], orders: [],
    adopted: [], createdPlans: 0, eventSerial: 0, nextOrder: 1, verifiedReceipt: false,
    source: id === 'scan' ? '商品包装扫码' : id === 'content' ? '家庭早餐内容' : '模拟存量会员',
  };
  state.events = [];
  for (const home of Object.values(state.homes)) {
    Object.assign(home, {
      sandbox: true, active: home.id === 'mine', stock: null, stockDay: 0, rate: 2, people: 2,
      product: 'Omega-3 日常装', lastProduct: null, lastQuantity: null, quantity: 20, habitsSource: '规则推断', usualDays: 10, cadence: 10, nextConfirm: null, lastPurchase: null,
      plan: 'none', priorPlan: null, authorization: false, serviceCase: null, pendingOrder: false,
      serviceOpen: false, serviceUrgent: false, request: false, feedback: null, snoozeUntil: null, windowRecorded: null,
      address: '演示地址 · 圣迪乐样例社区', delivery: '每期确认时选择', scheduleMode: 'regular', stockSource: '未知',
    });
  }
  if (verified) Object.assign(active, { stock: 20, stockSource: '真实模拟事件', lastPurchase: 0, lastProduct: active.product, lastQuantity: 20 });
  if (id === 'family') Object.assign(active, { plan: 'flex', nextConfirm: 10, authorization: true });
  if (id === 'exception') Object.assign(active, { plan: 'reminder', authorization: true });
  for (let index = 0; index < verified; index++) {
    state.sandbox.orders.push({ id: 'DEMO-历史-' + (index + 1), home: 'mine', product: active.product, quantity: 20, status: 'fulfilled', day: 0, baseline: true, delivery: active.delivery });
  }
}

/** @typedef {[string, string, string, string, string?]} SandboxDecision */
export function evaluateSandbox(state, home, window) {
  function offer(title, reason, stop) {
    const barrier = home.barrier;
    const price = barrier === 'price' || barrier === 'both';
    const channel = barrier === 'channel' || barrier === 'both';
    if (price) reason += state.sandbox?.marketing === false
      ? ' 展示规格与实际价格，保留营销静默。'
      : ' 先说明规格和价格，再判断是否有适用权益。';
    if (channel) reason += ' 提供消费者熟悉的购买渠道。';
    return /** @type {SandboxDecision} */ (['execute', title, reason, stop, 'outbound']);
  }
  /** @type {Array<[string, () => SandboxDecision|null]>} */
  const rules = [
    ['必要售后与主动服务', () => home.serviceOpen || home.serviceCase?.status === 'open'
      ? ['execute', '优先处理售后', '当前家庭存在服务问题。暂停相关促销。', '完成售后处理或收到撤回。', 'service']
      : home.request ? ['execute', '承接主动服务请求', '消费者发起商品或补给服务。', '请求处理完成。', 'service'] : null],
    ['触达许可', () => !state.permission || !home.authorization
      ? ['silent', '保持静默', '补货授权未开启或已撤回。', '获得新授权后再评估。'] : null],
    ['订单履约', () => home.pendingOrder
      ? ['delay', '等待履约', '本家庭有模拟订单在途。', '订单履约或取消。'] : null],
    ['计划状态', () => ['paused', 'cancelled'].includes(home.plan)
      ? ['silent', '停止计划提醒', '当前计划已暂停或取消。', '消费者主动恢复或创建计划后重算。'] : null],
    ['触达频控', () => state.lastContact != null && state.day - state.lastContact < Math.max(1, state.frequencyDays)
      ? ['delay', '等待频控', '近期已有触达。', '频控结束后再次检查需求。'] : null],
    ['库存充足或忽略', () => ['stock', 'ignored'].includes(home.feedback?.value) && home.snoozeUntil > state.day
      ? ['delay', '结束本次提醒', home.feedback.value === 'stock' ? '家庭仍有库存，已更新估计。' : '消费者未响应，停止连续提醒。', '新反馈或延后日期。'] : null],
    ['其他渠道购买', () => home.feedback?.value === 'bought' && home.snoozeUntil > state.day
      ? ['delay', '停止本次补货询问', '已记录外部购买自述。', '新需求信号或新的估计窗口。'] : null],
    ['明确的需求反馈', () => {
      if (home.needDeclined) return ['silent', '尊重当前不补货的选择', '消费者已明确表示暂不需要。', '收到主动请求或新的需求反馈。'];
      if (home.feedback?.value !== 'needed' || home.feedback.day !== state.day) return null;
      const title = ['visitor','member'].includes(state.lifecycle) ? '协助选择适合的购买规格' : '提供便捷复购';
      return offer(title, '消费者已确认有补货需求。', '生成模拟订单、撤回需求或出现售后。');
    }],
    ['周期计划确认', () => {
      if (!['flex','care'].includes(home.plan) || home.scheduleMode === 'on-demand' || home.nextConfirm == null) return null;
      return state.day >= home.nextConfirm
        ? offer('邀请确认本期补给', '已到计划确认日。', '确认购买、延期、跳过、暂停或取消。')
        : ['delay', '等待本期确认日', `计划将于第 ${home.nextConfirm} 天重新确认。`, '到达确认日或消费者主动反馈需求。'];
    }],
    ['估计补货窗口', () => window.start != null && state.day >= window.start && state.day <= window.end
      ? offer('轻量补货询问', '家庭接近估计需求窗口。', '收到反馈、撤回授权或窗口结束。') : null],
    ['需求信息充足性', () => window.start == null
      ? ['silent', '等待主动反馈', '当前库存未知。', '收到有效库存或履约记录。']
      : ['delay', '等待新的需求窗口', state.day < window.start ? '距离估计需求还有时间。' : '需求窗口已过去，等待主动确认。', '窗口变化或收到主动反馈。']],
  ];
  const trace = [];
  let match;
  for (const [rule, ruleMatch] of rules) {
    if (match) { trace.push({rule, status:'skipped', detail:'当前决策已得出。'}); continue; }
    match = ruleMatch();
    trace.push({rule, status:match ? 'trigger' : 'pass', detail:match ? match[2] : '继续检查下一条。'});
  }
  const [outcome, title, reason, stop, kind = 'none'] = match;
  return {outcome, title, reason, stop, kind, trace};
}

export function runSandboxAction(state, home, action, payload, log) {
  const lab = state.sandbox;
  const record = (name, detail, category = '真实模拟事件', object = '') => log(name, category, home.id, detail, object);
  const {value} = payload;
  const number = (value, low, high, fallback) => value != null && value !== '' && Number.isFinite(Number(value)) ? Math.max(low, Math.min(high, Number(value))) : fallback;
  const purchase = order => {
    state.verifiedPurchases++;
    state.lifecycle = state.verifiedPurchases >= 4 ? 'loyal' : state.verifiedPurchases >= 2 ? 'repeat' : 'first';
    Object.assign(home, { stock: order.quantity, stockDay: state.day, lastPurchase: state.day,
      lastProduct: order.product, lastQuantity: order.quantity, stockSource: '真实模拟事件', feedback: null, snoozeUntil: null, windowRecorded: null });
    if (!['flex','care','paused'].includes(home.plan)) {
      home.product = order.product;
      home.quantity = order.quantity;
    }
    record('purchase_verified', '模拟消费已经核验。', '真实模拟事件', order.id);
  };
  switch (action) {
    case 'register-demo':
      if (lab.registered) return false;
      lab.registered = true;
      lab.registrations++;
      if (!state.verifiedPurchases) state.lifecycle = 'member';
      record('member_registered', '已建立虚拟会员身份。');
      return true;
    case 'verify-demo':
      if (value !== 'pass') {
        if (lab.receiptFailed) return false;
        lab.receiptFailed = true;
        record('purchase_verification_failed', '样例凭证未通过核验，消费礼遇保持锁定。');
        return true;
      }
      if (lab.verifiedReceipt) return false;
      lab.verifiedReceipt = true;
      const linked = {id:'DEMO-关联凭证',home:home.id,product:home.product,quantity:20,status:'fulfilled',day:state.day,baseline:true,delivery:home.delivery};
      lab.orders.unshift(linked);
      purchase(linked);
      return true;
    case 'order-demo': {
      if (home.pendingOrder || lab.orders.some(order => order.home === home.id && order.status === 'paid')) return false;
      const spec = SPECS.find(([name]) => name === payload.product) ?? SPECS[1];
      const id = 'DEMO-' + String(lab.nextOrder++).padStart(3, '0');
      const order = { id, home: home.id, product: spec[0], quantity: number(payload.quantity, 1, 60, spec[1]), status: 'paid', day: state.day, delivery: home.delivery };
      lab.orders.unshift(order);
      home.pendingOrder = true;
      if (payload.cycle && home.nextConfirm != null) home.nextConfirm = state.day + home.cadence;
      record('order_created_demo', '消费者确认模拟订单，模拟支付完成，订单待履约。', '真实模拟事件', id);
      return true;
    }
    case 'fulfill-demo': {
      const order = lab.orders.find(record => record.id === value && record.home === home.id && record.status === 'paid');
      if (!order) return false;
      order.status = 'fulfilled';
      order.fulfilledDay = state.day;
      home.pendingOrder = false;
      record('order_fulfilled_demo', '模拟履约完成，按收货数量建立库存基线。', '真实模拟事件', order.id);
      if (order.product.includes('蛋卡')) record('gift_issued_demo', '样例蛋卡已交付，家庭库存等待实际商品兑换。', '真实模拟事件', order.id);
      else purchase(order);
      return true;
    }
    case 'redeem-demo':
      if (!benefitEntries(state).some(benefit => benefit.id === value && benefit.status === '可使用')) return false;
      lab.redeemed.push(value);
      record('benefit_redeemed', '使用一次模拟权益。', '真实模拟事件', value);
      return true;
    case 'sandbox-permission': {
      const authorization = Boolean(payload.enabled);
      if (value === 'marketing') {
        if (lab.marketing === authorization) return false;
        lab.marketing = authorization;
        record(authorization ? 'marketing_opt_in' : 'marketing_opt_out', '营销许可已更新。必要商品服务继续可用。', '消费者自述');
      } else {
        if (home.authorization === authorization) return false;
        home.authorization = authorization;
        if (authorization && !lab.adopted.includes(home.id)) lab.adopted.push(home.id);
        if (authorization && home.plan === 'none') home.plan = 'reminder';
        record(authorization ? 'replenishment_opt_in' : 'replenishment_opt_out', authorization ? '允许本家庭接收补货提醒。' : '停止本家庭补货提醒。', '消费者自述');
      }
      return true;
    }
    case 'sandbox-feedback': {
      if (!['needed','stock','bought','snooze','ignored'].includes(value)) return false;
      const detailKey = JSON.stringify([value, payload.stock, payload.days, payload.brand]);
      if (home.feedback?.day === state.day && home.feedback?.key === detailKey) return false;
      const label = {needed:'正好需要补货', stock:'还有库存', bought:'已经购买', snooze:'暂时不需要提醒', ignored:'忽略本次提醒'}[value];
      home.feedback = { value, label, day: state.day, key: detailKey };
      if (value === 'stock' || value === 'bought') {
        const previous = forecastSandbox(home, state.day).remaining;
        const reported = number(payload.stock, 0, 120, null);
        home.stock = value === 'bought' ? reported == null ? null : Math.min(120, (previous ?? 0) + reported) : reported ?? previous;
        home.stockSource = home.stock == null ? '未知' : value === 'bought' || reported == null ? '模型估计' : '消费者自述';
        home.stockDay = state.day;
      }
      home.snoozeUntil = value === 'needed' ? null : state.day + number(payload.days, 1, 30, value === 'ignored' ? 2 : 3);
      if (value === 'snooze') home.authorization = false;
      const event = {needed:'replenishment_need_confirmed', stock:'inventory_feedback_submitted', bought:'external_purchase_reported', snooze:'replenishment_opt_out', ignored:'reminder_ignored'}[value];
      record(event, value === 'bought' ? `记录外部购买自述 · ${payload.brand === 'other' ? '其他品牌' : '品牌未知'}${payload.stock === '' || payload.stock == null ? '' : ' · 自述购买 ' + number(payload.stock,0,120,0) + ' 枚'}。圣迪乐销售以核验凭证统计。` : label, '消费者自述');
      return true;
    }
    case 'sandbox-home':
      if (home.active) return false;
      home.active = true;
      record('household_added', '已新增独立家庭档案，库存等待主动反馈。', '消费者自述');
      return true;
    case 'sandbox-habits': {
      const people = number(payload.people, 1, 12, home.people);
      const rate = number(payload.rate, .1, 12, home.rate);
      if (people === home.people && rate === home.rate && home.habitsSource === '消费者自述') return false;
      home.stock = forecastSandbox(home, state.day).remaining;
      Object.assign(home, {people, rate, stockDay: state.day, habitsSource: '消费者自述'});
      record('household_habits_updated', '已更新食用人数和日耗。库存窗口重新估计。', '消费者自述');
      return true;
    }
    case 'sandbox-plan': {
      const cadence = number(payload.cadence, 3, 60, home.cadence);
      const product = SPECS.find(([product]) => product === payload.product && !product.includes('蛋卡'))?.[0] ?? home.product;
      const quantity = number(payload.quantity, 1, 60, home.quantity);
      const scheduleMode = payload.scheduleMode === 'on-demand' ? 'on-demand' : 'regular';
      const fresh = !['flex','care','paused'].includes(home.plan);
      if (!fresh && cadence === home.cadence && product === home.product && quantity === home.quantity && scheduleMode === home.scheduleMode && payload.delivery === home.delivery) return false;
      const delivery = ['每期确认时选择','工作日晚间','周末白天'].includes(payload.delivery) ? payload.delivery : home.delivery;
      const plan = home.id === 'mine' ? 'flex' : 'care';
      Object.assign(home, { cadence, product, quantity, scheduleMode, delivery, nextConfirm: scheduleMode === 'on-demand' ? null : state.day + cadence,
        plan: home.plan === 'paused' ? 'paused' : plan, priorPlan: home.plan === 'paused' ? plan : null });
      if (fresh) lab.createdPlans++;
      record(fresh ? 'cycle_plan_created' : 'cycle_plan_changed', '设置已保存，每期购买由消费者确认。', '消费者自述');
      return true;
    }
    case 'sandbox-plan-step': {
      if (value === 'pause' && ['flex','care','reminder','reorder'].includes(home.plan)) {
        home.priorPlan = home.plan; home.plan = 'paused';
      } else if (value === 'resume' && home.plan === 'paused') {
        home.plan = home.priorPlan ?? 'reminder'; home.priorPlan = null;
        if (['flex','care'].includes(home.plan) && home.scheduleMode === 'regular') home.nextConfirm = state.day + home.cadence;
        home.windowRecorded = null;
      } else if (value === 'cancel' && !['cancelled','none'].includes(home.plan)) {
        home.plan = 'cancelled'; home.nextConfirm = null; home.priorPlan = null;
      } else if (['skip','defer'].includes(value) && ['flex','care'].includes(home.plan) && home.nextConfirm != null) {
        if (home.lastPlanStep?.day === state.day && home.lastPlanStep?.value === value) return false;
        home.nextConfirm = Math.max(home.nextConfirm, state.day) + (value === 'skip' ? home.cadence : 3);
        home.lastPlanStep = {day: state.day, value};
      } else return false;
      const events = {pause:'cycle_plan_paused', resume:'cycle_plan_resumed', cancel:'cycle_plan_cancelled', skip:'cycle_plan_skipped', defer:'cycle_plan_deferred'};
      const descriptions = {pause:'暂停对应计划提醒。', resume:'重新评估需求及下次确认时间。', cancel:'计划已结束。', skip:'本期已跳过，已移至下一期。', defer:'本期确认延后 3 天。'};
      record(events[value], descriptions[value], '消费者自述');
      return true;
    }
    case 'sandbox-service': {
      const resolving = value === 'resolve';
      if (resolving ? !home.serviceOpen : home.serviceOpen) return false;
      const reference = resolving ? home.serviceCase?.id ?? 'CASE-' + home.id : 'CASE-' + (lab.eventSerial + 1);
      home.serviceCase = {id:reference, status:resolving ? 'resolved' : 'open', outcome:resolving ? '样例问题已处理' : ''};
      home.serviceOpen = home.serviceUrgent = !resolving;
      record(resolving ? 'service_case_resolved' : 'service_case_created', resolving ? '售后处理结束，重新评估经营。' : '已登记品质服务问题，暂停相关促销。', '真实模拟事件', reference);
      return true;
    }
    case 'sandbox-preference':
      if (state.relationship === 'preferred') return false;
      state.relationship = 'preferred';
      record('brand_preference_reported', '消费者主动表示品牌优先选择意愿。', '消费者自述');
      return true;
    case 'sandbox-note': {
      const note = String(payload.note ?? '').trim().slice(0, 180);
      if (!note || lab.notes.some(item => item.note === note && item.interest === payload.interest && item.rating === payload.rating)) return false;
      lab.notes.unshift({note, interest:payload.interest, rating:payload.rating, day:state.day, home:home.name});
      record('lab_feedback_submitted', '模拟需求及概念评价已加入本地需求池。', '消费者自述');
      return true;
    }
    case 'sandbox-discovery':
      if (lab.lastDiscovery === value) return false;
      lab.lastDiscovery = value;
      record('quality_explored', '查看商品品质资料示意。');
      return true;
    default:
      return false;
  }
}
