const decisionNodes = [
  ['需求相关性', 'Relevance', '这是我家现在要解决的事吗？', '场景与当下需要脱节，消费者还没有形成购买理由。', '用实际采购和用餐场景匹配问题，优先展示与本次需求有关的信息。'],
  ['价值认知', 'Comprehension', '它好在哪里，又为什么适合我？', '包装卖点过多，营养和规格差异难以理解。', '先解释一个核心差异，再按需提供可核对的成分、规格与使用说明。'],
  ['品质信任', 'Trust', '哪些信息可以核对？', '口号无法回答产地、检测或质量控制问题。', '把适用的溯源、检测范围和日期置于可查位置，明确证据覆盖范围。'],
  ['支付意愿', 'Willingness to Pay', '这份价值值得现在付费吗？', '单位价格、规格或首次尝试成本不清楚。', '说明总价、规格和单枚价格，优先测试适合尝试的现有商品。'],
  ['行为便利性', 'Convenience', '我能用熟悉的方式尽快买到吗？', '规格选择、库存或配送不明确，流程过长。', '保留直接购买入口，提供规格建议、可供渠道与清晰履约提示。'],
  ['体验验证', 'Experience Validation', '实际体验符合我当初的选择吗？', '出现破损、体验落差或售后困难时，消费理由难以成立。', '先完成必要售后，记录适当反馈并用于改进下一次体验。'],
];

const motives = [
  ['品质安全驱动', '品质是否可信', '品质证据及溯源', '稳定产品体验'],
  ['营养价值驱动', '营养差异难理解', '清晰的营养成分信息', '对真实商品价值的认可'],
  ['家庭关爱驱动', '是否适合家人', '家庭消费场景', '家庭认可及关爱服务'],
  ['理性价值驱动', '高端溢价是否合理', '透明价值及体验规格', '稳定经济回馈'],
  ['便利习惯驱动', '购买是否麻烦', '降低选择成本', '一键复购及弹性补给'],
];

const informationContexts = [
  ['线下货架', '货架第一眼聚焦与场景相关的核心差异。', '清楚标明规格、价格及与家庭需求的关系。', '让消费者查看品质凭证、信息来源与适用范围。'],
  ['商品包材', '标出品名、规格和一个核心识别线索。', '用包装层级呈现营养信息及使用场景。', '提供可核对的批次或质量信息入口，并解释信息范围。'],
  ['线上商品详情页', '首屏展示商品、规格和核心差异。', '比较有关规格及购买方式，说明总价和履约条件。', '按需展开品质证据、售后条件和常见问题。'],
];

const barriers = [
  ['认知', '用单一核心差异、成分说明和场景示例降低理解成本。'],
  ['信任', '提供可追溯来源、检测适用范围及售后说明。'],
  ['价格', '展示单位价值和体验规格，按成本约束测试合理权益。'],
  ['选择', '按人数及常购偏好建议一到两个规格，保留全量选项。'],
  ['操作', '减少必填信息和步骤，保留便捷的下一步入口。'],
  ['渠道', '恢复消费者熟悉的可购买路径，说明实际支持范围。'],
  ['库存', '明确可购状态，使用经确认的到货提示或可选规格。'],
  ['体验', '先解决破损、未达预期及售后问题，再评估后续动作。'],
  ['购买承诺', '展示单次购买和按期确认规则，让消费者自主选择服务深度。'],
];

const journeys = [
  {
    title: '商品包装扫码',
    steps: ['产品触点', '扫码利益', '商品专属落地页', '会员注册', '消费验证', '补货服务'],
    fields: [
      '看到包装并扫码，先获取产品或扫码权益信息，可自行决定入会。',
      '想知道扫码能得到什么，以及是否需要提供额外信息。',
      '首屏展示对应商品、品质线索与权益条件，可直接浏览溯源。',
      '查看商品与扫码权益。自愿入会后按支持范围验证消费。',
      '记录包装访问与注册状态。只有可核对且获授权的凭证才能确认消费。',
      '已验证消费且获得补货提醒许可时，按需求窗口承接服务。',
      '包装访问、注册、购买验证、补货授权分别记录。',
      '扫码到注册转化率、可验证消费占比、经授权的补货服务启用率。',
      '消费者退出、拒绝授权或验证无法完成时停止后续主动经营。等待真实凭证。',
    ],
  },
  {
    title: '线下导购',
    steps: ['需求识别', '商品推荐', '商品成交', '会员连接', '后续消费经营'],
    fields: [
      '向导购说明购买对象及用途，选择规格后独立完成交易。',
      '希望快速判断商品是否适合家人，并保留熟悉的购买方式。',
      '货架和导购传递一致的信息。结账后可自愿选用会员服务。',
      '选购合适规格。结账完成后提供会员服务入口。',
      '门店交易按可用范围核验。消费者主动连接后才建立会员关联。',
      '在获授权时呈现常购商品与售后服务，结合实际体验安排后续。',
      '推荐接触、支付或交易验证、会员连接、反馈分开记录。',
      '导购接触到成交转化率、成交后会员连接率、验证后首购人数。',
      '商品缺货时说明替代可用性。拒绝连接或售后待解决时停止二购推动。',
    ],
  },
  {
    title: '内容电商',
    steps: ['场景内容', '对应落地页', '商品价值与信任', '直接购买或入会', '后续承接'],
    fields: [
      '看到场景内容，查看对应商品，按自己的意图购买或了解会员。',
      '希望内容中的承诺与商品页一致，购买路径清楚。',
      '场景关键词、商品及可信证据前后一致，区分直接购与了解会员。',
      '查看对应商品。按实际渠道条件直接购买或了解会员服务。',
      '识别授权范围内的来源和状态。无法关联外部订单时标记未验证。',
      '按平台权限承接使用信息或售后，再在许可范围内考虑复购服务。',
      '内容访问、合规跳转、注册、可验证支付或履约分别记录。',
      '落地触达率、可追踪的访问到购买转化率、允许归因范围内的会员增长。',
      '平台不允许导流或订单数据不可用时停在可用渠道内，停止自动身份匹配。',
    ],
  },
  {
    title: '线上货架',
    steps: ['商品详情', '规格选择', '单次购买或周期服务选择', '订单承接', '消费体验'],
    fields: [
      '对比规格、价格及履约，选择单次或按期确认的服务方式。',
      '希望总价、数量、配送和确认条件都清楚。',
      '并列展示购买路径，说明按期确认、配送条件和调整方式。',
      '选择规格并继续单次购买，或主动了解弹性周期服务。',
      '区分规格浏览、下单、支付、履约和周期服务意向。',
      '优先履约与售后。在试用反馈及授权基础上提供下次服务建议。',
      '规格选择、购买方式选择、支付、履约、售后和计划创建分开记录。',
      '详情到支付转化率、履约完成率、授权后的周期计划确认率。',
      '待履约、缺货、取消或售后处理中停止追加销售，优先解释处理状态。',
    ],
  },
  {
    title: '蛋卡礼赠',
    steps: ['赠礼者购买', '收礼者领取', '商品兑换与履约', '实际消费体验', '自主付费购买'],
    fields: [
      '赠礼者完成购买。收礼者领取，并按商品权益安排兑换及体验。',
      '送礼方在意礼遇是否得体。收礼方在意领取是否方便、选择是否自主。',
      '清晰解释卡权益、兑换、实际履约及收礼方可选服务。',
      '领取并兑换。体验后可自行进入常购商品。',
      '分别识别赠礼账户、收礼方领取状态、兑换记录与自主付费交易。',
      '先完成礼赠履约，记录自愿反馈。有需求且获许可时才提示适合的自主购买路径。',
      '蛋卡支付、领取、兑换、履约、收礼者反馈、自主付费购买分别记录。',
      '蛋卡兑换率、兑换后的体验反馈率，以及收礼者自主付费转化率。',
      '未领取、礼卡已撤回、收礼方未许可或礼赠售后处理中停止后续商业触达。',
    ],
  },
  {
    title: '存量会员',
    steps: ['识别消费状态', '匹配实际需求', '便捷复购或弹性周期购', '长期忠诚'],
    fields: [
      '已有会员查看商品、反馈库存或表达需求，自主确认后续服务。',
      '希望品牌懂得已有偏好，也尊重暂时无购买需要的时刻。',
      '显示常购商品、补货窗口、确认方式和暂停入口。',
      '查看常购商品、确认本期补给，或按需更新库存反馈。',
      '合并已核验消费、自述反馈和单独标明的需求估计。',
      '依据真实需求提供便利承接。许可、售后和频控进入同一经营决策。',
      '购买验证、需求反馈、补货授权、计划确认、暂停或取消。',
      '可识别会员复购率、计划确认率、授权退出率及单客价值变化。',
      '还有库存、已在其他渠道购买、计划暂停或未授权时停止当前轮提醒。',
    ],
  },
];

const blueprintBands = [
  ['消费者与前台', ['消费者行为', '消费者心理', '前台体验', '核心转化 CTA']],
  ['后台识别与承接', ['后台识别', '运营承接']],
  ['验证与停止', ['数据事件', '转化指标', '停止条件']],
];

const visitorStatuses = [
  '未识别访客', '已入会未验证消费', '已验证首购', '已有复购记录',
  '待履约或售后', '暂停提醒',
];

const visitIntents = [
  '了解商品', '直接购买', '领取礼赠', '希望补货', '了解会员', '服务求助',
];

const sourceRecommendations = [
  ['查看这款商品的品质信息', '以扫码所对应的商品信息与扫码权益开场。消费记录需另行验证。', '查看商品与扫码权益'],
  ['找到适合家庭的商品规格', '按消费者表达的使用场景推荐商品，保留熟悉的门店购买路径。', '查看规格与可购渠道'],
  ['从熟悉的生活场景了解商品', '承接前一条内容所讲的场景和商品。入口及订单关联按实际平台权限设计。', '查看场景对应商品'],
  ['选清规格，再决定怎么买', '可比较规格、价格、履约及单次购买或按期确认服务。', '选择商品规格'],
  ['先了解这份礼赠如何领取', '说明领取、兑换与履约，收礼体验和后续自主付费分别识别。', '查看领用条件'],
  ['从常购商品和真实需求开始', '根据已有记录和已表达需求，安排商品浏览、便捷复购或其他会员服务。', '查看常购商品'],
];

function contextualDecision(source, status, intent) {
  if (intent === 5 || status === 4) return ['优先处理服务请求', '先查看待履约订单、配送或售后进度。该次访问先完成必要服务。', '查看服务状态', '服务优先', '服务未完成期间暂缓购买建议。'];
  if (intent === 2) return ['确认可领取的礼赠', '说明卡权益、礼包内容的适用范围和履约条件。领取与兑换分别记录。', '检查领用条件', '承接主动意图', '领取资格不符、礼赠已履约或用户退出时结束当次引导。'];
  if (intent === 1) return [
    source === 1 ? '继续在熟悉渠道购买' : '继续本次商品选择',
    '以清晰的规格、价格及履约说明承接主动购买。在渠道允许范围内保留直接购买路径。',
    '选择规格与购买渠道', '承接主动意图', '已购买、取消或渠道无法履约时结束当次推荐。',
  ];
  if (intent === 3) {
    const canUseHistory = status === 2 || status === 3 || status === 5;
    return [
      canUseHistory ? '按需确认这次补给' : '先了解当前补给需要',
      status === 5 ? '承接消费者本次主动补给请求，保持此后的提醒暂停。' : '核对家庭需求与商品选择，按当次意愿确认服务。长期提醒由消费者另行授权。',
      canUseHistory ? '核对常购商品与需求' : '查看补给方式', '承接主动意图',
      '确认已买、还有库存或明确暂停时，结束本轮补给推荐。',
    ];
  }
  if (intent === 4) {
    return status === 0
      ? ['先了解会员能获得什么', '清晰展示入会价值、权益条件与授权选项。由消费者自主决定是否注册。', '查看会员权益', '尊重入会选择', '消费者关闭、拒绝或已完成注册时结束入会引导。']
      : ['查看已开通的会员服务', '进入已有会员的心意账户、品质探索和家庭补给服务。', '查看我的会员服务', '承接主动意图', '已完成查询或消费者退出时结束当次服务引导。'];
  }
  if (status === 5) return ['保留商品浏览，维持提醒暂停', '继续展示本次主动查看的商品信息。提醒在明确恢复之前保持暂停。', '查看商品信息', '保持静默', '在消费者明确恢复提醒之前，持续停止主动提醒。'];
  if (status === 1 && source === 0) return ['查看商品，按需验证消费', '已入会访客可浏览扫码商品，并在授权条件具备时主动提交支持的购买凭证。', '查看商品和验证方式', '按需提供服务', '凭证不可核验或未得到许可时停止消费关联。'];
  const [title, description, action] = sourceRecommendations[source];
  return [title, description, action, '按来源承接', '本次需求结束、消费者退出或权限不足时停止承接。'];
}

const valueStages = [
  ['入会有惊喜', 'Welcome Hook', '低门槛、即时感知的入会价值。', '可先看到拟议的入会礼遇与适用条件，再自主决定是否入会。', '已入会、退出或拒绝时结束本轮邀请。'],
  ['首购有获得', 'Trial Hook', '降低首次商品尝试成本及心理风险。', '通过合适的体验商品和清晰的品质说明，获得第一次真实商品体验。', '已付费、无法履约或主动放弃时结束本轮首购引导。'],
  ['二购有理由', 'Repeat Hook', '体验认可、真实补货需求及购买便利。', '明确下次符合条件可享的权益，在真实需求临近且获许可时提示使用。', '还有库存、已买、无授权或售后进行中时停止触发。'],
  ['长期购买有持续价值', 'Rhythm Hook', '持续回馈、家庭补给便利及长期服务。', '按家庭节奏使用便捷复购、弹性周期服务和家庭关爱权益。', '已确认当期补给、暂停计划或撤回授权时停止本轮提示。'],
];

const repeatRules = [
  ['体验不满意', '优先售后', '先受理质量、破损或体验反馈，确认消费者问题得到解决后再评估下一步。', '售后未结案或消费者表示不愿继续时，停止二购推动。'],
  ['家中有库存', '延后', '尊重库存反馈，推迟需求窗口。已有授权时，按新的窗口再判断是否提供服务。', '预计窗口未到、库存再次充足或授权收回时停止当前轮。'],
  ['需求未知', '保持静默', '保留自主入口，等待真实购买、库存反馈或主动求助提供新信号。', '缺少可判断需求的信号时，暂停主动跟进。'],
  ['需求明确', '承接购买', '提供常购商品、合适规格和可履约路径，由消费者主动确认。', '确认已买、暂时不需要或待履约时结束当前轮。'],
  ['价格阻力', '匹配合理权益', '明确单位价格和规格，按已承诺权益及成本约束提供合适选项。', '可用权益超出成本约束、消费者拒绝或需求结束时停止。'],
  ['渠道阻力', '恢复熟悉路径', '查找消费者常用且可完成履约的购买渠道，说明可用范围。', '可用渠道缺货或数据权限不足时，停止跳转和自动归因。'],
  ['商品选择阻力', '提供规格建议', '优先展示常购商品和适合家庭人数的规格，保留自主选择。', '消费者已选定商品、需求结束或明确拒绝建议时停止。'],
];

const variables = (items) => items.map(([label, description]) => `
  <div><dt>${label}</dt><dd>${description}</dd></div>
`).join('');

const flow = (steps, label) => `<ol class="gc-flow" role="list" aria-label="${label}">${steps.map(step => `<li>${step}</li>`).join('')}</ol>`;

function switcher(id, label, options, stageTrack = false) {
  return `<div class="choices gc-choices${stageTrack ? ' gc-value-track' : ''}" role="group" aria-label="${label}" id="${id}">
    ${options.map((option, index) => `<button type="button" data-gc-choice="${index}" aria-pressed="${index === 0}" aria-controls="${id}-result">${option}</button>`).join('')}
  </div>
  <div id="${id}-result" class="gc-choice-result" aria-live="polite" aria-atomic="true"></div>`;
}

function disclosure(title, body) {
  return `<details class="gc-disclosure"><summary>${title}</summary><div>${body}</div></details>`;
}

function moduleArticle(id, name, english, headline, introduction, body) {
  return `<article class="v2-module gc-module" id="${id}" aria-labelledby="heading-${id}">
    <header class="gc-header">
      <p class="eyebrow"><span>${name}</span><span lang="en">${english}</span></p>
      <h3 id="heading-${id}">${headline}</h3>
      <p class="intro">${introduction}</p>
    </header>
    ${body}
  </article>`;
}

const evidence = (label) => `<span class="gc-evidence">${label}</span>`;
const group = (title, body) => `<section class="gc-block"><h4>${title}</h4>${body}</section>`;

function decisionModule() {
  return moduleArticle('decision', '消费者购买决策研究', 'Consumer Decision-making',
    '降低消费者做出正确选择的阻力。',
    '用利益降低门槛，用需求建立习惯，用体验巩固忠诚。', `
    ${group('六大决策节点', evidence('待验证经营假设') + switcher('gc-decision-nodes', '六大决策节点',
      decisionNodes.map(([label]) => label)) + '<p class="gc-caption">完成当前判断、消费者主动退出或服务超出可支持范围时，结束本轮引导。</p>')}
    ${group('消费者动机探索器', evidence('待验证经营假设') +
      '<p class="gc-description">五种动机用于研究与设计测试，消费者可能同时具备多种动机。</p>' +
      switcher('gc-motives', '五类消费动机', motives.map(([label]) => label)))}
    ${group('三个关键决策时刻', `
      <dl class="gc-moments">${variables([
        ['购买前', '建立购买理由。'],
        ['购买时', '完成购买决策。'],
        ['购买后', '验证购买理由。'],
      ])}</dl>
      <p class="gc-caption">购买体验会影响下一次品牌选择，形成下一轮决策的起点。</p>
    `)}
    ${group('3–10–30 秒信息模型', evidence('待验证经营假设') +
      '<p class="gc-description">用于测试信息呈现层级。时间为设定的观察窗口，个人决策用时由研究另行测量。</p>' +
      switcher('gc-information', '信息触点', informationContexts.map(([label]) => label)))}
    ${disclosure('查看九类转化阻力与解决机制', `
      <p>先定位阻力，再选择机制。价格权益用于处理特定的价格阻力。</p>
      <dl class="gc-reference">${variables(barriers)}</dl>
    `)}
    ${group('两条入会与购买路径', `
      <div class="gc-dual-path">
        <section><h5>路径 A · 先入会后购买</h5>${flow(['识别商品价值', '自主入会', '选择并购买商品', '核对消费凭证', '根据体验与需求承接'], '先入会后购买')}
          <p>首次接触用于识别消费者拉新，注册形成会员拉新，购买验证后才进入消费价值测量。</p>
        </section>
        <section><h5>路径 B · 先购买后入会</h5>${flow(['发现购买需要', '直接购买商品', '履约与体验', '自主连接会员', '经授权关联已验证消费'], '先购买后入会')}
          <p>首次自付成交与注册分别记录。关联历史消费时同步记录来源，后续实际付费反映消费价值变化。</p>
        </section>
      </div>
    `)}
  `);
}

function labeledSelect(id, title, options) {
  return `<label for="${id}"><span>${title}</span><select id="${id}">${options.map((label, index) => `<option value="${index}">${label}</option>`).join('')}</select></label>`;
}

function conversionModule() {
  return moduleArticle('conversion', '全域转化链路设计', 'Conversion Journey Design',
    '多入口、差异化路径、统一经营中枢。',
    '从入口意图识别、必要服务和真实交易出发，接续到可识别、获授权的长期消费者经营。', `
    ${group('六大转化链路 · 服务蓝图', evidence('待验证经营假设') +
      switcher('gc-journeys', '六大消费者转化旅程', journeys.map(({title}) => title)) +
      `<dl class="gc-guardrails">${variables([
        ['包装验证', '扫码说明发生了包装访问，购买需通过真实凭证另行验证。'],
        ['交易与入会', '支持交易的入口保留直接购买路径，消费者可独立选择是否入会。'],
        ['礼赠统计', '蛋卡购买、兑换、收礼者消费体验及自主付费购买分开统计。'],
      ])}</dl>`)}
    ${group('情境化转化引擎', evidence('产品概念演示') +
      '<p class="gc-description">调整来源、消费者状态和本次意图，查看同一会员系统如何呈现不同首屏。</p>' +
      `<div class="gc-context">
        <div class="gc-context-controls">
          ${labeledSelect('gc-source', 'Source · 消费者来源', journeys.map(({title}) => title))}
          ${labeledSelect('gc-status', 'Status · 当前状态', visitorStatuses)}
          ${labeledSelect('gc-intent', 'Intent · 本次访问意图', visitIntents)}
        </div>
        <div id="gc-context-result" aria-live="polite" aria-atomic="true"></div>
      </div>`)}
    ${group('全域闭环', `
      <div class="gc-origin"><strong>品牌</strong><strong>内容电商</strong><span>并行触达目标人群</span></div>
      ${flow(['线下真实消费场景', '授权 UGC 与 KOS 内容', '目标人群触达', '货架商品转化', '会员关系经营', '消费者洞察与授权内容回流'], '全域经营闭环')}
      <p class="gc-caption">授权内容和消费者洞察回流至品牌与内容电商。外部平台的导流、身份匹配与订单权限须逐入口核验。</p>
    `)}
  `);
}

function firstRepeatModule() {
  return moduleArticle('first-repeat', '首购与二购经营机制', 'First-to-Second Purchase Program',
    '从第一次购买，到第二次主动选择。',
    '消费者阶段决定当前要兑现的价值，真实需求和服务许可决定后续动作的时机。', `
    ${group('四阶段会员价值成长', evidence('已确认战略共识') +
      switcher('gc-stages', '四阶段会员价值成长', valueStages.map(([label, hook]) => `<span>${label}</span><small lang="en">${hook}</small>`), true))}
    ${disclosure('了解入会权益和首购商品分类', `
      <h5>入会权益结构</h5>
      <dl class="gc-reference">${variables([
        ['硬利益', '直接商品回馈、首购权益等。前期验证其获客能力，并衡量实际权益成本。'],
        ['软服务', '品质探索、便捷复购与家庭关爱。'],
      ])}</dl>
      <h5>首购商品分类</h5>
      <p>体验型、家庭日常消费、家庭关爱礼赠。优先验证现有 SKU 是否适配对应任务，再判断新增商品的需要。</p>
    `)}
    ${group('二购三因素', `
      <dl class="gc-moments">${variables([
        ['体验认可', '实际商品体验支持再次选择。'],
        ['真实补货需求', '家中产生下一次购买需要。'],
        ['便利与经济回馈', '熟悉的购买路径、合适规格及合理权益共同降低成本。'],
      ])}</dl>
    `)}
    ${group('二购决策矩阵', evidence('待验证经营假设') +
      '<p class="gc-description">选择一个观察信号，查看经营动作及停止条件。必要售后、消费者明示偏好、触达许可及频控始终优先检查。</p>' +
      switcher('gc-repeat-rules', '二购决策矩阵', repeatRules.map(([label]) => label)))}
    ${group('确定权益＋动态触发', `
      <p class="gc-description">首购后即可看到下次可享权益和条件。临近真实需求窗口，才在明确许可下提供适时提醒。实际有效期清楚呈现。</p>
      <div class="gc-experience-link"><div><h5>Moments 心意账户</h5><p>体验入会礼遇、首购回馈、二购礼遇及长期价值如何随阶段变化。</p></div>
      <a class="button" href="#experience-lab">进入产品体验实验室</a></div>
    `)}
  `);
}

export function conversionModules() {
  return decisionModule() + conversionModule() + firstRepeatModule();
}

function bindSwitcher(root, id, render) {
  const controls = root.querySelector(`#${id}`);
  const output = root.querySelector(`#${id}-result`);
  if (!controls || !output) return;
  const buttons = [...controls.querySelectorAll('[data-gc-choice]')];
  const select = (index) => {
    buttons.forEach((button, key) => button.setAttribute('aria-pressed', String(index === key)));
    output.innerHTML = render(index);
  };
  controls.addEventListener('click', (event) => {
    const button = event.target.closest('[data-gc-choice]');
    if (button) select(Number(button.dataset.gcChoice));
  });
  select(0);
}

function renderJourney(index) {
  const { title, steps, fields } = journeys[index];
  let cursor = 0;
  return `<div class="gc-blueprint">
    <h5>${title}</h5>
    ${flow(steps, `${title}消费者行为路径`)}
    ${blueprintBands.map(([band, labels]) => `<section class="gc-blueprint-band"><h6>${band}</h6>
      <dl>${variables(labels.map(label => [label, fields[cursor++]]))}</dl></section>`).join('')}
  </div>`;
}

export function bindConversionModules(root = document) {
  bindSwitcher(root, 'gc-decision-nodes', (index) => {
    const [label, english, mindset, barrier, response] = decisionNodes[index];
    return `<h5>${label} <span class="gc-translation" lang="en">${english}</span></h5>
      <dl class="gc-result-grid">${variables([['消费者心理', mindset], ['转化障碍', barrier], ['品牌干预', response]])}</dl>`;
  });
  bindSwitcher(root, 'gc-motives', (index) => {
    const [label, barrier, acquire, retain] = motives[index];
    return `<h5>${label}</h5><dl class="gc-result-grid">${variables([['核心阻力', barrier], ['首购抓手', acquire], ['复购抓手', retain]])}</dl>`;
  });
  bindSwitcher(root, 'gc-information', (index) => {
    const [label, glance, clarity, trust] = informationContexts[index];
    return `<h5>${label}</h5><dl class="gc-result-grid">${variables([
      ['3 秒 · 看见差异', glance], ['10 秒 · 理解价值', clarity], ['30 秒 · 建立信任', trust],
    ])}</dl>`;
  });
  bindSwitcher(root, 'gc-journeys', renderJourney);
  bindSwitcher(root, 'gc-stages', (index) => {
    const [label, hook, action, experience, stop] = valueStages[index];
    return `<h5>${label} <span class="gc-translation" lang="en">${hook}</span></h5>
      <dl class="gc-result-grid">${variables([['经营抓手', action], ['消费者感知', experience], ['停止条件', stop]])}</dl>`;
  });
  bindSwitcher(root, 'gc-repeat-rules', (index) => {
    const [label, action, explanation, stop] = repeatRules[index];
    return `<h5>${label} · ${action}</h5>
      <dl class="gc-result-grid gc-result-pair">${variables([['建议经营动作', explanation], ['停止条件', stop]])}</dl>`;
  });

  const contextControls = ['source', 'status', 'intent'].map(name => root.querySelector(`#gc-${name}`));
  const contextResult = root.querySelector('#gc-context-result');
  if (!contextResult || contextControls.some(control => !control)) return;
  const showContext = () => {
    const [source, status, intent] = contextControls.map(control => Number(control.value));
    const [title, copy, action, outcome, stop] = contextualDecision(source, status, intent);
    contextResult.innerHTML = `<div class="gc-context-preview">
      <p class="eyebrow">SUNDaily Membership · 首屏预览</p>
      <h5>${title}</h5><p>${copy}</p>
      <dl>${variables([['Next Best Action · ' + outcome, action], ['停止条件', stop]])}</dl>
    </div>`;
  };
  contextControls.forEach(control => control.addEventListener('change', showContext));
  showContext();
}
