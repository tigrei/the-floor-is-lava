# Sea Trail — First Island Chain: Full Application Context

## Overview

**Sea Trail** is a browser-based, single-page strategy game set in a Gray Zone conflict across the First Island Chain (Philippine Sea, South China Sea, Taiwan Strait). The player commands a logistics/transport vessel delivering Combat Engineer mission packages (RADR airfield repair, ROWPU water purification, coastal fortification) to contested island garrisons before they fall to enemy forces.

The game is built with vanilla HTML/CSS/JavaScript (no frameworks, no build step). Open `index.html` directly in a browser to play.

---

## Architecture

```
the-floor-is-lava/
├── index.html          — App shell: header, canvas map, sidebar, modal overlay
├── style.css           — All styling, CSS variables, dark naval theme
├── events-data.js      — Event catalog (pure data, JSON-structured JS array)
├── events.js           — Event engine: effect application, outcome resolution, RNG
├── map.js              — GameMap class: port definitions, canvas rendering, ship interpolation
├── ui.js               — UI class: resource display, event/port modals, ops log, game over
├── game.js             — Game class: state machine, tick loop, auto-sail, domino effect
└── data_master/        — Reference data (ships & cargo specs, not yet integrated into gameplay)
    ├── ships_updated.json
    ├── cargo.json
    ├── Data Guide.txt
    └── cargo_schema.txt
```

**Load order** (script tags in index.html):
`events-data.js` → `events.js` → `map.js` → `ui.js` → `game.js`

All classes/functions are globals. No modules, no bundler. Game boots on `DOMContentLoaded`.

---

## Game State

```js
// game.js — Game.constructor()
this.state = {
  day:               1,      // Current day (increments each tick)
  funds:             50,     // Operational budget ($), spent at ports
  deterrence:        0,      // Score metric, earned by completing missions
  crewHealth:        100,    // 0–100, crew dies at 0
  shipCondition:     100,    // 0–100, ship sinks at 0
  cargo:             80,     // Current cargo in tons
  maxCargo:          100,    // Cargo capacity
  fuel:              80,     // 0–100, ship drifts at 0
  distanceTraveled:  0,      // Cumulative distance
  totalRouteDistance: 1000,  // Total route length
  speedPerTick:      25,     // Distance per day
  destinationName:   "Kaohsiung",
  gameOver:          false,
};
```

**Internal flags:**
- `_sailing` — whether auto-sail is active
- `_tickTimer` — setTimeout handle for next tick
- `_busy` — prevents overlapping ticks during modal display
- `_visitedPorts` — Set of port indices already visited
- `_eventCooldown` — minimum 2 ticks between events
- `_dangerLevel` — increases +0.10 per fallen island (raises event probability)

---

## Tick Loop (800ms interval)

Each tick in `game.js._doTick()`:

1. **Day advances** — `state.day++`
2. **Fuel & movement** — If fuel > 0: consume 2 fuel, travel `speedPerTick`. If fuel = 0: drift at 30% speed, crew health drops 5/tick.
3. **Hull penalty** — If ship condition < 20: crew health drops 2/tick.
4. **Deadline check** — `_checkDeadlines()`: any contested port past its deadline with incomplete delivery flips to "fallen", danger level increases.
5. **Render** — Update map canvas and sidebar.
6. **Port arrival** — If ship crosses a port's distance threshold:
   - **Fallen port**: Log warning, skip. Ship continues sailing.
   - **Final port (Kaohsiung)**: Allow mission delivery, then game over (win).
   - **Other port**: Stop sailing, show port modal, resume sailing after modal closes.
7. **Random event** — If no event cooldown and `Math.random() < (0.35 + dangerLevel)`: stop sailing, show event modal, resume after.
8. **Game over check** — Crew health ≤ 0 or ship condition ≤ 0.
9. **Schedule next tick** — If still sailing and not game over.

---

## Port System

### Port Definitions (map.js)

7 ports along the route from Guam to Kaohsiung:

| Port | Coords (nx, ny) | State | Mission |
|------|-----------------|-------|---------|
| Guam | (0.88, 0.48) | secure | — |
| Palau | (0.73, 0.72) | secure | — |
| Davao | (0.50, 0.85) | secure | — |
| Palawan | (0.32, 0.65) | contested | RADR — Airfield Repair |
| Subic Bay | (0.38, 0.40) | secure | — |
| Batanes | (0.42, 0.18) | contested | ROWPU — Water Security |
| Kaohsiung | (0.28, 0.08) | contested | Coastal Fortification |

### Port States

- **Secure** (blue `#4fc3f7`): Allied hub. Cheap resupply ($10/action). Can load additional cargo ($15/10t).
- **Contested** (amber `#ffd54f`): Has a mission with deadline. Can deliver cargo for deterrence + funds. Expensive resupply ($15/action). No cargo loading.
- **Fallen** (red `#ef5350`): Overrun. Ship cannot dock — sails past with a log warning.

### Mission Structure

Each contested port has:
```js
mission: {
  name: "RADR — Airfield Repair",
  briefing: "Palawan's airstrip took a hit...",
  cargoRequired: 20,   // tons needed for full completion
  reward: 40,          // total deterrence points
  fundsReward: 20,     // total funds earned
  deadline: 25,        // day by which delivery must happen
  delivered: 0,        // tons delivered so far (mutable)
}
```

Delivery is done 10 tons at a time at the port modal. Proportional deterrence/funds awarded per delivery. When `delivered >= cargoRequired`, port state flips to "secure".

### Domino Effect

When `state.day > mission.deadline` and `delivered < cargoRequired`:
- Port state → "fallen"
- `_dangerLevel += 0.10` (events trigger more often)
- Log: "[Port] has FALLEN. [Mission] failed. Enemy interdiction range expanding."

### Port Modal Trading

**Secure ports:**
- Resupply Fuel +10 → $10
- Repair Hull +20 → $10
- Rest Crew +20 → $10
- Load 10t Cargo → $15

**Contested ports:**
- Deliver Xt Cargo → +Y Det, +$Z (mission-specific)
- Resupply Fuel +10 → $15
- Repair Hull +20 → $15
- Rest Crew +20 → $15

---

## Event System

### Data Format (events-data.js)

Events are a JS array of objects. Each event has:

```js
{
  "name": "Maritime Militia",
  "description": "A swarm of 'fishing vessels'...",
  "type": "bad",          // "bad" | "good" | "neutral" — controls log styling
  "choices": [
    {
      "text": "Alter course",
      "outcomes": [
        {
          "chance": 70,         // percentage (all outcomes in a choice sum to 100)
          "preview": "Safe detour",  // shown as badge under choice button
          "effects": [{ "resource": "fuel", "delta": -10 }],
          "message": "Burned extra fuel on a wide detour."
        },
        { "chance": 30, "preview": "Major detour", ... }
      ]
    },
    { "text": "Push through the swarm", "outcomes": [...] },
    { "text": "Fire warning shots", "outcomes": [...] }
  ]
}
```

**Effect object:**
```js
{ "resource": "fuel", "delta": -10 }              // subtract 10 fuel (clamped to 0)
{ "resource": "distanceTraveled", "delta": "speedPerTick" }  // string delta = resolve from state
{ "resource": "distanceTraveled", "delta": "speedPerTick", "multiplier": 2 }  // with multiplier
```

**Conditional outcomes (requires/fail):**
```js
{
  "requires": { "funds": 20 },       // must have ≥ 20 funds
  "effects": [...],                   // applied if requirement met
  "message": "Success message",
  "failEffects": [...],               // applied if requirement NOT met
  "failMessage": "Can't afford it!"
}
```

**Message templates:**
`{resource_change}` placeholders resolve to the actual amount changed. Example: `"Lost {cargo_change} tons"` → `"Lost 15 tons"` (if cargo had 15+ available) or `"Lost 8 tons"` (if only 8 was available).

### Engine (events.js)

- `resolveOutcome(choice)` — Rolls 0–100, walks outcomes accumulating chances, returns the matching outcome object.
- `applyOutcome(outcome, state)` — Checks `requires`, applies `effects` or `failEffects`, resolves message template, returns message string.
- `applyEffects(effects, state)` — For each effect: resolve delta (number or state reference + multiplier), clamp result to [0, max], track actual change for template resolution.
- `getResourceMax(resource, state)` — Returns 100 for health/ship/fuel, `state.maxCargo` for cargo, Infinity for funds/deterrence/distance.
- `shouldEventTrigger(dangerBonus)` — `Math.random() < (0.35 + dangerBonus)`
- `getRandomEvent()` — Random pick from `EVENT_CATALOG`.

### Current Events (12 total)

**Bad (6):** Maritime Militia, Typhoon Warning, Electronic Warfare, Submarine Contact, Minefield, Cyber Attack
**Good (3):** Kuroshio Current, Allied Supply Cache, Allied Escort
**Neutral (3):** UNREP — Logistics Vessel, EMCON Order, Disputed Waters

---

## Map Rendering (map.js — GameMap class)

- Canvas-based, redrawn each tick via `render(progress)`.
- `progress` = `distanceTraveled / totalRouteDistance` (0–1 fraction).
- **Ocean**: Dark fill `#0a1929` + animated sine-wave lines.
- **Route**: Dashed line (full route) + solid bright line (traveled portion).
- **Ship**: Triangle with sail, rotated to face direction of travel, with glow shadow.
- **Port markers**: Outer ring + inner dot, color-coded by state (secure=blue, contested=amber, fallen=red). Labels above markers.
- **Ship interpolation**: `getShipPosition(progress)` walks segments in normalized coordinate space, interpolates within the current segment.
- Ports use normalized coordinates `(nx, ny)` in 0–1 space, mapped to canvas pixels via `_toPixel()` with 40px padding.

---

## UI System (ui.js — UI class)

- **Sidebar**: Updates resource spans each tick via `updateResources(state)`. Color-codes critical values (red when below threshold).
- **Event modal**: Two-phase — shows choices with outcome badges, then shows result with "Continue" button. Returns `Promise<{message, type}>`.
- **Port modal**: Shows mission briefing (contested) or hub description (secure), resource summary, trade buttons (disable when unaffordable), "Set Sail" button. Returns `Promise<void>`.
- **Ops log**: Prepend-only list, max 50 entries. Color-coded border: red=bad, green=good, gold=port.
- **Game over**: Shows "Mission Accomplished" or "Mission Failed" with stats (day, deterrence, funds, islands secured/lost).

---

## Styling (style.css)

Dark naval theme with CSS custom properties:

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-dark` | `#0b1628` | Body background |
| `--bg-panel` | `#122040` | Sidebar, modal background |
| `--accent` | `#4fc3f7` | Primary blue, secure ports |
| `--danger` | `#ef5350` | Critical values, fallen ports |
| `--success` | `#66bb6a` | Good events, cargo color |
| `--gold` | `#ffd54f` | Funds, port arrivals, contested ports |
| `--fuel` | `#ff9800` | Fuel resource color |
| `--deterrence` | `#ab47bc` | Deterrence score (purple) |

Layout: Flex column app → header + main (flex row: canvas map + 280px sidebar). Modal is fixed overlay with centered panel (max-width 520px).

---

## Reference Data (data_master/ — not yet integrated)

### ships_updated.json

10 US Navy vessels with real specs:

| Field | Type | Description |
|-------|------|-------------|
| `ship_id` | string | e.g., "CVN-68" |
| `name` | string | e.g., "USS Nimitz" |
| `cargo_capacity_tons` | number | Usable cargo in metric tons |
| `weight_tons` | number | Displacement |
| `max_speed_knots` | number | Maximum speed |
| `fuel_capacity_tons` | number | Fuel storage |
| `size.x` | number | Length overall (meters) |
| `size.y` | number | Beam width (meters) |

Ships range from FFG-62 Constellation (900t cargo, 26kn) to USNS Supply (17,700t cargo, 25kn).

### cargo.json

27 military/construction cargo items with dimensions:

| Field | Type | Description |
|-------|------|-------------|
| `cargo_id` | string | e.g., "CARGO-001" |
| `general_label` | string | Category: Heavy Equipment, Heavy Lift, Construction Material, Modular Structure, Vehicle |
| `cargo` | string | Full name, e.g., "Caterpillar D9 Bulldozers" |
| `dimensions.length_ft` | float | Length in feet |
| `dimensions.width_ft` | float | Width in feet |
| `dimensions.weight_lbs` | int | Weight in pounds |

Includes items directly relevant to missions: ROWPU units (CARGO-019), bulldozers (CARGO-001), cold milling machines (CARGO-018), concrete mixers (CARGO-020).

---

## Game Balance Summary

- **40 total ticks** (1000 distance / 25 per tick)
- **Fuel budget**: 80 start, 2/tick = 40 ticks of fuel (barely enough; events drain extra, must refuel)
- **Cargo budget**: 80t start. 3 missions × 20t = 60t required. 20t flex for losses.
- **Funds flow**: $50 start + $60 from missions = $110 total. Port costs $10–15 per action.
- **Event rate**: ~35% base + danger bonus per fallen island. 2-tick cooldown between events.
- **Mission deadlines**: Palawan Day 25, Batanes Day 38, Kaohsiung Day 45.

---

## Key Design Patterns

1. **Data-driven events**: All event content lives in `events-data.js` as declarative data. The engine in `events.js` interprets effects generically — add new events by adding objects to the array.
2. **Auto-sail with modal interrupts**: Ship sails automatically via `setTimeout` chain. Events and ports stop sailing, show an async modal, then resume. The `_busy` flag prevents tick overlap during modals.
3. **Port state mutation**: Port objects in `map.ports[]` are mutated in place (state changes, mission.delivered increments). The map re-renders each tick picking up current state.
4. **Template messages**: Event outcome messages use `{resource_change}` placeholders resolved against actual deltas after clamping, so messages accurately reflect what happened (e.g., if you only had 8 cargo and lost 15, message says "8 tons lost").
