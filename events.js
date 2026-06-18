let EVENT_CATALOG = EVENT_DATA;

function resolveOutcome(choice) {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const outcome of choice.outcomes) {
    cumulative += outcome.chance;
    if (roll < cumulative) return outcome;
  }
  return choice.outcomes[choice.outcomes.length - 1];
}

function applyEventOutcome(outcome, state) {
  let message = outcome.message;
  const fx = outcome.effects || {};

  if (fx.delay) {
    state.travelDaysRemaining = Math.max(0, state.travelDaysRemaining + fx.delay);
  }

  if (fx.cargoLoss && fx.cargoLoss > 0) {
    const types = Object.keys(state.cargo).filter(k => state.cargo[k] > 0);
    if (types.length > 0) {
      const type = types[Math.floor(Math.random() * types.length)];
      const actual = Math.min(fx.cargoLoss, state.cargo[type]);
      state.cargo[type] -= actual;
      if (state.cargo[type] <= 0) delete state.cargo[type];
      message = message.replace("{lost}", `${actual}t ${SUPPLY_TYPES[type].name}`);
    } else {
      message = message.replace("{lost}", "nothing (hold empty)");
    }
  }

  return message;
}

function shouldEventTrigger() {
  return Math.random() < 0.10;
}

function shouldPortResupply() {
  return Math.random() < 0.50;
}

function getRandomEvent() {
  return EVENT_CATALOG[Math.floor(Math.random() * EVENT_CATALOG.length)];
}
