/* ============================================================
   events.js — Random event definitions and selection logic
   ============================================================
   Each event has:
     - name:        display title
     - description: flavor text shown in the modal
     - type:        "bad" | "good" | "neutral" (controls log styling)
     - choices:     array of { text, effect } — effect is a function
                    receiving the game state and returning a log message
   ============================================================ */

const EVENT_CATALOG = [

  // --- Dangerous events ---
  {
    name: "Storm!",
    description: "Dark clouds roll in and waves crash over the deck. The crew braces for impact.",
    type: "bad",
    choices: [
      {
        text: "Ride it out",
        effect(state) {
          state.shipCondition = Math.max(0, state.shipCondition - 15);
          state.crewHealth    = Math.max(0, state.crewHealth - 5);
          return "The storm battered the hull and shook the crew.";
        },
      },
      {
        text: "Take shelter in cove (-1 day progress)",
        effect(state) {
          state.distanceTraveled = Math.max(0, state.distanceTraveled - state.speedPerTick);
          state.food = Math.max(0, state.food - 3);
          return "You sheltered in a cove, losing a day but saving the ship.";
        },
      },
    ],
  },

  {
    name: "Pirates!",
    description: "A black-flagged vessel approaches fast off the starboard bow.",
    type: "bad",
    choices: [
      {
        text: "Fight them off",
        effect(state) {
          state.crewHealth    = Math.max(0, state.crewHealth - 10);
          state.shipCondition = Math.max(0, state.shipCondition - 10);
          state.gold += 20;
          return "You defeated the pirates and seized 20 gold, but took damage.";
        },
      },
      {
        text: "Surrender cargo",
        effect(state) {
          const lost = Math.min(state.gold, 15);
          state.gold -= lost;
          state.food = Math.max(0, state.food - 10);
          return `The pirates took ${lost} gold and 10 food.`;
        },
      },
      {
        text: "Try to outrun them",
        effect(state) {
          if (Math.random() > 0.5) {
            state.shipCondition = Math.max(0, state.shipCondition - 5);
            return "You escaped! The sails took minor damage.";
          }
          state.gold = Math.max(0, state.gold - 20);
          state.crewHealth = Math.max(0, state.crewHealth - 10);
          return "They caught you. Lost 20 gold and crew morale dropped.";
        },
      },
    ],
  },

  {
    name: "Sickness",
    description: "Fever spreads below deck. Sailors are falling ill one by one.",
    type: "bad",
    choices: [
      {
        text: "Use medicine (costs 10 gold)",
        effect(state) {
          if (state.gold >= 10) {
            state.gold -= 10;
            state.crewHealth = Math.max(0, state.crewHealth - 5);
            return "Medicine slowed the spread. Only minor losses.";
          }
          state.crewHealth = Math.max(0, state.crewHealth - 20);
          return "You couldn't afford medicine. The sickness ravaged the crew.";
        },
      },
      {
        text: "Quarantine the sick",
        effect(state) {
          state.crewHealth = Math.max(0, state.crewHealth - 12);
          return "Quarantine contained it, but many suffered.";
        },
      },
    ],
  },

  // --- Positive events ---
  {
    name: "Favorable Winds",
    description: "Strong tailwinds fill your sails. The ship surges forward!",
    type: "good",
    choices: [
      {
        text: "Full speed ahead",
        effect(state) {
          state.distanceTraveled += state.speedPerTick;
          return "You covered extra distance today!";
        },
      },
    ],
  },

  {
    name: "Floating Cargo",
    description: "Your lookout spots barrels floating on the water — salvage from a wreck.",
    type: "good",
    choices: [
      {
        text: "Salvage it",
        effect(state) {
          state.food += 15;
          state.gold += 5;
          return "Recovered 15 food and 5 gold from the wreckage.";
        },
      },
      {
        text: "Leave it (could be cursed)",
        effect(state) {
          return "The superstitious crew sighs with relief.";
        },
      },
    ],
  },

  {
    name: "Calm Seas",
    description: "The ocean is perfectly still. The crew rests and repairs.",
    type: "good",
    choices: [
      {
        text: "Rest and repair",
        effect(state) {
          state.crewHealth    = Math.min(100, state.crewHealth + 5);
          state.shipCondition = Math.min(100, state.shipCondition + 10);
          return "A peaceful day. Ship repaired, crew rested.";
        },
      },
    ],
  },

  // --- Neutral events ---
  {
    name: "Merchant Ship",
    description: "A friendly merchant vessel hails you, offering to trade.",
    type: "neutral",
    choices: [
      {
        text: "Buy food (10 gold)",
        effect(state) {
          if (state.gold >= 10) {
            state.gold -= 10;
            state.food += 20;
            return "Bought 20 food for 10 gold.";
          }
          return "Not enough gold to trade.";
        },
      },
      {
        text: "Buy repairs (15 gold)",
        effect(state) {
          if (state.gold >= 15) {
            state.gold -= 15;
            state.shipCondition = Math.min(100, state.shipCondition + 20);
            return "Bought hull repairs for 15 gold.";
          }
          return "Not enough gold for repairs.";
        },
      },
      {
        text: "Decline",
        effect(state) {
          return "You wave them off and continue sailing.";
        },
      },
    ],
  },
];

/* Pick a random event from the catalog */
function getRandomEvent() {
  const index = Math.floor(Math.random() * EVENT_CATALOG.length);
  return EVENT_CATALOG[index];
}

/* Determine whether an event triggers this tick (roughly 40% chance) */
function shouldEventTrigger() {
  return Math.random() < 0.4;
}
