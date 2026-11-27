import { routes, v1Ids, v2Groups, toolIds, routeURL, assetURL, anchorURL, redirectTarget } from './routes.js?v=1';

export const page = routes[document.documentElement.dataset.page] ?? routes.top;
export const productPages = ['experience-lab','growth-lab','growth-console',...toolIds];
export const presentationIds = ['top',...v1Ids,'simulator',...v2Groups.flatMap(g=>g.ids), ...toolIds,'growth-console'];

export function followLegacyFragment() {
  const next = redirectTarget(page.id,location.hash,location.search);
  if(next) location.replace(next);
  return Boolean(next);
}
function active(id) {
  const selected = page.id===id || (id==='business' && page.id==='simulator') ||
    (id==='growth-lab' && page.group==='tools');
  return selected?' aria-current="page"':'';
}
const labelLink = id => `<a href="${routeURL(id)}"${active(id)}>${routes[id].label}</a>`;

function workspaceDirectory() {
  if(page.version==='v1') return `<nav class="workspace-directory" aria-label="V1.0 战略章节">
    <h2>V1.0 <span>战略体系</span></h2>
    <ol>${v1Ids.map((id,index)=>`<li><a href="${routeURL(id)}"${active(id)}><small>${String(index+1).padStart(2,'0')}</small><span>${routes[id].label}</span></a></li>`).join('')}</ol>
  </nav>`;
  return `<nav class="workspace-directory" aria-label="V2.0 经营章节"><h2>V2.0 <span>经营深化</span></h2>
    ${v2Groups.map(group=>`<section><h3><small lang="en">${group.english}</small>${group.title}</h3><ul>${group.ids.map(id=>`<li>${labelLink(id)}</li>`).join('')}</ul></section>`).join('')}
  </nav>`;
}
function breadcrumb() {
  const base = page.version==='v1'?'overview':'growth-strategy';
  const nodes = [['首页','top']];
  if(page.id!==base) nodes.push([page.version==='v1'?'V1.0':'V2.0',base]);
  if(page.group==='tools') nodes.push(['商业验证实验室','growth-lab']);
  else if(page.id==='simulator') nodes.push(['商业经营模式','business']);
  else if(['conversion','replenishment','intelligence','labs'].includes(page.group)) {
    const group=v2Groups.find(item=>item.key===page.group);
    nodes.push([group.title,null]);
  }
  return `<nav class="workspace-breadcrumb" aria-label="当前位置"><ol>${nodes.map(([label,id])=>
    `<li>${id?`<a href="${routeURL(id)}">${label}</a>`:`<span>${label}</span>`}</li>`).join('')}<li aria-current="page">${page.id===base?page.version.toUpperCase()+'.0 '+page.label:page.label}</li></ol></nav>`;
}
function continuation() {
  if(page.id==='top')return '';
  const list = page.group==='tools' ? [...toolIds,'growth-console'] : page.version==='v1' ? v1Ids : v2Groups.flatMap(g=>g.ids);
  const part=list.indexOf(page.id);
  const version = page.version==='v1'?'overview':'growth-strategy';
  const pager = (id,label) => id ? `<a href="${routeURL(id)}"><span>${label}</span><strong>${routes[id].label}</strong></a>`:'';
  return `<nav class="workspace-pager" aria-label="章节阅读导航">${part>=0?pager(list[part-1],'上一章'):''}
    ${page.id!==version?`<a class="pager-overview" href="${routeURL(version)}"><span>${page.version.toUpperCase()}.0</span><strong>返回总览</strong></a>`:''}
    ${part>=0?pager(list[part+1],'下一章'):''}</nav>`;
}

export function renderPlatform(content) {
  document.body.dataset.workspace=page.version||'portal';
  const nav=document.querySelector('#nav');
  const versionIndex = page.version==='v1'?1:page.version==='v2'?2:0;
  nav.children[versionIndex].setAttribute('aria-current','page');
  const isLab=productPages.includes(page.id);
  if(page.version) {
    const html = workspaceDirectory();
    document.querySelector('#mobile-nav').innerHTML=html;
    document.querySelector('#menu-button').hidden=false;
    if(!isLab) {
      const side=document.querySelector('#workspace-nav');
      side.innerHTML=html;
      side.hidden=false;
    }
  }
  document.querySelector('#platform').classList.toggle('platform-wide',isLab || !page.version);
  document.querySelector('#chapters').innerHTML=`${page.version?breadcrumb():''}${content}${continuation()}`;
}

export function normalizeLinks(root=document) {
  const links = root instanceof HTMLAnchorElement && root.getAttribute('href')?.startsWith('#')
    ? [root] : root.querySelectorAll?.('a[href^="#"]') ?? [];
  for(const link of links){
    const id=link.getAttribute('href').slice(1);
    if(!id)continue;
    // Keep native in-page fragments, including the skip link and chapter tabs.
    if(document.getElementById(id)?.closest('main'))continue;
    const destination = anchorURL(id);
    if(destination) link.setAttribute('href',destination);
  }
}

export function toolNavigation() {
  return `<nav class="tool-navigation" aria-label="商业验证工作台"><a href="${routeURL('growth-lab')}"${page.id==='growth-lab'?' aria-current="page"':''}>工作台目录</a>
    ${toolIds.map(labelLink).join('')}${page.id==='growth-console'?labelLink('growth-console'):''}</nav>`;
}

export function portal() {
  return `<section id="top" class="platform-portal" aria-labelledby="portal-title">
    <div class="portal-inner">
      <div class="portal-copy">
        <p class="eyebrow">SUNDAILY OMEGA-3</p>
        <h1 id="portal-title">SUNDaily<br>Membership.</h1>
        <p class="portal-title-cn">圣迪乐消费者经营战略平台</p>
        <p class="portal-mission">经营一人，辐射一家。</p>
      </div>
      <figure class="portal-art" aria-label="象牙色鸡蛋雕塑和橙金轨道"><img width="1280" height="1280" src="${assetURL('hero-egg.jpg')}" alt="">
        <svg viewBox="0 0 600 480" aria-hidden="true"><ellipse cx="300" cy="235" rx="249" ry="96" transform="rotate(-21 300 235)"/><ellipse cx="300" cy="244" rx="290" ry="132" transform="rotate(-23 300 244)"/><circle cx="515" cy="142" r="3.5"/></svg>
      </figure>
      <nav class="portal-versions" aria-label="选择战略工作空间">
        <a href="${routeURL('overview')}"><div><span class="portal-version">V1.0</span><small lang="en">Strategy Foundation</small></div>
          <h2>会员运营战略体系</h2><p>战略定位、会员价值、六大运营体系、商业模式与组织建设。</p><strong>探索完整战略 <span aria-hidden="true">↗</span></strong></a>
        <a href="${routeURL('growth-strategy')}"><div><span class="portal-version">V2.0</span><small lang="en">Growth Intelligence</small></div>
          <h2>转化与周期购深化</h2><p>在 V1.0 基础上，深化消费者转化、动态补货、产品体验与商业验证。</p><strong>探索经营产品 <span aria-hidden="true">↗</span></strong></a>
      </nav>
    </div>
  </section>`;
}
