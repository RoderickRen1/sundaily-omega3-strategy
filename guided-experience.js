import { getConsumerState, subscribeConsumer, resetConsumer } from './consumer-engine.js?v=8';

const exp = '#experience-lab ';
const phone = '#exp-member-phone ';
const action = (name, value) => `${exp}[data-action="${name}"][data-value="${value}"]`;
const go = name => action('page', name);
const one = selector => document.querySelector(selector);
const forms = ['funnel','buyers','acquisition','rhythm','decision','cohort','ab','increment'];
const toWorkbench = {
  funnel:'funnel', acquisition:'acquisition', rhythm:'rhythm', decision:'decision',
  cohort:'cohort', ab:'cohort', increment:'increment',
};
const visible = node => node && !node.closest('[hidden]') && node.getClientRects().length > 0;
const home = state => state.homes[state.activeHome];

const checkpoints = [
  [1,'选择消费者场景','#exp-scenario','选择「包装扫码 → 会员注册」。消费者从包装进入，身份与购买分开核验。','已进入包装扫码场景。', (s,e)=> e?.matches('#exp-scenario') && s.sandbox.id==='scan'],
  [2,'建立模拟会员身份',action('register-demo',''),'点击「模拟注册」，在模拟访客档案中建立会员身份。','后台已识别新会员。消费权益仍待交易验证。',s=>s.sandbox.registered],
  [2,'查看心意账户',`${phone}.exp-bottom-nav [data-value="moments"]`,'点击「礼遇」查看会员可用权益和消费验证入口。','已打开心意账户。',(_s,e)=>e?.matches('[data-action=page][data-value=moments]')],
  [2,'关联模拟订单',go('verify'),'打开「关联模拟订单」。','已进入凭证核验。',(_s,e)=>e?.matches('[data-action=page][data-value=verify]')],
  [2,'验证首次消费',action('verify-demo','pass'),'使用「有效样例凭证」。模拟消费核验后才会识别首购。','已核验首购，库存基线为 20 枚。',s=>s.sandbox.verifiedReceipt],
  [3,'查看 Consumer Passport',`${exp}.exp-desktop-modes [data-value="operator"],${exp}.exp-mobile-modes [data-value="operator"]`,'点击「Operator · 双屏」或「运营后台」，查看档案里的会员身份和首购验证。','会员身份与首购验证均已写入消费者档案。',(_s,e)=>e?.matches('[data-action][data-value=operator]')],
  [4,'打开家庭补给',`${phone}.exp-bottom-nav [data-value="rhythm"]`,'点击手机底栏「补给」。','已打开 Rhythm 家庭补给。',(_s,e)=>e?.matches('[data-action=page][data-value=rhythm]'),'consumer'],
  [4,'开启补货提醒',`${phone}[data-permission="replenishment"]`,'启用「本家庭补货提醒」。当前模拟日耗为 2 枚，预计第 8–10 天为补货窗口。','补货授权已记录。',s=>home(s).authorization],
  [5,'推进虚拟时钟',`${exp}.exp-sandbox-time .exp-actions`,'点击 +3 天两次，再点 +1 天两次。无需等待真实日期。','已经进入预计补货窗口。',s=>s.day>=8],
  [6,'反馈家庭仍有库存',action('edit','stock'),'点击「还有库存，过几天再说」。','已打开库存反馈。',(_s,e)=>e?.matches('[data-action=edit][data-value=stock]')],
  [6,'提交剩余库存',`${phone}[data-form="feedback-stock"]`,'输入剩余 10 枚，点击「提交库存反馈」。观察窗口以及下一步动作。','系统已更新库存，并停止本次提醒。',s=>home(s).feedback?.value==='stock'],
  [7,'确认主动补货需求',action('needed',''),'可以先推进几天。家庭明确需要时，点击「正好需要补货」。','已打开上次商品的快捷复购。',(_s,e)=>e?.matches('[data-action=needed]')],
  [7,'预览模拟结算',`${phone}[data-form="checkout"] [type=submit]`,'保持日常装和示例数量，点击「预览模拟结算」。','已打开订单确认页。',(_s,e)=>e?.matches('[data-form=checkout] [type=submit]')],
  [7,'确认模拟订单',action('confirm-order',''),'点击「确认模拟订单」，当前不会发生支付。','订单已记录，处于待履约状态。',s=>home(s).pendingOrder],
  [7,'完成模拟履约',`${phone}[data-action="fulfill-demo"]`,'完成履约后再核验二购与库存。','已履约，后台已更新消费阶段和库存。',s=>s.sandbox.orders.some(o=>!o.baseline&&o.status==='fulfilled')],
  [8,'打开周期计划设置',`${phone}.exp-bottom-nav [data-value="rhythm"]`,'回到「补给」，继续设置周期购。','已回到家庭补给。',(_s,e)=>e?.matches('[data-action=page][data-value=rhythm]')],
  [8,'设置弹性周期购',action('edit','plan'),'点击「修改计划与规格」或「设置周期购」。','已打开计划设置。',(_s,e)=>e?.matches('[data-action=edit][data-value=plan]')],
  [8,'创建周期计划',`${phone}[data-form="sandbox-plan"] [type=submit]`,'提交计划。后续订单需每期主动确认。','计划已建立，未自动生成订单。',s=>['flex','care'].includes(home(s).plan)],
  [8,'暂停计划',action('sandbox-plan-step','pause'),'点击「暂停计划」，查看提醒停止。','已暂停计划，既有订单记录仍可查看。',s=>home(s).plan==='paused'],
  [9,'切换消费者视角',`${exp}[data-action=mode][data-value=consumer],${exp}[data-action=mobile][data-value=consumer]`,'点击消费者视角，从前台查看家庭的计划状态。','已切换到消费者视角。',(_s,e)=>e?.matches('[data-action][data-value=consumer]')],
  [9,'切换经营后台',`${exp}[data-action=mode][data-value=operator],${exp}[data-action=mobile][data-value=operator]`,'点击运营后台，查看档案及事件。','已切换到运营视角。',(_s,e)=>e?.matches('[data-action][data-value=operator]')],
  [9,'查看智能决策',`${exp}[data-action=mode][data-value=intelligence],${exp}[data-action=mobile][data-value=intelligence]`,'点击智能决策，查看规则命中与停止条件。','已打开规则解释。',(_s,e)=>e?.matches('[data-action][data-value=intelligence]')],
  [10,'进入商业验证实验室','#experience-lab .chapter-next a','点击下一章，探索独立的人群模拟。','已进入商业验证实验室。',(_s,e)=>e?.matches('a[href="#growth-lab"]')],
];
const benchRules = {
  funnel:[['rate3','二购转化率','观察二购人数、周期购人数和敏感性分析。']],
  acquisition:[['firstCost','首购权益成本','比较总权益投入和每位二购会员分摊。']],
  rhythm:[['daily','日均消耗量','比较库存曲线、建议补货窗口与独立反馈校准。']],
  decision:[['stock','家庭库存','切换「仍有库存」，观察下一步动作及停止条件。']],
  cohort:[['dimension','研究维度','查看不同同期群的累计二购率及尚未成熟的空值。']],
  ab:[['testRate','实验组二购率','比较绝对提升和估计实验组增量。']],
  increment:[['treated','干预后二购率','观察增量贡献、总运营成本以及盈亏平衡提升。']],
};
function benchSteps(id){
  const ids=id==='cohort'?['cohort','ab']:[id];
  return ids.flatMap(key=>benchRules[key].map(([field,title,detail])=>{
    const selector=`#wb-${key}-form [name="${field}"]`;
    const after=(s,e,event,startValue)=>e?.matches(selector) && event==='change' && e.value!==startValue &&
      e.value!=='' && e.validity.valid && !one(`#wb-${key}-out .wb-message`);
    return [11,'调整'+title,selector,`修改${title}。${detail}`,'参数已改变，已用实际工作台实时重算。',after];
  }));
}

export const guideEntry = () => `<div class="keynote-guide-entry" id="guided-experience">
  <div><p class="eyebrow">Guided Experience</p><h4>沿真实界面，完成一次经营推演。</h4></div>
  <div class="keynote-actions"><button type="button" class="button button-primary" data-guide-start>开始引导式体验</button>
  <a class="button" href="#experience-lab">自由探索</a><button type="button" class="button" id="keynote-replay" hidden>重新观看影片</button></div>
</div>`;

const resetStep=[12,'重置参数，进入自由探索','[data-guide-reset]','可一次重置本次引导的家庭样例和商业参数。当前网站会回到包装扫码和各工作台演示值。','已恢复演示数据，可自由探索。',(_s,e)=>e?.matches('[data-guide-reset]')];

export function bindGuidedExperience() {
  if(!one('#guided-experience'))return;
  document.body.insertAdjacentHTML('beforeend',`<aside class="guide-coach" aria-label="操作引导" hidden>
    <div class="guide-coach-meta"><span data-guide-progress></span><button class="button button-small" type="button" data-guide-command="exit">退出引导</button></div>
    <h2 data-guide-title></h2><p data-guide-text></p><p data-guide-feedback role="status"></p>
    <div class="guide-coach-actions"><button class="button button-small" type="button" data-guide-command="back">上一步</button>
    <button class="button button-small" type="button" data-guide-command="locate">定位控件</button>
    <button class="button button-small" type="button" data-guide-command="skip">跳过</button>
    <button class="button button-small" type="button" data-guide-reset hidden>重置演示数据</button>
    <button class="button button-primary button-small" type="button" data-guide-command="next" disabled>继续</button></div>
  </aside>`);
  const coach=one('.guide-coach');
  const next=coach.querySelector('[data-guide-command=next]');
  const reset=coach.querySelector('[data-guide-reset]');
  const locate=coach.querySelector('[data-guide-command=locate]');
  let sequence=[], index=0, done=false, mark=null, opening=null, initial=null, standalone=false, finishTarget=null;
  const completed=new Set();

  function target() {
    const selector=sequence[index]?.[2];
    return selector && [...document.querySelectorAll(selector)].find(visible);
  }
  function patchTarget(scroll=false) {
    mark?.classList.remove('guide-spotlight');
    mark=target();
    mark?.classList.add('guide-spotlight');
    locate.disabled=!mark;
    if(scroll&&mark!==reset)mark?.scrollIntoView({block:'center',behavior:'instant'});
  }
  function draw(scroll=true) {
    const [n,title,,detail,,,view]=sequence[index];
    if(view==='consumer') {
      one(`${exp}.exp-mobile-modes [data-value=consumer]`)?.click();
      one(`${exp}.exp-desktop-modes [data-value=operator]`)?.click();
    }
    coach.hidden=false;
    next.disabled=true;
    next.textContent=index===sequence.length-1?'完成引导':'继续';
    coach.querySelector('[data-guide-command=back]').disabled=index===0;
    coach.querySelector('[data-guide-progress]').textContent=standalone?
      `工作台引导 · ${index+1} / ${sequence.length}`:`引导式体验 · ${String(n).padStart(2,'0')} / 12`;
    coach.querySelector('[data-guide-title]').textContent=title;
    coach.querySelector('[data-guide-text]').textContent=detail;
    coach.querySelector('[data-guide-feedback]').textContent='';
    reset.hidden=n!==12;
    done=false;
    patchTarget(scroll);
    initial=mark?.value;
    if(completed.has(index))complete();
  }
  function complete() {
    if(done||coach.hidden)return;
    done=true;
    completed.add(index);
    next.disabled=false;
    coach.querySelector('[data-guide-feedback]').textContent=sequence[index][4];
  }
  function close(restore=true){
    mark?.classList.remove('guide-spotlight');
    coach.hidden=true;sequence=[];mark=null;
    if(restore&&visible(opening)) opening.focus({preventScroll:true});
  }
  function advance(amount,skipped=false){
    if(amount>0 && !done && !skipped)return;
    if(index+amount>=sequence.length){
      const destination=finishTarget;
      close(false);
      if(destination)one(destination)?.scrollIntoView({block:'start'});
      return;
    }
    if(index+amount>=0){index+=amount;draw();}
  }
  function launch(button,id) {
    opening=button;index=0;standalone=Boolean(id);
    completed.clear();
    finishTarget=id?`#lab-${toWorkbench[id]}`:'#experience-lab';
    if(id)sequence=benchSteps(id);
    else{
      resetConsumer();
      const scenario=one('#exp-scenario');
      scenario.value='content';
      scenario.dispatchEvent(new Event('change',{bubbles:true}));
      one(`${exp}.exp-desktop-modes [data-value=operator]`)?.click();
      one(`${exp}.exp-mobile-modes [data-value=consumer]`)?.click();
      sequence=[...checkpoints,...['funnel','acquisition','rhythm','decision','cohort','increment'].flatMap(benchSteps),resetStep];
    }
    draw();
  }
  function evaluate(event) {
    if(coach.hidden || done)return;
    const node=event.target.closest('button, a, select, input, [type=submit]') ?? event.target;
    const expected=sequence[index];
    const anchor=mark;
    if(!anchor || !(anchor===node||anchor.contains(node)||node.matches(expected[2])))return;
    setTimeout(()=>{
      if(coach.hidden||sequence[index]!==expected)return;
      if(expected[5](getConsumerState(),node,event.type,initial)) complete();
      else patchTarget(false);
    });
  }
  document.addEventListener('click', event=>{
    const b=event.target.closest('[data-guide-start],[data-guide-lab],[data-guide-command],[data-guide-reset]');
    if(!b)return;
    if(b.matches('[data-guide-start],[data-guide-lab]')) return launch(b,b.dataset.guideLab);
    if(b.matches('[data-guide-reset]')) {
      forms.forEach(id=>one('#wb-'+id+'-form')?.reset());
      const scenario=one('#exp-scenario');
      scenario.value='scan';scenario.dispatchEvent(new Event('change',{bubbles:true}));
      return complete();
    }
    const command=b.dataset.guideCommand;
    if(command==='exit')close();
    if(command==='back')advance(-1);
    if(command==='next')advance(1);
    if(command==='skip')advance(1,true);
    if(command==='locate'){
      patchTarget(true);
      const focusable=mark?.matches('button,a,input,select,summary')?mark:mark?.querySelector('button,a,input,select,summary');
      focusable?.focus({preventScroll:true});
    }
  });
  document.addEventListener('click',evaluate,true);
  document.addEventListener('change',evaluate,true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!coach.hidden&&!document.querySelector('.presenting'))close();});
  addEventListener('resize',()=>{if(!coach.hidden)patchTarget();});
  subscribeConsumer(()=>{
    if(!coach.hidden)queueMicrotask(()=>{if(!coach.hidden)patchTarget();});
  });
}
