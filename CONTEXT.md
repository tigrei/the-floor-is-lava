# Sea Trail — First Island Chain: Full Application Context

## Overview

**Sea Trail** is a browser-based logistics strategy game. The player commands a naval logistics ship navigating a graph of 12 ports across the First Island Chain (Japan → Taiwan → Philippines → Guam). The core gameplay is **route planning, cargo management, and fulfilling supply delivery requests** for forward-deployed Seabees and expeditionary combat engineers.

There is no currency, no health system, no combat. The only constraint is cargo capacity (100t) and time (60-day game). Supplies are loaded for free at bases and delivered to remote sites that have active requests.

Built with vanilla HTML/CSS/JavaScript. No frameworks, no build step. Open `index.html` in a browser to play.

---

## File Structure

```
the-floor-is-lava/
├── index.html          — App shell: header, canvas, sidebar, modal
├── style.css           — Dark naval theme, sidebar panels, request cards
├── supply-data.js      — SUPPLY_TYPES dict + REQUEST_TEMPLATES array
├── events-data.js      — EVENT_DATA array (logistical complications)
├── events.js           — Event engine: outcome resolution, cargo loss, delay
├── map.js              — GameMap class: port graph, connections, canvas rendering
├── ui.js               — UI class: sidebar panels, port actions, event modals
├── game.js             — Game class: state, travel, cargo, requests, scoring
├── assets/             — Image assets (see below)
│   ├── google_earth.png  — Map background image (loaded by map.js)
│   └── (various .png)    — Ship/weather/cargo illustrations
├── data_master/        — Reference data (not yet integrated into gameplay)
│   ├── ships_updated.json  — 10 real US Navy vessel specs
│   ├── cargo.json          — 27 military/construction cargo items
│   ├── Data Guide.txt      — ships schema documentation
│   └── cargo_schema.txt    — cargo schema documentation
└── CONTEXT.md          — This file
```

**Script load order** (in index.html):
`supply-data.js` → `events-data.js` → `events.js` → `map.js` → `ui.js` → `game.js`

All classes/functions are globals. Game boots on `DOMContentLoaded`.

---

## Game State

```js
// game.js — Game.constructor()
this.state = {
  day: 1,                    // Current day (increments each travel tick)
  currentPort: 11,           // Port index (starts at Guam), null when traveling
  traveling: false,
  travelFrom: null,          // Source port index
  travelTo: null,            // Destination port index
  travelElapsed: 0,          // Days spent traveling
  travelDaysRemaining: 0,    // Days left (modified by events)
  cargo: {},                 // { "construction": 15, "heavy": 10 }
  maxCargo: 100,             // Total tonnage capacity
  gameOver: false,
};

this.score = {
  fulfilled: 0,              // Completed requests
  failed: 0,                 // Expired requests
  onTime: 0,                 // Fulfilled before deadline
  late: 0,                   // Fulfilled after deadline
  tonnageDelivered: 0,       // Total tons delivered
  totalRequests: 0,          // Total requests generated
};

this.requests = [];          // Array of request objects
```

All supply types weigh 1 ton per unit. `getCargoTotal()` = sum of all cargo values.

---

## Port Graph (map.js)

### 12 Ports — 4 Bases + 8 Sites

| Idx | Name | Type | Position (nx, ny) | Specialty |
|-----|------|------|-------------------|-----------|
| 0 | Yokosuka | base | (0.82, 0.08) | Power, Comms, Shelter |
| 1 | Sasebo | base | (0.58, 0.12) | Bridging, Construction, Heavy |
| 2 | Okinawa | site | (0.68, 0.25) | — |
| 3 | Miyako-jima | site | (0.55, 0.33) | — |
| 4 | Yonaguni | site | (0.43, 0.30) | — |
| 5 | Green Island | site | (0.47, 0.42) | — |
| 6 | Pratas | site | (0.32, 0.54) | — |
| 7 | Batanes | site | (0.42, 0.57) | — |
| 8 | Subic Bay | base | (0.35, 0.70) | Tools, Water, Comms |
| 9 | Palawan | site | (0.22, 0.80) | — |
| 10 | Itu Aba | site | (0.15, 0.62) | — |
| 11 | Guam | base | (0.90, 0.44) | Construction, Heavy, Shelter |

### 18 Connections (bidirectional, with travel time in days)

```
Yokosuka ↔ Sasebo (3d)       Yokosuka ↔ Okinawa (3d)      Yokosuka ↔ Guam (5d)
Sasebo ↔ Okinawa (2d)
Okinawa ↔ Miyako-jima (2d)   Okinawa ↔ Guam (4d)
Miyako-jima ↔ Yonaguni (1d)  Miyako-jima ↔ Green Island (2d)
Yonaguni ↔ Green Island (1d)
Green Island ↔ Pratas (2d)   Green Island ↔ Batanes (2d)
Pratas ↔ Subic Bay (3d)      Pratas ↔ Itu Aba (2d)
Batanes ↔ Subic Bay (2d)
Subic Bay ↔ Palawan (2d)     Subic Bay ↔ Itu Aba (3d)     Subic Bay ↔ Guam (5d)
Palawan ↔ Itu Aba (2d)
```

Data stored as `this.connections = [[portA, portB, days], ...]`.
Helper methods: `getConnected(portIndex)` returns `[{ port, days }]`, `getTravelTime(from, to)` returns days or null.

### Base Inventories

Each base has a fixed inventory object `{ supplyType: quantity }`. Inventories deplete as the player loads cargo and do not restock. Bases specialize to force multi-base routing:

- **Guam**: Construction 50, Heavy 40, Shelter 30
- **Sasebo**: Bridging 40, Construction 35, Heavy 25
- **Yokosuka**: Power 40, Comms 35, Shelter 25
- **Subic Bay**: Tools 35, Water 30, Construction 30

### Map Rendering

- Background: loads `assets/google_earth.png` as canvas background; falls back to dark fill + animated sine-wave lines if image not loaded.
- Edges: thin gray lines between all connected ports; dashed highlighted lines + travel time labels for edges connected to the current port.
- Active travel edge: solid bright blue line between source and destination.
- Port nodes: circles color-coded by type — blue (base), amber (site with active request), gray (site without request). Current port gets a white highlight ring.
- Ship: white triangle drawn at the current port (offset 22px below) or interpolated along the travel edge based on `travelElapsed / (travelElapsed + travelDaysRemaining)`.
- Ports use normalized coordinates `(nx, ny)` in 0–1 space, mapped to canvas pixels via `_toPixel()` with 48px padding.

---

## Supply System (supply-data.js)

### 8 Supply Types

```js
const SUPPLY_TYPES = {
  construction: { name: "Construction Material", short: "Constr" },
  bridging:     { name: "Bridging & Fieldworks", short: "Bridge" },
  power:        { name: "Power & Generators", short: "Power" },
  comms:        { name: "Telecom Equipment", short: "Comms" },
  tools:        { name: "Tools & Repair Kits", short: "Tools" },
  water:        { name: "Water & Purification", short: "Water" },
  shelter:      { name: "Modular Shelter", short: "Shelter" },
  heavy:        { name: "Heavy Equipment", short: "HvyEq" },
};
```

All types weigh 1t per unit. The `short` name is used in compact UI displays.

### 12 Request Templates

Each template defines: `supplies` (object of type→quantity), `mission` (narrative string), `urgencyPool` (array of possible urgency levels). Templates cover real Seabee missions: airfield repair, water purification, bridge construction, SIGINT deployment, medical facilities, ammunition bunkers, etc.

---

## Request System (game.js)

### Request Object

```js
{
  id: 1,
  destination: 9,                // Port index (always a site, never a base)
  destinationName: "Palawan",
  supplies: { construction: 15, heavy: 10 },  // Original full request
  remaining: { construction: 15, heavy: 10 },  // Decrements as deliveries happen
  deadline: 22,                  // Day by which delivery must complete
  urgency: "high",               // "high" | "medium" | "low"
  mission: "Airfield damage repair...",
  status: "active",              // "active" | "fulfilled" | "expired"
  createdDay: 1,
  fulfilledDay: null,
}
```

### Request Lifecycle

1. **Generation**: 3 at game start, then 1 every 7–10 days (max 5 active). Picks a random site without an active request, a random template, and sets deadline based on urgency (high: 12–18d, medium: 18–25d, low: 25–35d).
2. **Partial delivery**: Player docks at the request destination, clicks "Deliver Available Cargo". Matching cargo types transfer from ship to request, decrementing `remaining`. Multiple trips are allowed.
3. **Fulfillment**: When `remaining` is empty → `status = "fulfilled"`, scored as on-time or late.
4. **Expiration**: Each tick checks `state.day > deadline` for active requests → `status = "expired"`, counted as failed.
5. **No duplicate destinations**: Generator skips sites that already have an active request.

### Quick Load

At a base, "Load for: [destination]" auto-loads exactly what a specific request needs (minus what the ship already carries), up to base stock and ship capacity.

---

## Cargo Operations (game.js)

### Loading (at bases only)

```js
loadCargo(type, amount)  // Transfers min(amount, baseStock, shipSpace) from base to ship
unloadAll()              // Returns all cargo to current base's inventory
quickLoad(requestId)     // Auto-loads for a specific request
```

Ship cargo is `state.cargo = { type: quantity }`. Entries are deleted when quantity reaches 0.

### Delivery (at sites with active requests)

```js
deliverCargo(requestId)  // Transfers matching cargo from ship to request.remaining
```

Partial deliveries are supported. On full completion, request flips to "fulfilled" and tonnage is added to score.

---

## Travel System (game.js)

### Flow

1. Player clicks a navigation button → `startTravel(targetPort)`
2. State updates: `traveling=true, currentPort=null, travelFrom/To set, travelDaysRemaining = edge weight`
3. Tick timer starts (900ms per tick = 1 day)
4. Each `_doTick()`:
   - `day++`, `travelElapsed++`, `travelDaysRemaining--`
   - Check request deadlines, maybe generate new request
   - 20% chance of random event (modal interrupts travel)
   - If `travelDaysRemaining <= 0`: arrive at destination, stop ticking, show docked UI
   - If `day >= 60`: end game
5. Events can modify `travelDaysRemaining` (delays add days, favorable conditions subtract)

### Travel is one-way committed

Once the player clicks "Go", they cannot stop or redirect mid-transit. They arrive at the chosen port after the travel time (±event modifications).

---

## Event System

### Event Data (events-data.js)

8 logistical complications. Each has `name`, `description`, and `choices` array. Each choice has `outcomes` with percentage chances.

**Events**: Rough Seas, Engine Trouble, Navigation Hazard, Comms Blackout, Favorable Current, Cargo Lashing Failure, Shipping Traffic, Clear Weather Window.

### Event Effects

Only two effect types:
- `delay: N` — adds N to `travelDaysRemaining` (negative = speed boost). Clamped to ≥ 0.
- `cargoLoss: N` — removes N units of a random cargo type the ship is carrying.

### Event Engine (events.js)

- `resolveOutcome(choice)` — rolls 0–100, walks outcomes by cumulative chance
- `applyEventOutcome(outcome, state)` — applies delay/cargoLoss, resolves `{lost}` placeholder in message
- `shouldEventTrigger()` — `Math.random() < 0.20` (20% per travel day)
- `getRandomEvent()` — random pick from `EVENT_CATALOG`

### Event UI

Modal with choice buttons + outcome preview badges. After choosing, shows result message + "Continue" button. Returns a Promise that resolves with the message string.

---

## UI Layout (index.html + ui.js)

### HTML Structure

```
#app
├── #header (title + day counter + score display)
├── #main
│   ├── #map-area > canvas#map-canvas
│   └── aside#sidebar (340px, scrollable)
│       ├── #ship-status      — Location, cargo bar, cargo list
│       ├── #actions-panel    — Contextual: loading / delivery / navigation
│       ├── #requests-panel   — Active request cards + recent history
│       └── #log              — Ops log (prepend-only, max 40 entries)
└── #modal-overlay.hidden > #modal (for events + game over)
```

### Sidebar Sections (ui.js)

**Ship Status** (always visible):
- Location text ("Docked at Guam" or "In transit → Palawan (2d remaining)")
- Cargo capacity bar (visual + numeric)
- Cargo manifest (list of type:quantity pairs)

**Actions Panel** (contextual, rebuilt via `_renderActions()`):
- **At a base**: Supply loading grid (type, base stock, ship stock, +10/All buttons), unload button, quick-load buttons per request
- **At a site with request**: Delivery breakdown (need/have/status per type), deliver button
- **Navigation**: List of connected ports with travel time and badges (BASE / REQ)
- **While traveling**: Panel is empty (no actions available)

**Requests Panel** (always visible):
- Cards for each active request: destination, urgency badge (HIGH=red, MED=amber, LOW=blue), mission text, needed supplies, deadline with "days left" (turns red at ≤3)
- Recent fulfilled/expired requests shown below

**Ops Log**: Color-coded entries (red=bad, green=good, gold=port events).

### Event Modal

Used only during travel events. Two-phase: choice buttons with outcome previews → result message with "Continue" button.

### Game Over Modal

Shows 60-Day Report: fulfilled/total, on-time/late/failed, total tonnage, fulfillment percentage. "Play Again" reloads the page.

---

## Scoring

The game runs for **60 days**. Score is tracked in `game.score`:

| Metric | Description |
|--------|-------------|
| `fulfilled` | Requests completed (partial doesn't count) |
| `failed` | Requests that expired |
| `onTime` | Fulfilled before deadline |
| `late` | Fulfilled after deadline |
| `tonnageDelivered` | Total tons of supplies successfully delivered |
| `totalRequests` | Total requests generated over the game |

Fulfillment rate = `fulfilled / totalRequests * 100%`.

At day 60, all remaining active requests are expired and the game over modal shows.

---

## CSS Theme (style.css)

Dark naval theme with CSS custom properties:

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-dark` | `#0b1628` | Body background |
| `--bg-panel` | `#122040` | Sidebar, modal |
| `--accent` | `#4fc3f7` | Primary blue, bases |
| `--danger` | `#ef5350` | Urgent requests, failures |
| `--success` | `#66bb6a` | Deliveries, on-time |
| `--gold` | `#ffd54f` | Request sites, medium urgency |
| `--text-muted` | `#7a8ba0` | Secondary text |

Layout: Flex column `#app` → header + `#main` (flex row: canvas + 340px sidebar). Sidebar sections separated by subtle borders. Request cards have colored left borders by urgency.

---

## Assets Directory

```
assets/
├── google_earth.png                 — Map background (satellite view, loaded by map.js)
├── southeast_asia_location_map.png  — Reference map image
├── fune.png                         — Ship illustration
├── kaizokusen.png                   — Pirate ship illustration
├── container_kontenasen.png         — Container ship illustration
├── trade_container_close.png        — Container illustration
├── trade_container_character_crane.png — Crane/container illustration
├── taifuu_top.png / tenki_typhoon.png — Typhoon illustrations
├── mark_tenki_kumori.png            — Cloudy weather
├── sun_yellow1.png                  — Clear weather
├── radar_denpa.png                  — Radar illustration
├── ship_nanpasen.png                — Distressed ship
├── gyosen_ship_fushinsen.png        — Suspicious vessel
├── norimono_character2_fune.png     — Character on boat
├── job_koujou_man.png               — Construction worker
├── job_seibishi_woman.png           — Mechanic
├── buidling_boueki_souko.png        — Warehouse
└── computer_document_spreadsheet.png — Spreadsheet/planning
```

These assets are available but only `google_earth.png` is currently used in code (map background). The rest could be used for event illustrations, UI embellishments, or port imagery.

---

## Reference Data (data_master/ — not yet integrated)

### ships_updated.json — 10 US Navy Vessels

| Field | Type | Example |
|-------|------|---------|
| `ship_id` | string | "CVN-68" |
| `name` | string | "USS Nimitz" |
| `cargo_capacity_tons` | number | 15000 |
| `weight_tons` | number | 100000 |
| `max_speed_knots` | number | 30 |
| `fuel_capacity_tons` | number | 9000 |
| `size.x` (length, meters) | number | 333 |
| `size.y` (beam, meters) | number | 41 |

Ships: CVN-68 Nimitz, CVN-78 Ford, DDG-51 Burke, CG-52 Bunker Hill, LHD-1 Wasp, LHA-6 America, LPD-17 San Antonio, FFG-62 Constellation, AOE-6 Supply (USNS), T-AKE-1 Lewis and Clark (USNS).

### cargo.json — 27 Military/Construction Cargo Items

| Field | Type | Example |
|-------|------|---------|
| `cargo_id` | string | "CARGO-001" |
| `general_label` | string | "Heavy Equipment" |
| `cargo` | string | "Caterpillar D9 Bulldozers" |
| `dimensions.length_ft` | float | 17.5 |
| `dimensions.width_ft` | float | 14.0 |
| `dimensions.weight_lbs` | int | 114000 |

Categories: Heavy Equipment, Heavy Lift, Construction Material, Modular Structure, Vehicle. Includes mission-relevant items like ROWPU units (CARGO-019), bulldozers (CARGO-001), cold milling machines (CARGO-018), cranes (CARGO-005/006/024).

---

## Key Design Patterns

1. **Graph-based navigation**: Free-roaming port graph replaces linear route. Player picks next destination from connected ports. Travel time = edge weight in days.

2. **Request-driven gameplay**: No fixed missions. Requests generate dynamically with random sites, supply mixes, urgencies, and deadlines. The player decides prioritization.

3. **No economy**: No currency, no health, no spending. Bases give supplies for free. The only constraints are cargo capacity (100t) and time (60 days, plus per-request deadlines).

4. **Sidebar-driven interaction**: All player actions happen in the sidebar (loading, delivering, navigating). The map is display-only. Modals are used only for travel events and game over.

5. **Data-driven events**: Event effects are simple objects `{ delay: N, cargoLoss: N }` — the engine interprets them generically. Add new events by adding objects to `EVENT_DATA`.

6. **Partial deliveries**: Requests track `remaining` supplies separately from the original `supplies`. Multiple trips to the same site are supported. Fulfillment only triggers when `remaining` is fully emptied.

7. **Mutable port inventories**: Base `inventory` objects are mutated in place when cargo is loaded or unloaded. Inventories do not restock during the game — strategic depletion matters.

---

## Game Balance

- **60-day game**, 3 starting requests + ~7 more over the game (~10 total)
- **100t cargo capacity** vs requests needing 15–25t each → 4–6 requests per full load
- **Travel times**: 1–5 days per edge. Round trips to far sites (e.g. Guam → Palawan → Guam) take 14+ days
- **Request deadlines**: HIGH 12–18d, MEDIUM 18–25d, LOW 25–35d
- **Events**: 20% chance per travel day, mostly 1-day delays. Occasional cargo loss (2–5t) or speed boost (-1 to -2 days)
- **Base specialization**: No single base has everything. Multi-supply requests force visiting 2+ bases or making tradeoffs
