import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideNextAction, dispatchConsumer, estimateWindow } from '../consumer-engine.js';

const start = (id) => dispatchConsumer('sandbox-start', {id});
const apply = dispatchConsumer;

test('visitors start with no marketing or household reminder permission', () => {
  const state = start('scan');
  assert.equal(state.sandbox.marketing, false);
  assert.equal(state.homes.mine.authorization, false);
  assert.equal(decideNextAction(state).outcome, 'silent');
  assert.equal(apply('register-demo').sandbox.marketing, false);
});

test('ignoring an estimated window suppresses repeats in that same window', () => {
  start('repeat');
  apply('sandbox-permission', {enabled:true, value:'replenishment'});
  const withinWindow = apply('advance', {days:8});
  assert.equal(decideNextAction(withinWindow).title, '轻量补货询问');
  const ignored = apply('sandbox-feedback', {value:'ignored', days:2});
  assert.equal(decideNextAction(ignored).title, '结束本次提醒');
  const later = apply('advance', {days:2});
  assert.equal(estimateWindow(later.homes.mine, later.day).end, 10);
  assert.equal(decideNextAction(later).outcome, 'delay');
  const freshSignal = apply('sandbox-feedback', {value:'needed'});
  assert.equal(decideNextAction(freshSignal).title, '提供便捷复购');
});

test('external purchase with unknown starting inventory leaves the estimate unknown', () => {
  const baseline = start('scan');
  const state = apply('sandbox-feedback', {value:'bought', stock:10, brand:'other'});
  assert.equal(state.homes.mine.stock, null);
  assert.equal(state.verifiedPurchases, baseline.verifiedPurchases);
  assert.equal(state.sandbox.orders.length, 0);
  assert.equal(estimateWindow(state.homes.mine, state.day).start, null);
});

test('legacy refund and phone cancellation share the order and preserve accounting and inventory', () => {
  const baseline = start('repeat');
  const orderState = apply('order-demo', {product:'Omega-3 日常装',quantity:20});
  const order = orderState.sandbox.orders[0];
  const forced = apply('set-policy', {pendingOrder:false});
  assert.equal(forced.pendingOrder, true);
  assert.equal(apply('sandbox-order-cancel', {value:order.id,home:'parents'}).sandbox.orders[0].status, 'paid');
  const returned = apply('event', {type:'refund'});
  assert.equal(returned.sandbox.orders[0].status, 'cancelled');
  assert.equal(returned.verifiedPurchases, baseline.verifiedPurchases);
  assert.equal(returned.pendingOrder, false);
  assert.equal(returned.homes.mine.stock, baseline.homes.mine.stock);
  assert.equal(returned.events[0].label, 'order_refunded_demo');
  assert.equal(apply('fulfill-demo', {value:order.id}).sandbox.eventSerial, returned.sandbox.eventSerial);
  assert.equal(apply('event', {type:'refund'}).sandbox.eventSerial, returned.sandbox.eventSerial);
});

test('plan editing preserves confirmation date unless its cadence changes', () => {
  start('cycle');
  const original = apply('sandbox-plan', {cadence:7, product:'Omega-3 日常装', quantity:20});
  assert.equal(original.homes.mine.nextConfirm, 7);
  apply('advance', {days:3});
  const edited = apply('sandbox-plan', {cadence:7, product:'Omega-3 日常装', quantity:18});
  assert.equal(edited.homes.mine.nextConfirm, 7);
  const changed = apply('sandbox-plan', {cadence:14, product:'Omega-3 日常装', quantity:18});
  assert.equal(changed.homes.mine.nextConfirm, 17);
});

test('cycle confirmation refuses premature, paused or stale actions', () => {
  const baseline = start('cycle');
  apply('sandbox-plan', {cadence:7});
  const cycle = {cycle:true, product:'Omega-3 日常装'};
  assert.equal(apply('order-demo', cycle).sandbox.orders.length, baseline.sandbox.orders.length);
  apply('advance', {days:7});
  apply('sandbox-plan-step', {value:'pause'});
  assert.equal(apply('order-demo', cycle).sandbox.orders.length, baseline.sandbox.orders.length);
  apply('sandbox-plan-step', {value:'resume'});
  apply('advance', {days:7});
  assert.equal(apply('order-demo', cycle).sandbox.orders.length, baseline.sandbox.orders.length + 1);
  assert.equal(apply('order-demo', cycle).sandbox.orders.length, baseline.sandbox.orders.length + 1);
});

test('an open service case wins after opt-out and must be resolved explicitly', () => {
  start('exception');
  apply('sandbox-permission', {value:'marketing', enabled:false});
  apply('sandbox-permission', {value:'replenishment', enabled:false});
  apply('sandbox-service', {value:'open'});
  const held = apply('set-policy', {serviceOpen:false});
  assert.equal(held.homes.mine.serviceCase.status, 'open');
  assert.equal(decideNextAction(held).title, '优先处理售后');
  const resolved = apply('sandbox-service', {value:'resolve'});
  assert.equal(resolved.homes.mine.serviceCase.status, 'resolved');
  assert.equal(decideNextAction(resolved).outcome, 'silent');
});
