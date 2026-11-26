// All rates passed to these models are fractions. Rounding belongs to the view.
const sum = values => values.reduce((total, value) => total + value, 0);
const product = (initial, rates) => rates.reduce((count, rate) => count * rate, initial);
const ratio = (numerator, denominator) => denominator > 0 ? numerator / denominator : null;

export function conversionFunnel(reach, rates) {
  let previous = reach;
  const stages = rates.map(rate => {
    const count = previous * rate;
    const stage = { rate, count, lost: previous - count, cumulative: ratio(count, reach) };
    previous = count;
    return stage;
  });
  const second = stages[3].count;
  const adoption = stages[4].count;
  const sensitivity = rates.map((rate, index) => {
    const adjusted = rates.map((value, key) => key === index ? Math.min(1, value + .05) : value);
    return {
      change: adjusted[index] - rate,
      second: product(reach, adjusted.slice(0, 4)) - second,
      adoption: product(reach, adjusted) - adoption,
    };
  });
  return { stages, sensitivity, second, adoption, fullRate: ratio(adoption, reach) };
}

export function existingBuyerPath(buyers, joinRate, repeatRate, adoptRate) {
  const members = buyers * joinRate;
  const repeat = members * repeatRate;
  return { members, repeat, adoption: repeat * adoptRate, totalRate: ratio(repeat * adoptRate, buyers) };
}

export function acquisitionEconomics(members, welcome, firstRate, firstCost, repeatRate, repeatCost) {
  const first = members * firstRate;
  const second = first * repeatRate;
  const components = [members * welcome, first * firstCost, second * repeatCost];
  const total = sum(components);
  return { first, second, components, total, perMember: ratio(components[0], members),
    perFirst: ratio(total, first), perSecond: ratio(total, second) };
}

export function rhythmForecast(purchased, inventory, daily, volatility, lead, threshold) {
  if (!Number.isFinite(daily) || daily <= 0 || volatility < 0 || volatility >= 1) return null;
  const stock = purchased + inventory;
  const early = stock / (daily * (1 + volatility));
  const late = stock / (daily * (1 - volatility));
  return { stock, duration: stock / daily, early, late, start: Math.max(0, early - lead),
    end: Math.max(0, late - lead), decisionDay: Math.max(0, (stock - threshold) / daily) };
}

export function calibrateRhythm(initial, day, remaining, added, losses, threshold) {
  if ([initial, day, remaining, added, losses].some(value => value == null) || day <= 0) return null;
  const consumed = initial + added - losses - remaining;
  if (consumed < 0) return null;
  const rate = consumed / day;
  const timeLeft = remaining === 0 ? 0 : ratio(remaining, rate);
  return { rate, timeLeft, duration: timeLeft === null ? null : day + timeLeft,
    decisionDay: remaining <= threshold ? day : rate > 0 ? day + (remaining - threshold) / rate : null };
}

export function compareExperiment(controlSize, testSize, controlRate, testRate) {
  if (controlSize <= 0 || testSize <= 0) return { absolute: null, relative: null, added: null };
  const absolute = testRate - controlRate;
  return { absolute, relative: ratio(absolute, controlRate), added: testSize * absolute };
}

export function incrementalEconomics(targets, baseline, treated, margin, contact, reward, fixed) {
  const added = targets * (treated - baseline);
  const gross = added * margin;
  const components = [targets * contact, targets * treated * reward, fixed];
  const cost = sum(components);
  const net = gross - cost;
  const room = 1 - baseline;
  let lift = null;
  let breakEven = 'reachable';
  if (!targets) breakEven = 'no-targets';
  else {
    const baseCost = contact + baseline * reward + fixed / targets;
    if (margin === reward && baseCost === 0) {
      lift = 0;
      breakEven = 'flat';
    } else if (margin <= reward) {
      breakEven = 'no-positive';
    } else {
      lift = baseCost / (margin - reward);
      if (lift > room + Number.EPSILON * 4) breakEven = 'unreachable';
      else if (lift === 0) breakEven = 'already';
    }
  }
  return { added, gross, components, cost, net, lift, room, breakEven };
}
