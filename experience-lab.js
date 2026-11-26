import {
  HOUSEHOLDS, LIFECYCLE_LABELS, PLAN_LABELS, subscribeConsumer, dispatchConsumer,
  estimateWindow, decideNextAction, resetConsumer, getConsumerState,
} from './consumer-engine.js?v=6';
import { SCENARIOS, SPECS, benefitEntries } from './sandbox-state.js?v=6';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const btn = (label, action, value = '', primary = false) => `<button type="button" class="exp-button ${primary ? 'exp-primary' : ''}" data-action="${action}" data-value="${escape(value)}">${label}</button>`;
const jump = (label, page, primary = false) => btn(label, 'page', page, primary);
const selected = on => on ? ' selected' : '';
const checked = on => on ? ' checked' : '';
const status = value => `<span class="exp-label">${value}</span>`;
const title = (en, zh, line = '') => `<div class="exp-view-heading"><span>${en}</span><h4>${zh}</h4>${line ? `<p>${line}</p>` : ''}</div>`;
const form = (id, fields, caption) => `<form class="exp-edit" data-form="${id}">${fields}<button type="submit" class="exp-button exp-primary">${caption}</button></form>`;
const number = (label, name, value, min, max, step = 1, required = true) => `<label>${label}<input name="${name}" type="number" min="${min}" max="${max}" step="${step}" value="${escape(value)}"${required ? ' required' : ''}></label>`;
const select = (label, name, options, current) => `<label>${label}<select name="${name}">${options.map(([key, label]) => `<option value="${escape(key)}"${selected(String(current) === String(key))}>${label}</option>`).join('')}</select></label>`;
const productOptions = (gift = true) => SPECS.filter(([product]) => gift || !product.includes('蛋卡')).map(([name, quantity]) => [name, `${name} · ${quantity} 枚`]);
const estimate = window => window.start == null ? '未知' : `第 ${window.start}–${window.end} 天`;
const nav = [['home','首页'],['rhythm','补给'],['moments','礼遇'],['discovery','探索']];
const subtabs = [['consumer','消费者端'],['operator','运营后台'],['intelligence','智能决策']];
const actionNames = {execute:'执行',delay:'延迟',silent:'保持静默'};

export function experienceLab() {
  return `<div class="experience-lab" data-experience-lab data-mode="operator" data-mobile="consumer">
    <div class="exp-sandbox-top">
      <div><p class="eyebrow">Product Experience Lab</p><h3>经营沙盒</h3></div>
      <label>实验场景<select id="exp-scenario">${SCENARIOS.map(([id, label], index)=>`<option value="${id}">0${index+1} · ${label}</option>`).join('')}</select></label>
      <div class="exp-sandbox-time"><strong id="exp-clock"></strong><div class="exp-actions">${btn('+1 天','advance',1)}${btn('+3 天','advance',3)}${btn('重置实验','reset')}${btn('汇报演示','present')}</div></div>
    </div>
    <div class="exp-sandbox-intro"><p id="exp-scene-description"></p><p class="note">模拟经营数据 · 所有动作仅在本页推演。</p></div>
    <div class="exp-mode-strip">
      <div class="exp-desktop-modes" role="group" aria-label="桌面体验模式">
        ${[['consumer','Consumer · 消费者'],['operator','Operator · 双屏'],['intelligence','Intelligence · 决策']].map(([value,label])=>btn(label,'mode',value)).join('')}
      </div>
      <div class="exp-mobile-modes" role="group" aria-label="移动端视角">${subtabs.map(([value,label])=>btn(label,'mobile',value)).join('')}</div>
      <span id="exp-sync-note">前台与后台共用实验状态</span>
    </div>
    <div class="exp-split">
      <article class="exp-phone" id="exp-member-phone" aria-labelledby="exp-phone-title">
        <header class="exp-phone-header">
          <img src="./assets/mark.svg" alt="" width="35" height="35">
          <div><strong id="exp-phone-title">SUNDaily Membership</strong><span>Your Family. Your Rhythm.</span></div>
          ${jump('账户','account')}
        </header>
        <div class="exp-phone-main">
          <div id="exp-service-body" class="exp-service-body"></div>
          <p class="exp-feedback-message" data-exp-message role="status"></p>
        </div>
        <nav class="exp-bottom-nav" aria-label="会员产品导航">${nav.map(([id,label])=>jump(label,id)).join('')}</nav>
      </article>
      <div class="exp-data-path" aria-hidden="true"><i></i></div>
      <aside class="exp-console" id="exp-console" aria-labelledby="exp-console-title">
        <header class="exp-console-heading">
          <div><p class="eyebrow">Consumer Growth Console</p><h3 id="exp-console-title">消费者经营后台</h3></div>${status('模拟经营数据')}
        </header>
        <div data-exp-console></div>
        <footer class="exp-console-footer"><a href="#growth-console">查看当前家庭的联动演示</a><a href="#growth-lab">进入商业验证实验室</a></footer>
      </aside>
    </div>
  </div>`;
}

function homeView(state, home, window) {
  const lab = state.sandbox;
  const decision = decideNextAction(state);
  const pending = lab.orders.some(order=>order.home===home.id&&order.status==='paid');
  let card;
  if (home.serviceOpen) card = ['售后服务处理中', '查看问题和处理进度。', jump('处理售后','service',true)];
  else if (pending) card = ['模拟订单待履约', '可以查看状态或确认样例到货。', jump('查看模拟订单','orders',true)];
  else if (home.plan === 'paused') card = ['当前补给已暂停', '可以随时主动恢复。', jump('管理补给计划','rhythm',true)];
  else if (lab.id === 'exception') card = ['观察经营异常', '尝试拒绝提醒、报告库存、保留在途订单，或发起商品服务。', jump('反馈需求','rhythm',true)+jump('管理授权','account')+jump('报告商品问题','service')];
  else if (lab.id === 'scan' && !lab.registered) card = ['来自商品包装', '先查看商品品质或会员价值。', jump('查看商品信息','discovery',true)+jump('查看会员价值','moments')];
  else if (lab.id === 'content' && !state.verifiedPurchases) card = ['给家庭早餐加一份选择', '从体验规格开始，购买路径可独立体验。', btn('选择规格','buy','single',true)+jump('查看商品价值','discovery')];
  else if (!state.verifiedPurchases) card = ['首购体验', '可选择体验商品或关联已有样例订单。', btn('选择规格','buy','single',true)+jump('关联模拟订单','verify')];
  else if (['flex','care'].includes(home.plan)) card = ['家庭补给计划已运行', `${home.name} · ${home.nextConfirm == null ? '按需确认' : '下次确认第 '+home.nextConfirm+' 天'}`, jump('管理或确认本期','rhythm',true)];
  else if (home.authorization && decision.kind === 'outbound') card = ['家里的鸡蛋，还够吃吗？', `${home.name} · 预计补货窗口 ${estimate(window)}`, jump('告诉我们您的需求','rhythm',true)];
  else if (state.verifiedPurchases >= 2) card = ['常购商品已就绪', '可以快捷购买或自愿设置弹性周期购。', btn('快捷复购','buy','repeat',true)+jump('设置家庭补给','rhythm')];
  else card = ['已收到您的第一份补给', '可查看回馈并设置家庭提醒。', jump('设置补货提醒','rhythm',true)+jump('查看心意账户','moments')];
  const [heading, detail, actions] = card;
  return `<div class="exp-member-card"><p class="exp-member-label">圣迪乐 Omega-3</p><strong>懂您的生活节奏，<br>也懂您在乎的人。</strong><span class="exp-member-stage">${lab.registered ? '虚拟会员 · '+LIFECYCLE_LABELS[state.lifecycle] : '访客体验'}</span></div>
    <div class="exp-content-card"><span class="exp-label">${escape(home.name)}</span><h5>${heading}</h5><p>${detail}</p><div class="exp-actions">${actions}</div></div>
    <div class="exp-actions">${!lab.registered ? btn('模拟注册','register-demo') : ''}${jump('消费者共创','lab')}${jump('商品服务','service')}${jump('模拟订单','orders')}</div>`;
}

function rhythmView(state, home, window, ui) {
  const active = ['flex','care'].includes(home.plan);
  const current = home.nextConfirm != null && state.day >= home.nextConfirm;
  const asking = decideNextAction(state).kind === 'outbound';
  const homeChoices = HOUSEHOLDS.map(({id,label}) => `<button class="exp-button" type="button" aria-pressed="${home.id===id}" data-action="household" data-value="${id}">${label}</button>`).join('');
  const planForm = form('sandbox-plan', select('商品规格','product',productOptions(false),home.product)
    + number('每期数量（枚）','quantity',home.quantity,1,60)
    + select('常用周期','preset',[[7,'7 天'],[10,'10 天'],[14,'14 天'],[21,'21 天'],['custom','自定义天数']], [7,10,14,21].includes(home.cadence)?home.cadence:'custom')
    + number('自定义天数','custom',home.cadence,3,60)
    + select('服务方式','scheduleMode',[['regular','按推荐节奏，每期确认'],['on-demand','按需补给，自主确认']],home.scheduleMode)
    + select('模拟配送','delivery',['每期确认时选择','工作日晚间','周末白天'].map(value=>[value,value]),home.delivery),active || home.plan==='paused' ? '保存计划设置':'创建周期计划');
  return `${title('Rhythm','家庭补给','为每个家设置合适的补给节奏。')}
    <div class="exp-actions" role="group" aria-label="选择家庭">${homeChoices}</div>
    ${!home.active ? `<div class="exp-content-card"><h5>新增${home.name}</h5><p>${home.address} · 虚拟收货对象</p>${btn('新增独立家庭','sandbox-home','',true)}</div>` : `
    <div class="exp-rhythm-card"><p>预计补货窗口</p><strong>${estimate(window)}</strong><p>预计库存 ${window.remaining == null ? '未知' : window.remaining+' 枚'} · ${escape(home.product)}</p><p>${PLAN_LABELS[home.plan]} · ${home.nextConfirm == null ? '按需确认' : '第 '+home.nextConfirm+' 天确认'} · ${home.delivery}</p><small>${home.address} · 虚拟收货对象</small></div>
    <div class="exp-actions">${btn('上次商品快捷复购','buy','repeat',true)}${active && (current || home.scheduleMode==='on-demand') ? btn('确认本期购买','buy','cycle',true):''}${ui.edit==='plan' ? btn('关闭计划设置','edit') : btn(home.plan==='none' || home.plan==='cancelled' ? '设置周期购':'修改计划与规格','edit','plan')}</div>
    ${ui.edit==='plan' ? planForm : ''}
    <div class="exp-actions">${active && current ? btn('延期 3 天','sandbox-plan-step','defer')+btn('跳过本期','sandbox-plan-step','skip'):''}
      ${['flex','care','reminder','reorder'].includes(home.plan) ? btn('暂停计划','sandbox-plan-step','pause'):''}
      ${home.plan==='paused' ? btn('恢复计划','sandbox-plan-step','resume',true):''}
      ${!['none','cancelled'].includes(home.plan) ? btn('取消计划','sandbox-plan-step','cancel'):''}</div>
    <label class="exp-switch">本家庭补货提醒<input type="checkbox" data-permission="replenishment"${checked(home.authorization)}></label>
    <details class="exp-rhythm-levels"><summary>家庭食用人数与消耗设置</summary>
      ${form('sandbox-habits',number('食用人数','people',home.people,1,12)+number('家庭平均日耗（枚）','rate',home.rate,.1,12,.1),'保存家庭习惯')}</details>
    <details class="exp-rhythm-levels"><summary>Rhythm 四种服务</summary><p>智能补货提醒 · 便捷复购 · 弹性周期购 · 长期家庭补给。购买由消费者按期确认。</p></details>
    <div class="exp-content-card"><h5>${asking ? '家里的鸡蛋，还够吃吗？' : '主动更新家庭需求'}</h5>
      <div class="exp-actions">${btn('正好需要补货','needed','',true)}${btn('还有库存，过几天再说','edit','stock')}${btn('我已经买过了','edit','bought')}${btn('暂时不需要提醒','sandbox-feedback','snooze')}${btn('忽略提醒','sandbox-feedback','ignored')}</div>
      ${ui.edit==='stock' ? form('feedback-stock',number('剩余库存（枚，可选）','stock','',0,120,1,false)+number('几天后再评估','days',3,1,30),'提交库存反馈'):''}
      ${ui.edit==='bought' ? form('feedback-bought',number('其他渠道购买数量（枚，可选）','stock','',0,120,1,false)+select('购买品牌','brand',[['unknown','未知或暂不填写'],['other','其他品牌']],'unknown'),'记录外部购买'):''}
      ${home.feedback ? `<p class="note">最近反馈 · ${home.feedback.label}</p>` : ''}</div>`}`;
}

function orderView(state, home) {
  const orders = state.sandbox.orders.filter(order=>order.home===home.id);
  return `${title('Demo orders','模拟订单', home.name)}${orders.length ? orders.map(order => `<div class="exp-content-card"><h5>${escape(order.id)} · ${escape(order.product)}</h5><p>${order.quantity} 枚 · ${order.status==='paid' ? '已模拟支付 · 待履约':'已模拟履约'}</p>
    ${order.status==='paid' ? btn('完成模拟履约','fulfill-demo',order.id,true) : ''}</div>`).join('') : '<p>该家庭暂无模拟订单。</p>'}${jump('返回首页','home')}`;
}

function phoneView(state, home, window, ui) {
  const lab = state.sandbox;
  switch (ui.page) {
    case 'home': return homeView(state,home,window);
    case 'rhythm': return rhythmView(state,home,window,ui);
    case 'moments':
      return `${title('Moments','心意账户','确定的权益，合时的提醒。')}
        ${lab.registered ? '' : btn('模拟注册','register-demo','',true)}${benefitEntries(state).map(({id,title,rule,status:availability})=>`<div class="exp-content-card"><h5>${title}</h5>${status(availability)}<details><summary>查看使用规则</summary><p>${rule}</p></details>${availability==='可使用'?btn('使用模拟权益','redeem-demo',id):''}</div>`).join('')}${lab.id==='scan'?jump('关联模拟订单','verify'):''}`;
    case 'discovery':
      return `${title('Discovery','品质探索','基础商品信息向所有访客开放。')}
        <figure class="exp-discovery-hero"><img src="./assets/hero-egg.jpg" alt="本项目蛋形概念主视觉"></figure>
        <div class="exp-content-card"><h5>Omega-3 家庭早餐商品概念</h5><p>可选日常、轻享及家庭规格。示例图为品牌概念视觉。</p>${btn('查看商品规格','buy','single',true)}</div>
        ${[['nutrition','营养成分信息','营养表、每份用量及计量单位等待正式商品资料。'],['quality','品质证据与溯源','批次来源、检测及认证字段仅示意，待核验文件。'],['brand','品牌体验','了解家庭早餐与品质探索概念。']].map(([id,name,detail])=>`<div class="exp-content-card"><h5>${name}</h5><p>${detail}</p>${btn('记录本次查看','sandbox-discovery',id)}</div>`).join('')}${jump('进入消费者共创','lab')}`;
    case 'lab':
      return `${title('LAB','消费者共创','不填写真实联系方式或地址。')}
        ${form('sandbox-note','<label>家庭需求<textarea name="note" maxlength="180" required placeholder="例如，希望能延后本期补给"></textarea></label>'
          +select('新品体验意愿','interest',[['愿意','愿意'],['暂不体验','暂不体验']],'愿意')+select('概念评价','rating',[['有帮助','有帮助'],['需要修改','需要修改'],['暂不需要','暂不需要']],'有帮助'),'提交模拟需求')}
          <p class="note">反馈进入本地模拟需求池，由研究判断是否采纳。</p><h5>我的反馈历史</h5>
          ${lab.notes.map(entry=>`<p class="exp-content-card">第 ${entry.day} 天 · ${escape(entry.note)} · ${escape(entry.rating)}</p>`).join('') || '<p>暂无反馈。</p>'}`;
    case 'account':
      return `${title('Account','账户与授权',lab.registered ? 'DEMO-01 · 虚拟会员':'访客 · 可先购买或探索')}${lab.registered?'':btn('模拟注册','register-demo','',true)}
        <label class="exp-switch">营销触达许可<input type="checkbox" data-permission="marketing"${checked(lab.marketing)}></label>
        <label class="exp-switch">本家庭补货提醒<input type="checkbox" data-permission="replenishment"${checked(home.authorization)}></label>
        <p class="note">商品信息、订单与售后可随时主动访问。</p>${jump('查看订单','orders')}${jump('发起售后','service')}${lab.registered && state.relationship!=='preferred' ? btn('表达品牌优先选择','sandbox-preference') : ''}`;
    case 'service':
      return `${title('Service','商品服务',home.name)}<div class="exp-content-card"><p>${home.serviceOpen?'样例售后正在处理。':home.serviceCase?.outcome || '可以主动报告体验问题。'}</p>
        ${home.serviceOpen ? btn('模拟完成售后','sandbox-service','resolve',true) : btn('我对产品不满意','sandbox-service','open',true)}</div>`;
    case 'verify':
      return `${title('Verification','关联模拟订单','包装访问与购买核验分开。')}
        <div class="exp-content-card"><p>${lab.verifiedReceipt?'样例凭证已核验。':lab.receiptFailed?'本次验证失败。可继续查看商品，或选用有效样例。':'请选择一个虚拟凭证验证分支。'}</p>
        ${lab.verifiedReceipt?'':btn('无效样例凭证','verify-demo','fail')+btn('有效样例凭证','verify-demo','pass',true)}${jump('查看权益状态','moments')}</div>`;
    case 'buy':
      return `${title('Shop','选择购买规格',home.name)}
        ${form('checkout',select('虚拟商品','product',productOptions(),ui.orderMode==='repeat'?home.lastProduct??home.product:home.product)+number('购买数量（枚）','quantity',ui.orderMode==='cycle'?home.quantity:ui.orderMode==='repeat'?home.lastQuantity??'':'',1,60,1,false)+'<p class="note">留空使用所选商品的示例规格数量。</p>','预览模拟结算')}`;
    case 'checkout':
      return `${title('Order review','确认模拟购买',home.name)}<div class="exp-content-card"><h5>${escape(ui.order.product)}</h5><p>${ui.order.quantity} 枚 · ${home.address} · ${home.delivery}</p><p>确认后仅生成模拟支付和订单记录，费用为零。</p>${home.pendingOrder?jump('先处理在途订单','orders'):btn('确认模拟订单','confirm-order','',true)}</div>`;
    case 'orders': return orderView(state,home);
    default: return '';
  }
}

function lineChart(home, window, day) {
  if (window.remaining == null) return '<p class="note">库存未知。等待模拟履约或家庭主动反馈。</p>';
  const end = Math.max(day+10,window.end);
  const x = value => 30 + 300 * Math.min(1,Math.max(0,(value-day)/(end-day)));
  const y = value => 87 - 62 * value / Math.max(1,window.remaining);
  const remainingAtEnd = Math.max(0,window.remaining - (end-day)*home.rate);
  const stop = Math.min(end,day + window.remaining / home.rate);
  return `<svg class="exp-window-chart" viewBox="0 0 360 105" role="img" aria-label="家庭库存估计曲线。阴影为预计补货窗口">
      <path d="M30 20V88H330" fill="none" stroke="#a99885"/>
      <rect x="${x(window.start)}" y="20" width="${Math.max(0,x(window.end)-x(window.start))}" height="67" fill="#dfbd93" opacity=".48"/>
      <path d="M30 ${y(window.remaining)}L${x(stop)} ${y(remainingAtEnd)}L330 ${y(remainingAtEnd)}" fill="none" stroke="#94572e" stroke-width="2"/>
      <text x="30" y="102">第 ${day} 天</text><text x="275" y="102">第 ${end} 天</text>
    </svg>`;
}

function consoleView(state, home, window, decision, ui) {
  const lab = state.sandbox;
  const last = state.events[0];
  const passport = [
    ['会员身份',lab.registered?'DEMO-01':'未注册访客',lab.registered?'真实模拟事件':'规则推断'],
    ['来源渠道',lab.source,'真实模拟事件'],
    ['消费阶段',LIFECYCLE_LABELS[state.lifecycle],'规则推断'],
    ['订单次数',lab.orders.length,'真实模拟事件'],
    ['已知商品规格',home.lastProduct??'未知',home.lastProduct?'真实模拟事件':'未知'],
    ['家庭消耗习惯',`${home.people} 人 · ${home.rate} 枚/日`,home.habitsSource],
    ['预计库存',window.remaining==null?'未知':window.remaining+' 枚',window.remaining==null?'未知':'模型估计'],
    ['库存基线来源',home.stockSource,home.stockSource],
    ['补货服务授权',state.permission && home.authorization?'已授权':'未授权','消费者自述'],
    ['营销许可',lab.marketing?'已许可':'已撤回','消费者自述'],
    ['周期计划状态',PLAN_LABELS[home.plan],'消费者自述'],
    ['服务状态',home.serviceOpen?'售后处理中':home.pendingOrder?'订单待履约':'暂无在办问题','真实模拟事件'],
  ];
  const stats = [
    ['会员注册',lab.registrations],['有效消费',state.verifiedPurchases],['模拟订单',lab.orders.length],
    ['权益使用',lab.redeemed.length],['补货服务采用',lab.adopted.length],['周期计划创建',lab.createdPlans],
    ['模拟履约',lab.orders.filter(order=>order.status==='fulfilled').length],
  ];
  const rules = `<ol class="exp-rule-trace">${decision.trace.map(({rule,status,detail})=>`<li data-rule="${status}"><strong>${rule} · ${{trigger:'命中',pass:'通过',skipped:'未进入'}[status]}</strong><p>${detail}</p></li>`).join('')}</ol>`;
  return `<div class="exp-passport-bar"><strong>${home.name}</strong><small>模拟第 ${state.day} 天</small></div>
    <section class="exp-console-section"><h4>Consumer Passport</h4><dl class="exp-ledger">
      ${passport.map(([field,value,source])=>`<div><dt>${field}</dt><dd>${escape(value)}</dd><small>${source}</small></div>`).join('')}</dl></section>
    <section class="exp-console-section"><h4>Household Rhythm Intelligence</h4><p>预计窗口 <strong>${estimate(window)}</strong> · 日耗模型轨迹</p>${lineChart(home,window,state.day)}<p class="note">${window.reason}</p></section>
    <section class="exp-console-section exp-decision" id="exp-decision">
      <h4>Next Best Action</h4><p>${status(actionNames[decision.outcome])} <strong>${decision.title}</strong></p>
      <dl class="exp-ledger exp-nba-inputs"><div><dt>Input 行为输入</dt><dd>${escape(last?.label ?? '待识别')}</dd></div>
      <div><dt>State 消费者状态</dt><dd>${LIFECYCLE_LABELS[state.lifecycle]} · ${PLAN_LABELS[home.plan]}</dd></div>
      <div><dt>Inference 需求推断</dt><dd>${estimate(window)}</dd></div>
      <div><dt>Decision 经营动作</dt><dd>${decision.reason}</dd></div>
      <div><dt>Suppression 停止原因 / 条件</dt><dd>${decision.stop}</dd></div></dl>
      <details${ui.trace ? ' open':''} data-trace><summary>Rule Evaluation · 按顺序查看规则</summary>${rules}</details>
      ${decision.kind==='outbound'?btn('记录一次模拟提醒','send-action'):''}
    </section>
    <section class="exp-console-section"><h4>Consumer Value Summary</h4><p class="note">有效消费和履约包含场景初始记录，计划与订单分别统计。</p><dl class="exp-ledger">${stats.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></section>
    <section class="exp-console-section"><h4>Real-time Event Stream</h4><ol class="exp-event-stream">
        ${state.events.map(event=>`<li><strong>${escape(event.label)}</strong><small>${event.id} · 第 ${event.day} 天 ${event.time} · ${state.homes[event.home].name}${event.object?' · '+escape(event.object):''}</small><p>${escape(event.detail)}</p><span>${event.category}</span></li>`).join('')}
      </ol></section>
    ${lab.notes.length?`<section class="exp-console-section"><h4>模拟需求池</h4>${lab.notes.map(note=>`<p>${escape(note.home)} · ${escape(note.note)} · ${escape(note.interest)} · ${escape(note.rating)}</p>`).join('')}</section>`:''}`;
}

export function bindExperienceLab(root = document) {
  const box = root.querySelector('[data-experience-lab]');
  const phone = box.querySelector('#exp-service-body');
  const console = box.querySelector('[data-exp-console]');
  const notice = box.querySelector('[data-exp-message]');
  const scene = box.querySelector('#exp-scenario');
  const ui = {page:'home', edit:'', order:null, orderMode:'single', trace:false};
  const history = [];
  let lastEvent = '';
  let lastPage = 'home';
  let lastRun;
  function go(page, back = false) {
    if (ui.page !== page && !back) history.push(ui.page);
    ui.page = page;
    ui.edit = '';
    render(getConsumerState());
  }
  function clearPhone() {
    history.length = 0;
    Object.assign(ui,{page:'home',edit:'',order:null,orderMode:'single',trace:false});
    notice.textContent = '';
  }

  function render(state) {
    const {sandbox: lab} = state;
    if (!lab) return;
    if (lastRun !== undefined && lastRun !== lab.run) clearPhone();
    lastRun = lab.run;
    const home = state.homes[state.activeHome];
    const window = estimateWindow(home, state.day);
    const decision = decideNextAction(state);
    const active = document.activeElement;
    const refocus = phone.contains(active) && active.matches('button[data-action]') ? [active.dataset.action,active.dataset.value] : null;
    const consoleRefocus = console.contains(active) && active.matches('button[data-action]') ? active.dataset.action : null;
    const changingPage = lastPage !== ui.page;
    phone.innerHTML = `${history.length ? btn('返回','back') : ''}${phoneView(state,home,window,ui)}`;
    console.innerHTML = consoleView(state,home,window,decision,ui);
    if (changingPage) {
      lastPage = ui.page;
      box.querySelector('.exp-phone-main').scrollTop = 0;
      phone.classList.remove('exp-view-enter');
      void phone.offsetWidth;
      phone.classList.add('exp-view-enter');
      const heading = phone.querySelector('h4, .exp-member-card strong');
      heading?.setAttribute('tabindex','-1');
      heading?.focus({preventScroll:true});
    } else if (refocus) {
      [...phone.querySelectorAll('button[data-action]')].find(button=>button.dataset.action===refocus[0]&&button.dataset.value===refocus[1])?.focus({preventScroll:true});
    }
    if (consoleRefocus) [...console.querySelectorAll('button[data-action]')].find(button=>button.dataset.action===consoleRefocus)?.focus({preventScroll:true});
    box.querySelectorAll('.exp-bottom-nav button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.value===ui.page)));
    scene.value = lab.id;
    box.querySelector('#exp-clock').textContent = `模拟第 ${state.day} 天 · ${state.events[0]?.time ?? '09:00'}`;
    box.querySelector('#exp-scene-description').textContent = SCENARIOS.find(([id])=>id===lab.id)[2];
    const signature = lab.run+':'+lab.eventSerial;
    if (lastEvent && lastEvent !== signature) {
      box.classList.remove('exp-event-arrived');
      void box.offsetWidth;
      box.classList.add('exp-event-arrived');
    }
    lastEvent = signature;
  }
  function setMode(kind, value) {
    box.dataset[kind] = value;
    box.querySelectorAll(`[data-action="${kind}"]`).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.value===value)));
    if (value === 'intelligence') {
      ui.trace = true;
      console.querySelector('[data-trace]').open = true;
    }
  }
  scene.addEventListener('change', () => {
    clearPhone();
    dispatchConsumer('sandbox-start',{id:scene.value});
  });
  box.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const {action,value} = button.dataset;
    const state = getConsumerState();
    if (action === 'page') return go(value);
    if (action === 'back') return go(history.pop() ?? 'home',true);
    if (action === 'mode' || action === 'mobile') return setMode(action,value);
    if (action === 'present') return document.querySelector('#present').click();
    if (action === 'reset') { clearPhone(); resetConsumer(); return; }
    if (action === 'advance') return dispatchConsumer('advance',{days:Number(value)});
    if (action === 'household') {
      ui.edit = '';
      return dispatchConsumer('select-home',{home:value});
    }
    if (action === 'edit') { ui.edit = ui.edit===value ? '' : value; return render(state); }
    if (action === 'needed') {
      dispatchConsumer('sandbox-feedback',{value:'needed'});
      ui.orderMode = 'repeat';
      return go('buy');
    }
    if (action === 'buy') { ui.orderMode=value; return go('buy'); }
    if (action === 'confirm-order') {
      if (!ui.order) return;
      const order = ui.order;
      ui.order = null;
      go('orders', true);
      const after = dispatchConsumer('order-demo',order);
      if (after.sandbox.orders.length > state.sandbox.orders.length) notice.textContent = '模拟订单已生成，等待模拟履约。';
      return;
    }
    const after = dispatchConsumer(action,{value});
    notice.textContent = after.sandbox.eventSerial > state.sandbox.eventSerial ? '已记录。前后台状态已同步。' : '当前状态无需重复操作。';
  });
  box.addEventListener('change', event => {
    if (event.target.matches('[data-permission]')) dispatchConsumer('sandbox-permission',{value:event.target.dataset.permission,enabled:event.target.checked});
    if (event.target.matches('[name=preset]') && event.target.value!=='custom') event.target.form.elements.custom.value=event.target.value;
  });
  box.addEventListener('toggle', event => {
    if (event.target.matches('[data-trace]') && event.target.isConnected) ui.trace = event.target.open;
  },true);
  box.addEventListener('submit', event => {
    const type = event.target.dataset.form;
    if (!type) return;
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.target));
    if (type==='checkout') {
      ui.order = {...fields,quantity:Number(fields.quantity) || SPECS.find(([product])=>product===fields.product)[1],cycle:ui.orderMode==='cycle'};
      return go('checkout');
    }
    if (type==='sandbox-plan') fields.cadence=fields.preset==='custom'?fields.custom:fields.preset;
    ui.edit = '';
    const action = type.startsWith('feedback-') ? 'sandbox-feedback' : type;
    if (action==='sandbox-feedback') fields.value = type.slice(9);
    dispatchConsumer(action,fields);
    notice.textContent = '模拟设置已提交。';
  });
  dispatchConsumer('sandbox-start',{id:'scan'});
  subscribeConsumer(render);
  setMode('mode','operator');
  setMode('mobile','consumer');
}
