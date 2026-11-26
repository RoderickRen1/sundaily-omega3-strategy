import { subscribeConsumer, dispatchConsumer, estimateWindow, decideNextAction, PLAN_LABELS, LIFECYCLE_LABELS, RELATIONSHIP_LABELS } from './consumer-engine.js?v=5';

const periods = [
  ['家庭消耗周期', '鸡蛋从进入家庭库存到被食用的速度。记录这个家庭吃得多快。', [0, 7, 10], '模拟消耗窗口 7–10 天'],
  ['品类购买周期', '家庭购买任意品牌鸡蛋的间隔。记录家庭多久买一次鸡蛋。', [0, 10, 20, 30], '约每 10 天买一次鸡蛋'],
  ['品牌复购周期', '家庭再次买圣迪乐的间隔。记录圣迪乐在品类选择中何时被再次选中。', [0, 30], '约每 30 天买一次圣迪乐'],
];

const profiles = [
  ['稳定高频型', '消耗较快，需求窗口相对集中。接近窗口时提供便捷复购，反馈还有库存时延后。', [12, 9, 6, 3, 12, 9, 6, 3, 12, 9, 6]],
  ['稳定低频型', '每批商品消耗较慢。保留更长观察期，避免按高频家庭节奏提醒。', [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]],
  ['波动消费型', '聚餐、外出等变化会影响消耗。扩大估计窗口，并优先询问是否需要。', [12, 11, 8, 4, 3, 2, 11, 10, 10, 6, 4]],
  ['多渠道采购型', '家庭可能已在其他渠道买过。订单记录以外的库存变化可由主动反馈校准。', [10, 8, 6, 10, 9, 6, 12, 10, 7, 6, 10]],
  ['家庭关爱型', '同一会员可能同时管理自己和爸妈的家。分别估计库存、节奏和许可。', [11, 9, 8, 6, 5, 4, 3, 11, 10, 8, 7]],
];

const services = [
  ['Moments', '心意账户', '入会有惊喜、首购有获得、二购有理由、长期购买有持续价值。', '显示当前阶段的确定权益和合适使用时机。概念礼遇按阶段演示。'],
  ['Rhythm', '家庭补给', '家里什么时候需要鸡蛋，就在合适的时机获得确认和补给服务。', '从提醒与便捷复购，到弹性周期购和长期家庭补给。可直接选择需要的服务。'],
  ['Discovery', '品质探索', '让消费者看懂商品营养、品质与溯源信息。', '按真实商品及生产信息建立信任，概念体验仅演示如何呈现资料。'],
  ['LAB', '消费者共创', '让家庭场景和使用反馈进入需求发现与产品验证。', '主动参加研究或共创，反馈使用范围与消费者授权一致。'],
];

const levels = [
  ['Reminder', '智能补货提醒', '在需求窗口内确认是否需要。库存充足、已买或主动暂停时结束本次提示。'],
  ['Reorder', '便捷复购', '提供常购商品与熟悉的路径。消费者确认后才能继续商品流程。'],
  ['Plan', '弹性周期购', '可调整批次、节奏和配送，每期确认订单。初期采用按期确认，无自动扣款。'],
  ['Care', '长期家庭补给', '按家庭独立维护偏好、节奏和授权。变化时重新确认，暂停或取消立即停止该计划。'],
];

const loop = [
  ['Sense', '感知', '记录包装访问、购买验证、支付、履约、服务请求或反馈的发生。'],
  ['Understand', '理解', '读取消费者的行为记录、主动表达和模型估计，识别生命周期与当下需求。'],
  ['Decide', '决策', '按服务优先、许可、履约、偏好、频控、需求和服务匹配逐条检查。'],
  ['Act', '行动', '输出执行、延迟或保持静默。延迟说明复核时机，执行动作包含停止条件。'],
  ['Learn', '学习', '用购买、库存、售后和需求反馈修正家庭档案，验证动作是否带来真实增量。'],
];

const rules = [
  ['主动服务与必要售后', '先回应已发起的服务请求，售后解决或请求撤回后结束。'],
  ['触达许可', '未许可时保持静默。撤回许可即结束主动触达。'],
  ['待履约与售后', '待履约或服务处理中延迟推广。履约完成或售后解决后重新评估。'],
  ['暂停及明确偏好', '家庭计划暂停、已取消或主动要求暂停提醒时停止该计划下的推荐。'],
  ['近期触达与频控', '频控期内延迟。频控结束后重新判断需求。'],
  ['需求识别', '库存充足、已购买或需要时间不明时延后复核或保持静默。'],
  ['商品与服务匹配', '提供符合商品、家庭节奏和当前许可的下一步，购买或意图改变时停止。'],
  ['经营结果', '执行、延迟或保持静默，记录触发原因和停止条件。'],
];

const events = [
  ['包装访问', '记录商品触点与访问意图，作为来源线索。'], ['注册', '沉淀统一身份并标记会员获取。'],
  ['购买验证', '核对关联消费与商品事实。'], ['支付', '记录交易确认与待履约状态。'],
  ['履约', '完成交付后更新库存与周期校准证据。'], ['补货授权', '记录范围、暂停或撤回的许可。'],
  ['需求反馈', '用消费者当前表达更新窗口或提醒偏好。'], ['计划创建', '记录独立家庭、商品和节奏。'],
  ['计划调整', '只调整指定家庭的后续补给。'], ['暂停', '冻结当前家庭的主动计划动作。'],
  ['取消', '结束相应计划，保留已有模拟记录。'], ['退款', '撤销有效消费贡献并检查服务状态。'],
  ['售后', '优先进入服务和关系修复，结束后再评估经营。'],
];

const feedbacks = [
  ['needed', '正好需要补货'],
  ['stock', '还有库存'],
  ['bought', '已经购买'],
  ['snooze', '暂时不需要提醒'],
];

const evidence = (label) => `<span class="v2-proof">${label}</span>`;
const options = (name, labels) => `<div class="choices" role="group" aria-label="${name}">${labels.map((label, index) => `<button type="button" data-option="${index}" aria-pressed="${index === 0}">${label}</button>`).join('')}</div>`;
const itemList = (items) => `<dl class="facts">${items.map(([term, meaning]) => `<div><dt>${term}</dt><dd>${meaning}</dd></div>`).join('')}</dl>`;

function periodChart() {
  return `<div class="v2-periods">
    <div class="v2-orbit-key" aria-hidden="true"><div><span>品牌复购</span><div><span>品类购买</span><div><span>家庭消耗</span></div></div></div></div>
    <div class="v2-tracks"><div class="v2-track-days"><span>第 0 天</span><span>第 10 天</span><span>第 20 天</span><span>第 30 天</span></div>
    ${periods.map(([name, meaning, points, example]) => `<div class="v2-track"><strong>${name}</strong><p>${meaning}</p><div class="v2-track-line" aria-hidden="true">${points.map(day => `<i style="left:${day / 30 * 100}%"></i>`).join('')}</div><small>${example}</small></div>`).join('')}
    </div>
  </div>`;
}

export function rhythmModules() {
  return `
    <article id="rhythm-research" class="v2-module" aria-labelledby="rhythm-research-title">
      <header><p class="eyebrow">04 · Household Consumption Intelligence</p><h3 id="rhythm-research-title">从品牌营销日历，到消费者生活节奏。</h3>
      <p class="intro">分别理解家庭消耗、品类采购及品牌复购。动态补货的目标是找准下一次真实购买需求。</p>${evidence('已确认战略共识')}</header>
      <div class="v2-block"><h4>三重周期模型</h4>${evidence('模拟经营数据')}${periodChart()}
        <p class="note">虚拟家庭每 10 天买一次鸡蛋，每 30 天买一次圣迪乐。购买次数、购买数量与消费金额分别统计。</p></div>
      <div class="v2-block v2-split">
        <div><h4>五类家庭消费节奏</h4><p class="note">类型可重叠。曲线用于演示识别方式。</p>${evidence('待验证经营假设 · 模拟经营数据')}${options('家庭节奏类型', profiles.map(([name]) => name))}</div>
        <figure class="v2-curve" aria-labelledby="rhythm-curve-caption">
          <figcaption id="rhythm-curve-caption">模拟家庭库存随时间变化</figcaption>
          <svg viewBox="0 0 360 170" role="img" aria-labelledby="rhythm-curve-title"><title id="rhythm-curve-title">家庭库存曲线</title>
            <g class="v2-curve-grid"><path d="M37 20H341 M37 57H341 M37 94H341 M37 131H341 M37 20V131"/></g>
            <g class="v2-curve-labels"><text x="4" y="25">12 枚</text><text x="8" y="80">6 枚</text><text x="11" y="134">0</text><text x="34" y="157">第 0 天</text><text x="309" y="157">第 20 天</text></g>
            <path id="rhythm-curve-line"/><g id="rhythm-curve-points"></g>
          </svg>
          <p id="rhythm-profile-description" role="status"></p>
        </figure>
      </div>
      <div class="v2-block v2-split">
        <div><h4>家庭节奏档案</h4><p>Household Rhythm Profile 逐步识别家庭食用人数、消费习惯、家庭库存、采购频率、生活变化、品牌偏好及服务偏好。优先沉淀已有记录和主动反馈。</p>
          <h4 class="v2-follow-title">Multi-Home 多家庭补给</h4><p>一个身份可管理我的家、爸妈的家和其他家庭，分别保存商品、库存估计、补给节奏、配送与授权。</p></div>
        <div><h4>动态补货预测</h4><ol class="v2-inline-steps"><li>冷启动估计</li><li>行为校准</li><li>动态预测</li></ol><p>以窗口表达不确定性。家庭状态、订单和反馈变化后重新计算。</p><a class="v2-text-link" href="#growth-lab">打开商业验证实验室</a></div>
      </div>
      <div class="v2-block" id="rhythm-feedback">
        <h4>反馈学习闭环</h4><ol class="v2-inline-steps"><li>订单与家庭习惯</li><li>需求预测</li><li>服务触发</li><li>消费者反馈</li><li>周期修正</li><li>资产更新</li></ol>
        <p class="note">向当前模拟家庭提交一次反馈。产品实验室与商业验证实验室会同步反映变化。</p>${evidence('产品概念演示 · 模拟经营数据')}
        <div class="v2-feedback-panel">
          <p><strong id="rhythm-feedback-home"></strong><span id="rhythm-feedback-window"></span></p>
          <div class="v2-feedback-buttons" role="group" aria-label="家庭需求反馈">${feedbacks.map(([value, label]) => `<button type="button" class="button button-small" data-rhythm-feedback="${value}">${label}</button>`).join('')}</div>
          <p class="selection-note" id="rhythm-feedback-result" role="status"></p>
        </div>
      </div>
      <details class="v2-evidence-details"><summary>研究方法与验证重点</summary><p>结合情境访谈、消费者日记、交易分析、旅程研究、概念测试及可用性测试，找出真实补货决策点。同时观察库存、下一次采购计划、渠道习惯与服务偏好。</p></details>
    </article>

    <article id="rhythm-product" class="v2-module" aria-labelledby="rhythm-product-title">
      <header><p class="eyebrow">05 · Product Design &amp; User Experience</p><h3 id="rhythm-product-title">懂您的生活节奏，也懂您在乎的人。</h3>
      <p class="intro">一个 SUNDaily Membership 身份，承接四类服务与多个家庭计划。动态需求是经营依据，固定周期购和蛋卡用于承接适合的商品需求。</p>${evidence('产品概念演示')}</header>
      <div class="v2-block v2-split">
        <div><h4>四大会员服务</h4>${options('四大会员服务架构', services.map(([key, label]) => `${key} ${label}`))}</div>
        <div class="v2-service-preview" id="v2-service-preview" aria-live="polite"></div>
      </div>
      <div class="v2-block"><h4>Rhythm 四层服务</h4><p class="note">按家庭需求选择服务层级。消费者可从适合自己的服务开始。</p>
      <div class="v2-service-levels">${levels.map(([name, title, meaning]) => `<div><span class="eyebrow">Rhythm ${name}</span><h5>${title}</h5><p>${meaning}</p></div>`).join('')}</div></div>
      <div class="v2-block v2-split">
        <div><h4>产品前台</h4><p>统一身份、动态会员首页、四大服务、家庭计划、商品及权益，以及授权、隐私与提醒管理。</p><a class="button button-primary" href="#experience-lab">体验会员产品</a></div>
        <div><h4>Consumer Growth Console</h4><p>Consumer Passport 与 Next Best Action 连接转化及动态补货引擎。消费者行为进入后台，更新档案、消费状态、需求窗口与经营决策。</p><a class="v2-text-link" href="#consumer-intelligence">查看数据与决策规则</a></div>
      </div>
    </article>

    <article id="consumer-intelligence" class="v2-module" aria-labelledby="consumer-intelligence-title">
      <header><p class="eyebrow">06 · Consumer Intelligence &amp; Growth Validation</p><h3 id="consumer-intelligence-title">每一次消费者行为，都是下一次经营决策的依据。</h3>
      <p class="intro">从事件读懂需求，再以许可、服务状态和频控决定下一步。保持静默也是经营结果。</p>${evidence('已确认战略共识 · 产品概念演示')}</header>
      <div class="v2-block v2-split">
        <div><h4>五阶段智能经营闭环</h4>${options('智能经营闭环', loop.map(([key, label]) => `${key} ${label}`))}</div>
        <div class="v2-service-preview" id="v2-intelligence-step" aria-live="polite"></div>
      </div>
      <div class="v2-block"><h4>动态消费者状态</h4><p class="note">同一个模拟消费者的六维状态随两个实验室的操作更新。来源口径随字段展示。</p>
        <div id="v2-consumer-dimensions" class="v2-state-grid">
        ${[
          ['lifecycle', 'Lifecycle · 消费阶段', '模拟业务记录'], ['demand','Demand · 需求状态','模型估计'],
          ['relationship','Relationship · 品牌关系','消费者自述'], ['plan','Rhythm · 周期计划','消费者自述与选择'],
          ['service','Service · 服务状态','模拟业务记录'], ['permission','Permission · 触达许可','消费者主动授权'],
        ].map(([id, name, label]) => `<div><p>${name}</p><strong data-dimension="${id}"></strong><small>${label}</small></div>`).join('')}
        </div>
      </div>
      <div class="v2-block v2-split">
        <div><h4>Next Best Action 决策顺序</h4>
          <ol class="v2-rule-list">${rules.map(([name, detail]) => `<li><strong>${name}</strong><p>${detail}</p></li>`).join('')}</ol></div>
        <div><h4>当前决策</h4><p id="v2-current-decision" class="selection-note" aria-live="polite"></p>
          <h4 class="v2-follow-title">关键经营指标</h4><p>获取、激活、首购、二购、周期经营与单客价值。包装访问、核验首购与交易贡献分口径查看。</p>
          <h4 class="v2-follow-title">商业验证</h4><p>用同期群、A/B 对照实验、增量贡献及单客经济验证经营假设。</p><a class="button button-primary" href="#growth-lab">探索商业价值</a></div>
      </div>
      <details class="v2-evidence-details"><summary>查看 13 类经营事件</summary>${itemList(events)}</details>
    </article>
  `;
}

function bindOptions(article, render) {
  const buttons = [...article.querySelectorAll('[data-option]')];
  function activate(index) {
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    render(index);
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => activate(index)));
  activate(0);
}

export function bindRhythmModules(root = document) {
  bindOptions(root.querySelector('#rhythm-research'), index => {
    const [name, description, stock] = profiles[index];
    const points = stock.map((value, step) => [37 + step * 30.4, 131 - value / 12 * 111]);
    root.querySelector('#rhythm-curve-title').textContent = `${name}模拟库存。从 ${stock[0]} 枚开始，第 20 天为 ${stock.at(-1)} 枚。`;
    root.querySelector('#rhythm-curve-line').setAttribute('d', points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '));
    root.querySelector('#rhythm-curve-points').innerHTML = points.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.7"/>`).join('');
    root.querySelector('#rhythm-profile-description').textContent = description;
  });
  bindOptions(root.querySelector('#rhythm-product'), index => {
    const [name, label, value, delivery] = services[index];
    root.querySelector('#v2-service-preview').innerHTML = `<p class="eyebrow">${name}</p><h4>${label}</h4><p>${value}</p><p class="note">${delivery}</p>`;
  });
  bindOptions(root.querySelector('#consumer-intelligence'), index => {
    const [name, label, description] = loop[index];
    root.querySelector('#v2-intelligence-step').innerHTML = `<p class="eyebrow">${index + 1} / ${loop.length} · ${name}</p><h4>${label}</h4><p>${description}</p>`;
  });
  root.querySelector('#rhythm-feedback').addEventListener('click', event => {
    const button = event.target.closest('[data-rhythm-feedback]');
    if (button) dispatchConsumer('feedback', { value: button.dataset.rhythmFeedback });
  });
  subscribeConsumer(state => {
    const home = state.homes[state.activeHome];
    const window = estimateWindow(home, state.day);
    const decision = decideNextAction(state);
    const feedback = feedbacks.find(([key]) => key === home.feedback?.value);
    const data = {
      lifecycle: LIFECYCLE_LABELS[state.lifecycle],
      demand: window.start == null ? '未知 · 等待库存或履约记录' : `第 ${window.start}–${window.end} 天 · ${window.confidence}`,
      relationship: RELATIONSHIP_LABELS[state.relationship],
      plan: PLAN_LABELS[home.plan],
      service: state.request ? '消费者主动请求' : state.serviceOpen ? '售后处理中' : state.pendingOrder ? '待履约' : '无待处理服务',
      permission: state.permission && home.authorization ? '已授权' : '未授权',
    };
    Object.entries(data).forEach(([key, value]) => { root.querySelector(`[data-dimension="${key}"]`).textContent = value ?? '待识别'; });
    root.querySelector('#rhythm-feedback-home').textContent = home.name;
    root.querySelector('#rhythm-feedback-window').textContent = ` · 模拟第 ${state.day} 天 · ${window.start == null ? '补货窗口未知' : `预计第 ${window.start}–${window.end} 天需要补给`}`;
    root.querySelector('#rhythm-feedback-result').textContent = feedback
      ? `最近反馈「${feedback[1]}」。${decision.title}。 ${decision.reason}`
      : `当前推演：${decision.title}。 ${decision.reason}`;
    root.querySelector('#v2-current-decision').textContent = `${decision.title}。 ${decision.reason} 停止条件：${decision.stop}`;
  });
}
