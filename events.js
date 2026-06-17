let EVENT_CATALOG = EVENT_DATA;

function getResourceMax(resource, state) {
  if (resource === "cargo") return state.maxCargo;
  if (resource === "crewHealth" || resource === "shipCondition" || resource === "fuel") return 100;
  return Infinity;
}

function applyEffects(effects, state) {
  const changes = {};
  for (const eff of effects) {
    let delta = typeof eff.delta === "string" ? state[eff.delta] : eff.delta;
    if (eff.multiplier) delta *= eff.multiplier;

    const before = state[eff.resource];
    const max = getResourceMax(eff.resource, state);
    state[eff.resource] = Math.max(0, Math.min(max, before + delta));
    changes[eff.resource] = Math.abs(state[eff.resource] - before);
  }
  return changes;
}

function resolveMessage(template, changes) {
  return template.replace(/\{(\w+)_change\}/g, (_, resource) => {
    return changes[resource] !== undefined ? changes[resource] : 0;
  });
}

function applyOutcome(outcome, state) {
  if (outcome.requires) {
    for (const [res, amount] of Object.entries(outcome.requires)) {
      const actual = res === "cargoSpace" ? (state.maxCargo - state.cargo) : state[res];
      if (actual < amount) {
        const changes = applyEffects(outcome.failEffects || [], state);
        return resolveMessage(outcome.failMessage || "Nothing happened.", changes);
      }
    }
  }
  const changes = applyEffects(outcome.effects, state);
  return resolveMessage(outcome.message, changes);
}

function resolveOutcome(choice) {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const outcome of choice.outcomes) {
    cumulative += outcome.chance;
    if (roll < cumulative) return outcome;
  }
  return choice.outcomes[choice.outcomes.length - 1];
}

function getRandomEvent() {
  return EVENT_CATALOG[Math.floor(Math.random() * EVENT_CATALOG.length)];
}

function shouldEventTrigger() {
  return Math.random() < 0.35;
}
