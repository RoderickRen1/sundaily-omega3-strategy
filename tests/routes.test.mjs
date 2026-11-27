import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {routes, toolIds, v1Ids, v2Groups, anchorRoute, redirectTarget, routeURL} from '../routes.js';

test('strategic workspaces have disjoint, directly served chapters and tools', async()=>{
  assert.equal(v1Ids.length,10);
  assert.equal(toolIds.length,6);
  assert.equal(v2Groups.filter(group=>['conversion','replenishment','intelligence'].includes(group.key)).flatMap(group=>group.ids).length,6);
  assert.equal(new Set(Object.values(routes).map(route=>route.path)).size,Object.keys(routes).length);
  for(const {id,path} of Object.values(routes)){
    const html=await readFile(new URL('../'+(path?path+'/':'')+'index.html',import.meta.url),'utf8');
    assert.match(html,new RegExp('data-page="'+id+'"'));
  }
});
test('legacy shares retain nested fragments and the original query',()=>{
  for(const [anchor,route] of Object.entries({
    'system-4':'system','case-library':'benchmark','current-stage':'roadmap','launch-film':'launch-film-section',
    'growth-validation':'growth-console','scenario-result':'simulator','wb-ab-form':'lab-cohort',
    'rhythm-feedback':'rhythm-research','exp-console':'experience-lab',
  })){
    assert.equal(anchorRoute(anchor),route);
    assert.equal(redirectTarget('top','#'+anchor,'?v=9'),routeURL(route,anchor,'?v=9'));
    assert.equal(redirectTarget(route,'#'+anchor),null);
  }
  assert.equal(redirectTarget('top','#summary'),routeURL('overview'));
  assert.equal(redirectTarget('top','#missing'),null);
});
