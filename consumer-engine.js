import { initializeSandbox, forecastSandbox, evaluateSandbox, runSandboxAction, benefitEntries } from './sandbox-state.js?v=8';

export const HOUSEHOLDS = [
  { id: 'mine', label: '我的家' },
  { id: 'parents', label: '爸妈的家' },
  { id: 'other', label: '其他家庭' },
];

export const FEEDBACK_OPTIONS = [
  { id: 'needed', label: '正好需要补货' },
  { id: 'stock', label: '还有库存' },
  { id: 'bought', label: '已经购买' },
  { id: 'snooze', label: '暂时不需要提醒' },
];

export const PLAN_LABELS = {
  none: '尚未选择服务', reminder: '智能补货提醒', reorder: '便捷复购',
  flex: '弹性周期购', care: '长期家庭补给', paused: '暂停中', cancelled: '已取消',
};

export const LIFECYCLE_LABELS = {
  visitor: '消费者访客', member: '已入会', first: '首购验证', repeat: '复购验证', loyal: '稳定购买',
};

export const RELATIONSHIP_LABELS = { new: '初识', familiar: '熟悉', preferred: '优先选择' };

export const EVENT_TYPES = [
  { id: 'package-view', label: '包装访问', category: '业务记录', meaning: '记录包装二维码触点，购买及消费仍待独立验证。' },
  { id: 'register', label: '注册', category: '业务记录', meaning: '统一会员身份建立，已采集的触点可在授权范围内关联。' },
  { id: 'purchase-verified', label: '购买验证', category: '业务记录', meaning: '以可识别订单或购买凭证确认真实交易，更新首购或复购状态。' },
  { id: 'payment', label: '支付', category: '业务记录', meaning: '记录模拟支付状态，订单进入待履约。' },
  { id: 'fulfill', label: '履约', category: '业务记录', meaning: '完成模拟订单交付，解除待履约条件。' },
  { id: 'permission', label: '补货授权', category: '消费者自述', meaning: '记录当前家庭允许接收补货提醒的明确选择。' },
  { id: 'feedback', label: '需求反馈', category: '消费者自述', meaning: '根据需要、库存、已购或暂停意愿修正需求窗口与触达。' },
  { id: 'plan-create', label: '计划创建', category: '消费者自述', meaning: '记录当前家庭选择的补给服务，订单仍需按期确认。' },
  { id: 'plan-adjust', label: '计划调整', category: '消费者自述', meaning: '按家庭的真实生活变化调整商品、估计节奏及配送偏好。' },
  { id: 'pause', label: '计划暂停', category: '消费者自述', meaning: '停止该家庭主动补给提醒，等待消费者主动恢复。' },
  { id: 'cancel', label: '计划取消', category: '消费者自述', meaning: '终止该家庭补给计划与主动补给提醒。' },
  { id: 'refund', label: '退款', category: '业务记录', meaning: '取消该家庭一笔待履约模拟订单，并更新模拟订单流水。' },
  { id: 'aftersales', label: '售后', category: '业务记录', meaning: '登记或完成必要售后，服务承接优先于经营触达。' },
  { id: 'quality-explore', label: '品质探索', category: '业务记录', meaning: '记录模拟的品质内容访问，用于理解内容兴趣。' },
  { id: 'lab-feedback', label: '共创反馈', category: '消费者自述', meaning: '记录消费者主动选择的概念反馈，用于模拟研究积累。' },
];

const homeProducts = ['Omega-3 日常装', 'Omega-3 轻享装', 'Omega-3 家庭装'];
const startDay = 24;
const listeners = new Set();
const forecastReasons = {
  needed: '最近一次反馈表明有补货需要，缩短估计库存。',
  bought: '消费者自述已购，按本次回补的假设数量重算。',
  stock: '消费者报告还有库存，已核对库存基线。',
};

function initialState() {
  const homeSettings = [
    { stock: 7, rate: 1.2, usualDays: 10, lastPurchase: 16, observations: 2, plan: 'reminder', authorization: true, delivery: '工作日晚间' },
    { stock: 3, rate: .65, usualDays: 16, lastPurchase: 9, observations: 3, plan: 'care', authorization: true, delivery: '周末白天' },
    { stock: 12, rate: 1, usualDays: 12, lastPurchase: 21, observations: 0, plan: 'none', authorization: false, delivery: '待确认' },
  ];
  const homes = Object.fromEntries(HOUSEHOLDS.map(({id, label}, index) => [id, {
    id, name: label, product: homeProducts[index], stockDay: startDay,
    priorPlan: null, feedback: null, snoozeUntil: null, pendingOrder: false,
    serviceOpen: false, serviceUrgent: false, request: false, ...homeSettings[index],
  }]));
  return {
    day: startDay, activeHome: 'mine', homes, permission: true, frequencyDays: 4, lastContact: 18,
    lifecycle: 'first', relationship: 'familiar', verifiedPurchases: 1,
    events: [
      { day: 24, label: '库存基线', category: '消费者自述', home: 'mine', detail: '示例自述库存 7 枚，作为动态需求预测的输入。' },
      { day: 16, label: '购买验证', category: '业务记录', home: 'mine', detail: '示例首购已校验。' },
    ],
  };
}

let store = initialState();
let sandboxRun = 0;

function bounded(value, low, high) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(low, Math.min(number, high)) : null;
}

function appendEvent(label, category, home, detail, object = '') {
  const preceding = store.events[0];
  if (store.sandbox && preceding?.day === store.day && preceding.label === label &&
      preceding.home === home && preceding.detail === detail && preceding.object === object) return;
  const serial = store.sandbox ? ++store.sandbox.eventSerial : store.events.length + 1;
  const time = '09:' + String(store.events.filter(event => event.day === store.day).length % 60).padStart(2, '0');
  store.events.unshift({ id: 'EV-' + serial, day: store.day, time, label, category, home, detail, object });
  if (store.events.length > 40) store.events.length = 40;
}

export function getConsumerState() {
  const snapshot = structuredClone(store);
  const { request, pendingOrder, serviceOpen, serviceUrgent } = snapshot.homes[snapshot.activeHome];
  return { ...snapshot, request, pendingOrder, serviceOpen, serviceUrgent };
}

export function subscribeConsumer(listener) {
  listeners.add(listener);
  listener(getConsumerState());
  return () => listeners.delete(listener);
}

function publish() {
  const snapshot = getConsumerState();
  listeners.forEach((listener) => listener(snapshot));
  return snapshot;
}

export function resetConsumer() {
  if (store.sandbox) return dispatchConsumer('sandbox-start', {id:store.sandbox.id});
  store = initialState();
  return publish();
}

export function estimateWindow(plan, today = store.day) {
  if (plan.sandbox) return forecastSandbox(plan, today);
  const remaining = Math.max(0, plan.stock - plan.rate * Math.max(0, today - plan.stockDay));
  const fromStock = today + remaining / plan.rate;
  const fromCadence = Math.max(today, plan.lastPurchase + plan.usualDays);
  const stockWeight = plan.observations ? .8 : .55;
  const center = Math.round(fromStock * stockWeight + fromCadence * (1 - stockWeight));
  const spread = plan.observations >= 4 ? 1 : plan.observations > 0 ? 2 : 3;
  return {
    start: Math.max(today, center - spread),
    end: Math.max(today, center + spread),
    confidence: plan.observations >= 4 ? '多次反馈校准' : plan.observations > 0 ? '行为与反馈校准' : '冷启动估计',
    reason: forecastReasons[plan.feedback?.value] ??
      '模型按库存和日耗估计耗尽时间，并参考最近购买及品类采购间隔。',
    remaining: Math.round(remaining * 10) / 10,
  };
}

const rules = [
  '主动请求及必要售后', '账号许可与家庭授权', '履约及售后状态', '计划状态与消费者偏好',
  '近期触达与频控', '识别真实需求', '匹配商品及服务',
];

export function decideNextAction(state = getConsumerState()) {
  const home = state.homes[state.activeHome];
  if (state.sandbox) return evaluateSandbox(state, home, estimateWindow(home, state.day));
  const trace = rules.map((rule) => ({ rule, status: 'skipped', detail: '当前判断已结束。' }));
  const mark = (index, status, detail) => {
    trace[index] = { rule: rules[index], status, detail };
  };
  const decision = (index, outcome, title, reason, stop, kind = 'none') => {
    mark(index, 'trigger', reason);
    return { outcome, title, reason, stop, kind, trace };
  };

  if (home.request || home.serviceUrgent) {
    return decision(0, 'execute', home.serviceUrgent ? '优先承接必要售后' : '承接消费者主动请求',
      home.serviceUrgent ? '该家庭存在明确的必要售后事项。先处理服务。' : '消费者已为该家庭主动提出服务请求。',
      '请求完成或撤回即结束。本次处理只用于所请求的服务。', 'service');
  }
  mark(0, 'pass', '当前家庭无待承接的主动请求或必要售后。');

  if (!state.permission || !home.authorization) {
    return decision(1, 'silent', '保持静默', !state.permission ? '账号未授权接收主动经营信息。' : '本家庭未授权接收主动补货服务。',
      '许可恢复后重新评估。消费者主动请求始终进入服务承接。');
  }
  mark(1, 'pass', '账号许可和当前家庭授权均有效。');

  if (home.pendingOrder || home.serviceOpen) {
    return decision(2, 'delay', home.pendingOrder ? '等待当前订单履约' : '先完成在办服务',
      home.pendingOrder ? '该家庭已经有待履约订单，避免重复补货。' : '该家庭有在办售后，经营动作延后。',
      home.pendingOrder ? '履约完成、退款或取消后重新判断。' : '售后关闭后重新判断。');
  }
  mark(2, 'pass', '当前无待履约订单及在办售后。');

  if (['paused', 'cancelled', 'none'].includes(home.plan)) {
    return decision(3, 'silent', '保持静默', `该家庭当前状态为“${PLAN_LABELS[home.plan]}”。`,
      '消费者主动选择或恢复服务后重新评估。');
  }
  if (home.snoozeUntil !== null && home.snoozeUntil > state.day) {
    return decision(3, 'delay', '尊重当前反馈', `消费者的反馈使本次提醒延后至第 ${home.snoozeUntil} 天。`,
      '到达延后日期或收到新的消费者反馈时重算。');
  }
  mark(3, 'pass', '补给服务有效，当前没有延期偏好。');

  if (state.lastContact !== null && state.day - state.lastContact < state.frequencyDays) {
    const next = state.lastContact + state.frequencyDays;
    return decision(4, 'delay', '等待频控窗口', `账号近期已有触达，最早于第 ${next} 天重新评估。`,
      '频控到期后重新检验许可、需求与履约状态。');
  }
  mark(4, 'pass', '账号未触及触达频控。');

  const window = estimateWindow(home, state.day);
  if (state.day < window.start) {
    return decision(5, 'delay', '等到预计需求窗口', `估计需求在第 ${window.start}–${window.end} 天，当前暂缓。`,
      '有新反馈、购买记录或到达窗口时重新判断。');
  }
  mark(5, 'pass', `当前进入第 ${window.start}–${window.end} 天的模拟需求窗口。`);

  const offers = {
    reminder: '提醒确认补货需要', reorder: '提供常购商品复购入口',
    flex: '邀请按期确认补给', care: '提供长期家庭补给确认',
  };
  return decision(6, 'execute', offers[home.plan],
    `匹配 ${home.product} 与“${PLAN_LABELS[home.plan]}”。实际购买由消费者确认。`,
    '消费者表示有库存、已购或暂不提醒，撤回授权、存在履约或售后，或频控触发时停止当前动作。',
    'outbound');
}

function applyFeedback(home, value) {
  const option = FEEDBACK_OPTIONS.find(({id}) => id === value);
  if (!option) return false;
  const current = estimateWindow(home).remaining;
  home.feedback = { value, label: option.label, day: store.day };
  if (value !== 'snooze') home.observations += 1;
  if (value === 'needed') {
    home.stock = Math.min(current, home.rate);
    home.stockDay = store.day;
    home.snoozeUntil = null;
  } else if (value === 'stock') {
    home.stock = Math.max(current, home.rate * 6);
    home.stockDay = store.day;
    home.snoozeUntil = store.day + 3;
  } else if (value === 'bought') {
    home.stock = home.rate * home.usualDays;
    home.stockDay = store.day;
    home.lastPurchase = store.day;
    home.snoozeUntil = store.day + 1;
  } else {
    home.snoozeUntil = store.day + 7;
  }
  appendEvent('需求反馈', '消费者自述', home.id, option.label);
  const window = estimateWindow(home);
  appendEvent('需求窗口重算', '模型估计', home.id,
    `第 ${window.start}–${window.end} 天。触达决策同时检查服务、许可与抑制规则。`);
  return true;
}

function setPlan(home, plan) {
  if (!Object.hasOwn(PLAN_LABELS, plan) || home.plan === plan) return;
  if (plan === 'paused') home.priorPlan = home.plan;
  else if (plan !== 'cancelled') home.priorPlan = null;
  home.plan = plan;
}

function applyEvent(home, payload) {
  const event = EVENT_TYPES.find(({id}) => id === payload.type);
  if (!event) return false;
  switch (event.id) {
    case 'register':
      if (store.lifecycle === 'visitor') store.lifecycle = 'member';
      break;
    case 'purchase-verified':
      store.verifiedPurchases += 1;
      store.lifecycle = store.verifiedPurchases >= 4 ? 'loyal' : store.verifiedPurchases >= 2 ? 'repeat' : 'first';
      home.lastPurchase = store.day;
      home.stock = home.rate * home.usualDays;
      home.stockDay = store.day;
      home.observations += 1;
      home.snoozeUntil = null;
      home.feedback = null;
      break;
    case 'payment':
      home.pendingOrder = true;
      break;
    case 'fulfill':
      home.pendingOrder = false;
      break;
    case 'permission':
      home.authorization = typeof payload.granted === 'boolean' ? payload.granted : true;
      break;
    case 'feedback':
      return applyFeedback(home, payload.value ?? 'needed');
    case 'plan-create':
      setPlan(home, payload.plan ?? 'flex');
      break;
    case 'plan-adjust':
      home.usualDays = Math.round(bounded(payload.usualDays, 3, 45) ?? Math.max(3, home.usualDays - 1));
      break;
    case 'pause':
      setPlan(home, 'paused');
      break;
    case 'cancel':
      setPlan(home, 'cancelled');
      break;
    case 'refund':
      home.pendingOrder = false;
      home.serviceOpen = home.serviceUrgent = true;
      break;
    case 'aftersales':
      home.serviceOpen = home.serviceUrgent = !payload.resolved;
      break;
  }
  appendEvent(event.label, event.category, home.id, payload.detail || event.meaning);
  return true;
}

function updateHome(home, payload) {
  const previousPlan = home.plan;
  const changed = [];
  const update = (key, value, label) => {
    if (value === undefined || value === null || home[key] === value) return;
    home[key] = value;
    changed.push(label);
  };
  update('product', payload.product, '商品');
  if (payload.stock !== undefined) {
    const stock = bounded(payload.stock, 0, 120);
    if (stock !== null && (stock !== home.stock || home.stockDay !== store.day)) {
      home.stock = stock;
      home.stockDay = store.day;
      changed.push('库存');
    }
  }
  update('rate', payload.rate === undefined ? undefined : bounded(payload.rate, .1, 6), '家庭日耗');
  const usualDays = payload.usualDays === undefined ? null : bounded(payload.usualDays, 3, 45);
  if (usualDays !== null) update('usualDays', Math.round(usualDays), '采购间隔');
  update('delivery', payload.delivery, '配送偏好');
  if (typeof payload.authorization === 'boolean' && payload.authorization !== home.authorization) {
    home.authorization = payload.authorization;
    appendEvent('补货授权', '消费者自述', home.id, home.authorization ? '允许本家庭接收补货提醒。' : '本家庭撤回补货提醒授权。');
  }
  setPlan(home, payload.plan);
  if (previousPlan !== home.plan) changed.push('服务层级');
  if (home.sandbox && changed.includes('库存')) home.stockSource = '消费者自述';
  if (home.sandbox && previousPlan !== home.plan && ['flex', 'care'].includes(home.plan)) {
    home.cadence = home.usualDays;
    home.nextConfirm = store.day + home.cadence;
    store.sandbox.createdPlans++;
  }
  if (changed.length) {
    const label = ['none', 'cancelled'].includes(previousPlan) && previousPlan !== home.plan ? '计划创建' : '计划调整';
    appendEvent(label, '消费者自述', home.id, `已更新${changed.join('、')}。`);
  }
}

export function dispatchConsumer(type, payload = {}) {
  if (type === 'sandbox-start') {
    store = initialState();
    initializeSandbox(store, payload.id);
    store.sandbox.run = ++sandboxRun;
    appendEvent('entry_view','真实模拟事件','mine',store.sandbox.source);
    return publish();
  }
  if (store.sandbox) {
    const home = store.homes[payload.home ?? store.activeHome];
    if (!home) return getConsumerState();
    let action = type;
    let data = payload;
    if (type === 'feedback') action = 'sandbox-feedback';
    if (type === 'event') {
      const event = payload.type;
      const eventActions = {register:'register-demo','purchase-verified':'verify-demo',payment:'order-demo',fulfill:'fulfill-demo',
        permission:'sandbox-permission',feedback:'sandbox-feedback','plan-create':'sandbox-plan','plan-adjust':'sandbox-plan',pause:'sandbox-plan-step',
        cancel:'sandbox-plan-step',refund:'sandbox-order-cancel',aftersales:'sandbox-service'};
      action = eventActions[event] ?? type;
      if (event === 'purchase-verified') data = {...payload,value:'pass'};
      if (event === 'fulfill') data = {...payload,value:store.sandbox.orders.find(order=>order.home===home.id&&order.status==='paid')?.id};
      if (event === 'permission') data = {...payload,value:'replenishment',enabled:payload.granted ?? true};
      if (event === 'feedback') data = {...payload,value:payload.value ?? 'needed'};
      if (event === 'pause' || event === 'cancel') data = {...payload,value:event};
      if (event === 'aftersales') data = {...payload,value:payload.resolved ? 'resolve' : 'open'};
    }
    if (/^(sandbox-|register-demo|verify-demo|order-demo|fulfill-demo|redeem-demo)/.test(action)) {
      const before = benefitEntries(store);
      if (!runSandboxAction(store, home, action, data, appendEvent)) return getConsumerState();
      for (const benefit of benefitEntries(store)) {
        if (benefit.status === '可使用' && before.find(item => item.id === benefit.id).status === '待解锁') {
          appendEvent('benefit_unlocked','真实模拟事件',home.id,benefit.title,benefit.id);
        }
      }
      return publish();
    }
  }
  const homeId = payload.home ?? store.activeHome;
  if (!Object.hasOwn(store.homes, homeId)) return getConsumerState();
  const home = store.homes[homeId];
  switch (type) {
    case 'select-home':
      store.activeHome = home.id;
      break;
    case 'update-home':
      updateHome(home, payload);
      break;
    case 'advance': {
      const days = Math.round(bounded(payload.days ?? 1, 1, 60) ?? 1);
      store.day += days;
      appendEvent('模拟时钟推进', '模型估计', store.activeHome, `推进 ${days} 天并重算需求窗口。`);
      if (store.sandbox) for (const household of Object.values(store.homes)) {
        const window = estimateWindow(household);
        if (household.authorization && store.permission && !household.pendingOrder && !household.serviceOpen &&
            !['paused','cancelled'].includes(household.plan) && window.start != null &&
            window.start > store.day - days && window.start <= store.day && household.windowRecorded !== window.start) {
          household.windowRecorded = window.start;
          appendEvent('replenishment_window_entered','模型估计',household.id,`第 ${window.start} 天进入预计补货窗口。`);
        }
      }
      break;
    }
    case 'feedback':
      if (!applyFeedback(home, payload.value)) return getConsumerState();
      break;
    case 'set-policy': {
      for (const key of ['request', 'pendingOrder', 'serviceOpen']) {
        if (typeof payload[key] === 'boolean') home[key] = payload[key];
      }
      if (store.sandbox) {
        if (store.sandbox.orders.some(order => order.home === home.id && order.status === 'paid')) home.pendingOrder = true;
        if (home.serviceCase?.status === 'open') home.serviceOpen = true;
      }
      if (!home.serviceOpen) home.serviceUrgent = false;
      if (typeof payload.permission === 'boolean') store.permission = payload.permission;
      if (payload.frequencyDays !== undefined) store.frequencyDays = bounded(payload.frequencyDays, 0, 30) ?? store.frequencyDays;
      if (payload.lastContact !== undefined) store.lastContact = payload.lastContact === null ? null : bounded(payload.lastContact, 0, store.day);
      if (Object.hasOwn(LIFECYCLE_LABELS, payload.lifecycle) && payload.lifecycle !== store.lifecycle) {
        store.lifecycle = payload.lifecycle;
        store.verifiedPurchases = { visitor: 0, member: 0, first: 1, repeat: 2, loyal: 4 }[store.lifecycle];
      }
      if (Object.hasOwn(RELATIONSHIP_LABELS, payload.relationship) && payload.relationship !== store.relationship) {
        store.relationship = payload.relationship;
        appendEvent('品牌关系反馈', '消费者自述', home.id, `当前声明为“${RELATIONSHIP_LABELS[store.relationship]}”。`);
      } else if (payload.request === true) appendEvent('主动服务请求', '消费者自述', home.id, '消费者在产品原型中明确请求补给服务。');
      else appendEvent('决策情景调整', '模型估计', home.id, '调整样例状态与规则后重新评估。');
      break;
    }
    case 'event':
      if (!applyEvent(home, payload)) return getConsumerState();
      break;
    case 'send-action': {
      const decision = decideNextAction(getConsumerState());
      if (decision.outcome !== 'execute') return getConsumerState();
      const active = store.homes[store.activeHome];
      if (decision.kind === 'outbound') store.lastContact = store.day;
      if (decision.kind === 'service') {
        if (store.sandbox && active.serviceOpen) {
          runSandboxAction(store, active, 'sandbox-service', {value:'resolve'}, appendEvent);
          return publish();
        }
        if (active.serviceUrgent) active.serviceUrgent = false;
        else active.request = false;
      }
      appendEvent('执行演示', '业务记录', active.id, `${decision.title}。演示未发送触达或生成订单。`);
      break;
    }
    default:
      return getConsumerState();
  }
  return publish();
}
