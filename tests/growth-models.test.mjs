import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  conversionFunnel, existingBuyerPath, acquisitionEconomics, rhythmForecast,
  calibrateRhythm, compareExperiment, incrementalEconomics,
} from '../growth-models.js';
import { evaluateSandbox, forecastSandbox } from '../sandbox-state.js';

function closeTo(value, expected) {
  assert.ok(Math.abs(value - expected) < 1e-9, `expected ${expected}, received ${value}`);
}

test('funnel uses conditional rates, retains fractional people and caps sensitivity', () => {
  const model = conversionFunnel(10000, [.6, .4, .35, .45, .25]);
  assert.deepEqual(model.stages.map(s => s.count), [6000, 2400, 840, 378, 94.5]);
  assert.deepEqual(model.stages.map(s => s.lost), [4000, 3600, 1560, 462, 283.5]);
  closeTo(model.fullRate, .00945);
  closeTo(model.sensitivity[0].second, 31.5);
  closeTo(model.sensitivity[0].adoption, 7.875);
  closeTo(model.sensitivity[4].second, 0);
  closeTo(model.sensitivity[4].adoption, 18.9);
  const limits = conversionFunnel(100, [1, .98, 1, 0, 1]);
  closeTo(limits.sensitivity[0].change, 0);
  closeTo(limits.sensitivity[1].change, .02);
  closeTo(limits.sensitivity[3].second, 4.9);
  assert.equal(limits.adoption, 0);
  assert.equal(conversionFunnel(0, [1,1,1,1,1]).fullRate, null);
  assert.equal(conversionFunnel(100, [1,1,1,1,1]).fullRate, 1);
});

test('bought-before-joining has an independent denominator', () => {
  assert.deepEqual(existingBuyerPath(2000, .3, .45, .25),
    {members:600, repeat:270, adoption:67.5, totalRate:.03375});
  assert.equal(existingBuyerPath(0, 1, 1, 1).totalRate, null);
});

test('acquisition economics uses actual buyers for unit costs', () => {
  const model = acquisitionEconomics(10000, 2, .3, 5, .4, 3);
  assert.equal(model.first, 3000);
  assert.equal(model.second, 1200);
  assert.deepEqual(model.components, [20000,15000,3600]);
  assert.equal(model.total, 38600);
  closeTo(model.perSecond, 32.16666666666667);
  assert.equal(acquisitionEconomics(1, 0, 1, 0, 1, 0).perSecond, 0);
  assert.equal(acquisitionEconomics(100, 2, 0, 5, 1, 3).perFirst, null);
  assert.equal(acquisitionEconomics(0, 2, 1, 5, 1, 3).perMember, null);
});

test('depletion, lead-time window and purchase threshold are separate', () => {
  const model = rhythmForecast(20, 0, 2, .25, 2, 4);
  assert.equal(model.duration, 10);
  assert.equal(model.early, 8);
  closeTo(model.late, 40 / 3);
  assert.equal(model.start, 6);
  closeTo(model.end, 34 / 3);
  assert.equal(model.decisionDay, 8);
  assert.deepEqual(rhythmForecast(0, 0, 2, .25, 2, 4),
    {stock:0,duration:0,early:0,late:0,start:0,end:0,decisionDay:0});
  assert.equal(rhythmForecast(20, 0, null, .25, 2, 4), null);
  assert.equal(rhythmForecast(20, 0, undefined, .25, 2, 4), null);
  assert.equal(rhythmForecast(20, 0, 0, .25, 2, 4), null);
  assert.equal(rhythmForecast(20, 0, 2, 1, 2, 4), null);
});

test('calibration accounts for inventory changes and preserves missing values', () => {
  assert.deepEqual(calibrateRhythm(20, 8, 10, 0, 0, 4),
    {rate:1.25,timeLeft:8,duration:16,decisionDay:12.8});
  assert.deepEqual(calibrateRhythm(20, 8, 10, 8, 2, 4),
    {rate:2,timeLeft:5,duration:13,decisionDay:11});
  assert.equal(calibrateRhythm(20, 8, 10, null, 0, 4), null);
  assert.equal(calibrateRhythm(20, 8, 25, 0, 0, 4), null);
  assert.equal(calibrateRhythm(20, 0, 10, 0, 0, 4), null);
  assert.equal(calibrateRhythm(20, 8, 20, 0, 0, 4).timeLeft, null);
  assert.equal(calibrateRhythm(20, 8, 0, 0, 0, 4).timeLeft, 0);
});

test('experiment lifts use treatment size and an effective control denominator', () => {
  const result = compareExperiment(1000, 1000, .3, .38);
  closeTo(result.absolute, .08);
  closeTo(result.relative, .266666666666667);
  closeTo(result.added, 80);
  assert.deepEqual(compareExperiment(120, 100, 0, 1), {absolute:1,relative:null,added:100});
  assert.deepEqual(compareExperiment(0, 100, 0, 1), {absolute:null,relative:null,added:null});
  assert.deepEqual(compareExperiment(120, 100, 1, 0), {absolute:-1,relative:-1,added:-100});
});

test('incremental economics charges benefits for all treated second purchases', () => {
  const result = incrementalEconomics(10000, .3, .38, 15, .3, 1, 2000);
  closeTo(result.added, 800);
  closeTo(result.gross, 12000);
  assert.deepEqual(result.components, [3000,3800,2000]);
  assert.equal(result.cost, 8800);
  closeTo(result.net, 3200);
  closeTo(result.lift, .8 / 14);
  assert.equal(result.breakEven, 'reachable');
  assert.ok(incrementalEconomics(10000, .3, .2, 15, .3, 1, 2000).net < 0);
  assert.deepEqual(incrementalEconomics(100, 0, 1, 15, 0, 0, 0),
    {added:100,gross:1500,components:[0,0,0],cost:0,net:1500,lift:0,room:1,breakEven:'already'});
});

test('break-even guards missing reach, flat margins and lifts beyond capacity', () => {
  assert.equal(incrementalEconomics(0, .3, .38, 15, .3, 1, 2000).breakEven, 'no-targets');
  assert.equal(incrementalEconomics(100, .3, .38, 1, .3, 1, 2000).breakEven, 'no-positive');
  assert.equal(incrementalEconomics(100, .3, .38, 0, 0, 0, 0).breakEven, 'flat');
  assert.equal(incrementalEconomics(100, .3, .38, -1, 0, 0, 0).breakEven, 'no-positive');
  assert.equal(incrementalEconomics(100, .3, .38, 1, .3, 2, 2000).breakEven, 'no-positive');
  assert.equal(incrementalEconomics(100, .9, 1, 15, 20, 1, 2000).breakEven, 'unreachable');
  assert.equal(incrementalEconomics(100, 1, 1, 15, .01, 0, 0).breakEven, 'unreachable');
});

test('shared rule ordering prioritizes service, consent and order fulfillment', () => {
  const state = {day:8, lifecycle:'first', permission:true, frequencyDays:3, sandbox:{marketing:false}};
  const home = {stock:20, stockDay:0, rate:2, authorization:true, barrier:'both'};
  const decision = (overrides, stateOverrides = {}) => {
    const context = {...home, ...overrides};
    return evaluateSandbox({...state, ...stateOverrides}, context, forecastSandbox(context, state.day));
  };
  assert.equal(decision({serviceOpen:true, authorization:false, pendingOrder:true}).kind, 'service');
  assert.equal(decision({authorization:false, pendingOrder:true}).outcome, 'silent');
  assert.equal(decision({pendingOrder:true, plan:'paused'}).title, '等待履约');
  assert.equal(decision({plan:'paused'}).outcome, 'silent');
  assert.equal(decision({}, {lastContact:8}).title, '等待频控');
  assert.equal(decision({stock:null}).outcome, 'silent');
  assert.equal(decision({needDeclined:true}).outcome, 'silent');
  assert.equal(decision({feedback:{value:'bought'}, snoozeUntil:11}).outcome, 'delay');
  assert.match(decision({}).reason, /营销静默.*熟悉的购买渠道/);
  assert.equal(decision({feedback:{value:'needed',day:8}}).title, '提供便捷复购');
});
