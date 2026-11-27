// A single route table drives static pages, navigation, and old share links.
const entries = [
  ['top','','首页',''],
  ['overview','v1','战略总览','v1'],
  ['why','v1/opportunity','战略背景与机会','v1'],
  ['benchmark','v1/benchmark','行业对标研究','v1'],
  ['strategy','v1/positioning','会员战略定位','v1'],
  ['value','v1/value','会员价值体系','v1'],
  ['system','v1/systems','六大运营体系','v1'],
  ['growth','v1/growth','增长机制','v1'],
  ['business','v1/business','商业经营模式','v1'],
  ['organization','v1/organization','组织与资源配置','v1'],
  ['roadmap','v1/roadmap','战略发展路线图','v1'],
  ['simulator','v1/business/simulator','商业价值模拟器','v1','business'],
  ['growth-strategy','v2','升级总览','v2','overview'],
  ['launch-film-section','v2/launch','产品发布影片与引导','v2','overview'],
  ['decision','v2/purchase-decision','消费者购买决策研究','v2','conversion'],
  ['conversion','v2/conversion-journey','全域转化链路设计','v2','conversion'],
  ['first-repeat','v2/first-repeat','首购与二购经营机制','v2','conversion'],
  ['rhythm-research','v2/household-cycle','家庭消费周期研究','v2','replenishment'],
  ['rhythm-product','v2/replenishment-product','周期购产品与 UX 设计','v2','replenishment'],
  ['consumer-intelligence','v2/consumer-intelligence','数据触发与转化验证','v2','intelligence'],
  ['experience-lab','v2/product-lab','产品体验实验室','v2','labs'],
  ['growth-lab','v2/growth-lab','商业验证实验室','v2','labs'],
  ['lab-funnel','v2/growth-lab/funnel','转化漏斗','v2','tools'],
  ['lab-acquisition','v2/growth-lab/acquisition','权益成本','v2','tools'],
  ['lab-rhythm','v2/growth-lab/rhythm','家庭消费预测','v2','tools'],
  ['lab-decision','v2/growth-lab/decision','经营决策','v2','tools'],
  ['lab-cohort','v2/growth-lab/cohort','同期群与实验','v2','tools'],
  ['lab-increment','v2/growth-lab/increment','增量商业价值','v2','tools'],
  ['growth-console','v2/growth-lab/console','联动后台与既有模型','v2','tools'],
];

export const routes = Object.fromEntries(entries.map(([id, path, label, version, group]) => [id, {id, path, label, version, group}]));
export const v1Ids = entries.filter(row=>row[3]==='v1' && !row[4]).map(([id])=>id);
export const v2Groups = [
  ['overview','OVERVIEW','升级总览'],
  ['conversion','CONVERSION ENGINE','转化引擎'],
  ['replenishment','REPLENISHMENT ENGINE','周期购引擎'],
  ['intelligence','CONSUMER INTELLIGENCE','智能经营中枢'],
  ['labs','EXPERIENCE LABS','体验与验证'],
].map(([key,english,title])=>({key,english,title,ids:entries.filter(row=>row[4]===key).map(([id])=>id)}));
export const toolIds = entries.filter(([id])=>id.startsWith('lab-')).map(([id])=>id);
export const legacyPaths = {
  strategy:'overview', 'strategy-v1':'overview', 'growth-strategy':'growth-strategy',
  'experience-lab':'experience-lab', 'product-lab':'experience-lab', 'growth-lab':'growth-lab',
  launch:'launch-film-section',
};

export const siteBase = new URL('./',import.meta.url);
export function routeURL(id, fragment='', search='') {
  const route=routes[id] ?? routes.top;
  return siteBase.pathname+(route.path?route.path+'/':'')+search+(fragment?'#'+encodeURIComponent(fragment):'');
}
export const assetURL = file => new URL('assets/'+file,siteBase).pathname;
const anchorGroups = {
  'overview':'strategy-v1 heading-strategy-v1 heading-overview summary heading-summary',
  'growth-strategy':'heading-growth-strategy engines v2-engines-title v2-engine-detail',
  'launch-film-section':'hero-film-link v2-film-title launch-film launch-film-status guided-experience keynote-replay',
  'why':'equity-loop equity-note',
  'benchmark':'case-library research-filters research-count benchmark-cards',
  'strategy':'family-orbit family-info',
  'value':'architecture-choice architecture-panel phone-choice phone-state',
  'system':'system-instruction system-explorer systems-map system-brief system-content lifecycle-loop lifecycle-note migration-note passport-map passport-note innovation-loop innovation-note ecosystem-orbit ecosystem-note',
  'growth':'flywheel-explorer flywheel-choice flywheel-panel active-wheel wheel-current wheel-position wheel-step wheel-story wheel-prev play-flywheel wheel-next',
  'organization':'model-choice model-panel org-loop org-note',
  'roadmap':'stage-choice stage-panel current-stage',
  'simulator':'scenario scenario-zero scenario-result scenario-results scenario-chart scenario-bars scenario-announcement',
  'rhythm-research':'rhythm-research-title rhythm-curve-caption rhythm-curve-title rhythm-curve-line rhythm-curve-points rhythm-profile-description rhythm-feedback rhythm-feedback-home rhythm-feedback-window rhythm-feedback-result',
  'rhythm-product':'rhythm-product-title v2-service-preview',
  'consumer-intelligence':'consumer-intelligence-title v2-intelligence-step v2-consumer-dimensions v2-current-decision',
  'growth-lab':'heading-growth-lab growth-workbenches lab-directory',
  'growth-console':'growth-validation',
  'lab-cohort':'growth-research',
};
const anchors=Object.fromEntries(Object.entries(anchorGroups).flatMap(([id,children])=>children.split(' ').map(anchor=>[anchor,id])));
export function anchorRoute(anchor) {
  if(Object.hasOwn(routes,anchor))return anchor;
  if(Object.hasOwn(anchors,anchor))return anchors[anchor];
  if(anchor.startsWith('heading-'))return anchorRoute(anchor.slice(8));
  if(anchor.startsWith('arrow-'))return anchorRoute(anchor.slice(6));
  if(/^system-[1-6]$/.test(anchor))return 'system';
  if(/^(active-wheel|panorama-)/.test(anchor))return 'growth';
  if(anchor.startsWith('assumption-'))return 'simulator';
  if(anchor.startsWith('exp-'))return 'experience-lab';
  if(anchor.startsWith('gl-'))return 'growth-console';
  if(/^gc-(decision|motives|information)/.test(anchor))return 'decision';
  if(/^gc-(journeys|source|status|intent|context)/.test(anchor))return 'conversion';
  if(/^gc-(stages|repeat)/.test(anchor))return 'first-repeat';
  if(/^wb-(ab|cohort)-/.test(anchor))return 'lab-cohort';
  if(/^wb-buyers-/.test(anchor))return 'lab-funnel';
  const tool=anchor.match(/^(?:wb|lab)-(funnel|acquisition|rhythm|decision|cohort|increment)-/);
  return tool ? 'lab-'+tool[1] : null;
}

const topAliases = new Set(['summary','strategy-v1','hero-film-link']);
export function anchorURL(anchor, search='') {
  const id=anchorRoute(anchor);
  return id ? routeURL(id, anchor===id||topAliases.has(anchor)?'':anchor, search) : null;
}
export function redirectTarget(currentId, hash, search='') {
  const anchor=hash.replace(/^#/,'');
  const id=anchorRoute(anchor);
  return id&&id!==currentId ? anchorURL(anchor,search) : null;
}
