# L.A.V.A. — Littoral Asset & Vessel Allocation: Full Application Context

## Overview

**L.A.V.A. (Littoral Asset & Vessel Allocation)** is a browser-based logistics strategy game. The player commands a naval logistics ship navigating a graph of 11 ports across the First Island Chain (Japan → Taiwan → Philippines → Guam). The core gameplay is **route planning, cargo management, and fulfilling supply delivery requests** for forward-deployed Seabees and expeditionary combat engineers.

There is no currency, no health system, no combat. The constraints are cargo capacity (100t), time (60-day game), and a request-escalation system where neglected requests degrade and ports can become **contested** (blocking travel). Supplies are loaded for free at bases and delivered to remote sites with active requests.

Built with vanilla HTML/CSS/JavaScript. No frameworks, no build step. Open `index.html` in a browser to play.

---

## File Structure

```
the-floor-is-lava/
├── index.html              — App shell: header, canvas, sidebar, modal
├── style.css               — Dark naval theme, sidebar panels, request cards
├── events-data.js          — EVENT_DATA array (logistical complications)
├── events.js               — Event engine + shouldPortResupply()
├── map.js                  — GameMap class: port graph, connections, canvas rendering
├── ui.js                   — UI class: sidebar panels, port actions, event modals
├── game.js                 — Game class: state, travel, cargo, requests, escalation, scoring
├── assets/                 — Image assets (google_earth.png used as map background)
├── data_master/
│   ├── supply-data.js      — SUPPLY_TYPES dict + REQUEST_TEMPLATES (loaded by index.html)
│   ├── ship_catalog.json   — 10 US Navy vessel specs (reference, not integrated)
│   ├── ship_data_description.txt — ship schema docs
│   ├── cargo_data_schema.txt     — cargo schema docs
│   ├── typhoon.json        — weather resistance grid (reference, not integrated)
│   └── weather_data_description.txt — weather data schema docs
└── CONTEXT.md              — This file
```

**Script load order** (in index.html):
`data_master/supply-data.js` → `events-data.js` → `events.js` → `map.js` → `ui.js` → `game.js`

All classes/functions are globals. Game boots on `DOMContentLoaded`. Note: `supply-data.js` lives in `data_master/` but is loaded as a script (defines globals `SUPPLY_TYPES` and `REQUEST_TEMPLATES`).

---

## Game State

```js
// game.js — Game.constructor()
this.state = {
  day: 1,
  currentPort: 1,            // Port index (starts at Sasebo), null when traveling
  traveling: false,
  travelFrom: null,
  travelTo: null,
  travelElapsed: 0,
  travelDaysRemaining: 0,
  cargo: {},                 // { "CARGO-001": 15, "CARGO-013": 10 }
  maxCargo: 100,
  gameOver: false,
};

this.score = { fulfilled: 0, failed: 0, onTime: 0, late: 0, tonnageDelivered: 0, totalRequests: 0 };
this.requests = [];
```

All supply units weigh 1 ton each for capacity purposes. `getCargoTotal()` = sum of all cargo values.

---

## Port Graph (map.js)

### 11 Ports — 5 Bases + 6 Sites

| Idx | Name | Type | Position (nx, ny) |
|-----|------|------|-------------------|
| 0 | Yokosuka | base | (0.97, 0.03) |
| 1 | Sasebo | base | (0.70, 0.15) — **start** |
| 2 | Okinawa | site | (0.64, 0.47) |
| 3 | Kunsan | base | (0.63, 0.08) |
| 4 | Batanes | site | (0.42, 0.57) |
| 5 | Subic Bay | base | (0.35, 0.70) |
| 6 | Palawan | site | (0.28, 1.02) |
| 7 | Guam | base | (0.90, 1.02) |
| 8 | Camilo Osias | site | (0.45, 0.86) |
| 9 | Kyogamisaki | site | (0.87, 0.00) |
| 10 | Mujuk | site | (0.67, 0.036) |

### Connections (bidirectional, `[portA, portB, days]`)

```
Yokosuka↔Sasebo (3)   Yokosuka↔Okinawa (4)   Yokosuka↔Guam (5)
Sasebo↔Okinawa (2)    Sasebo↔Kunsan (1)
Okinawa↔Kunsan (2)    Okinawa↔Guam (5)       Okinawa↔Batanes (2)
Kunsan↔Batanes (3)    Kunsan↔Kyogamisaki (2) Kunsan↔Mujuk (1)
Batanes↔Subic Bay (2) Batanes↔Camilo Osias (2)
Subic Bay↔Palawan (2) Subic Bay↔Guam (3)     Subic Bay↔Camilo Osias (2)
Mujuk↔Kyogamisaki (2)
```

Helper methods: `getConnected(portIndex)` → `[{ port, days }]`, `getTravelTime(from, to)` → days or null.

### Base Inventories

Each base has an `inventory` object keyed by **cargo IDs** (`CARGO-XXX`). Inventories deplete when the player loads cargo and **restock randomly during travel** (see Port Resupply). Bases carry different mixes, e.g.:
- **Yokosuka**: heavy on SATCOM (CARGO-034), TacComms (CARGO-033), Barracks (CARGO-004)
- **Sasebo**: SheetPile (CARGO-013), Dozers (CARGO-001), Cranes (CARGO-006)
- **Kunsan / Subic Bay**: Pipe (CARGO-008), Water (CARGO-028), TacComms (CARGO-033)
- **Guam**: Barracks (CARGO-004), Drills (CARGO-027), Cranes (CARGO-006)

### Map Rendering

- **Background**: loads `assets/google_earth.png`, draws it scaled to canvas with a dark `rgba(10,22,40,0.75)` overlay. Falls back to dark fill + animated sine waves if the image hasn't loaded. The map caches `lastShipState`/`lastRequestPorts`/`lastContestedPorts` so it can re-render on image load and on resize.
- **Edges**: thin gray lines between all connected ports. Edges from the current port are dashed and labeled with travel time — or labeled **"Blocked"** in red if the target is contested.
- **Travel edge**: solid bright blue line during transit.
- **Port nodes**: color-coded — blue (base), amber (site with active request), gray (idle site), **red (contested site)**. Current port has a white highlight ring. Bases show a "BASE" label; contested sites show a "CONTESTED" label.
- **Ship**: white triangle at the current port (offset below) or interpolated along the travel edge by `travelElapsed / (travelElapsed + travelDaysRemaining)`.
- Coordinates are normalized `(nx, ny)`, mapped via `_toPixel()` with 48px padding. Note some ports have `ny` slightly > 1.0 (drawn beyond nominal bounds).

---

## Supply System (data_master/supply-data.js)

### SUPPLY_TYPES — Keyed by Cargo ID

15 real cargo items, each with display name, short label, and physical dimensions (length_ft, width_ft, weight_lbs). Examples:

| Cargo ID | Short | Name |
|----------|-------|------|
| CARGO-001 | Dozer | Caterpillar D9 Bulldozers |
| CARGO-004 | Barracks | ISO Containerized Field Barracks Units |
| CARGO-006 | Crane | Liebherr LTM 1500 Mobile Cranes |
| CARGO-008 | Pipe | Reinforced Concrete Pipe Sections |
| CARGO-010 | Bridge | Prefabricated Steel Bridge Sections |
| CARGO-013 | SheetPile | Steel Sheet Pile Sections (AZ-26) |
| CARGO-019 | ROUnit | Containerized Reverse Osmosis Water Units |
| CARGO-027 | Drill | Bauer BG 40 Rotary Drilling Rigs |
| CARGO-028 | Water | Potable Water (palletized/bulk bladders) |
| CARGO-029 | Food | Rationed Food Supplies (MREs/grain) |
| CARGO-030 | Medical | Medical Supplies (field hospital kits) |
| CARGO-031 | Fuel | Fuel (Diesel / JP-8 Bladders) |
| CARGO-032 | Ammo | Ammunition Magazines |
| CARGO-033 | TacComms | Mobile Tactical Communications Shelter |
| CARGO-034 | SATCOM | Containerized SATCOM Terminal Unit |

### REQUEST_TEMPLATES

12 templates, each with `mission` (narrative), `supplies` ({ cargoId: quantity }), and `urgencyPool` (array of starting urgencies). Cover real Seabee missions: airfield repair, water purification, bridge construction, medical facilities, ammunition bunkers, SIGINT stations, coastal fortification, etc.

---

## Request & Escalation System (game.js)

### Request Object

```js
{
  id: 1,
  destination: 4,                  // Port index (always a site)
  destinationName: "Batanes",
  supplies: { "CARGO-013": 35, "CARGO-001": 20 },  // Original full request
  remaining: { "CARGO-013": 35, "CARGO-001": 20 }, // Decrements on delivery
  stageDaysLeft: 6,                // Days left in current urgency stage
  urgency: "high",                 // "low"|"medium"|"high"|"critical"|"contested"
  mission: "Airfield damage repair...",
  status: "active",                // "active"|"contested"|"fulfilled"|"expired"
  createdDay: 1,
  fulfilledDay: null,
}
```

### Escalation Ladder (the core tension mechanic)

Replaces fixed deadlines. Each day, `_checkDeadlines()` processes active/contested requests:

1. **Active, non-critical**: `stageDaysLeft--`. When it hits 0, urgency escalates:
   - `low` → `medium` (resets to 8 days)
   - `medium` → `high` (resets to 6 days)
   - `high` → `critical` (no timer; now rolls for contested)
2. **Active, critical**: each day rolls a **20% chance** to become **contested**. On contest: `status="contested"`, `urgency="contested"`, `stageDaysLeft=12`, and `score.failed++` (counts as an incident).
3. **Contested**: recovers over time. `stageDaysLeft -= recoverySpeed`, where `recoverySpeed = 1 + suppliedNeighborsCount`. A neighbor counts as "supplied" if it's a base, or a site with no active/contested request. When `stageDaysLeft <= 0`, the port is **secured**: `status="active"`, `urgency="high"`, `stageDaysLeft=8`.

### Contested Ports Block Travel

- `isPortContested(portIndex)` — true if any request there has status "contested".
- `startTravel()` refuses to set course to a contested port (logs a warning).
- The map draws contested ports/edges in red with "Blocked"/"CONTESTED" labels; nav buttons are disabled.
- `getContestedPorts()` returns a Set of contested destination indices (passed to the map renderer).

### Request Generation

- 3 at game start, then 1 every 7–10 days (max 5 active+contested).
- Picks a random site without an active/contested request, a random template, a random urgency from its pool.
- Starting `stageDaysLeft` by urgency: low=10, medium=8, high=6.

---

## Cargo Operations (game.js)

```js
loadCargo(type, amount)  // Transfers min(amount, baseStock, shipSpace) base→ship (bases only)
unloadAll()              // Returns all ship cargo to current base inventory
quickLoad(requestId)     // Auto-loads exactly what a request still needs
deliverCargo(requestId)  // Transfers matching cargo ship→request.remaining (partial OK)
```

Ship cargo is `state.cargo = { cargoId: quantity }`; entries are deleted at 0. On full request completion, status → "fulfilled", scored on-time (`day <= deadline`-equivalent) or late, tonnage added.

---

## Travel System (game.js)

1. Player clicks a nav button → `startTravel(targetPort)` (blocked if target contested).
2. State: `traveling=true, currentPort=null, travelDaysRemaining = edge weight`.
3. Tick timer: 900ms per tick = 1 day. Each `_doTick()`:
   - `day++`, `travelElapsed++`, `travelDaysRemaining--`
   - `_checkDeadlines()` (escalation), `_maybeGenerateRequest()`
   - **20% chance** of a random event (modal interrupts travel)
   - **50% chance** of port resupply (`shouldPortResupply()`)
   - On arrival (`travelDaysRemaining <= 0`): dock, stop ticking
   - At day 60: `_endGame()`

### Port Resupply (new)

Each travel day, 50% chance: pick a random subset of bases, and for each, pick a random subset of its inventory materials and bump each to a new random value (current+1 .. current+50). Logged as "[Base] Resupplied!". This keeps bases stocked over the 60-day game.

---

## Event System

### Event Data (events-data.js)

8 logistical complications, unchanged in structure: Rough Seas, Engine Trouble, Navigation Hazard, Comms Blackout, Favorable Current, Cargo Lashing Failure, Shipping Traffic, Clear Weather Window. Each has `name`, `description`, `choices[]`, and each choice has `outcomes[]` with `chance`, `preview`, `effects`, `message`.

### Event Effects

- `delay: N` — adds N to `travelDaysRemaining` (negative = speed boost), clamped ≥ 0.
- `cargoLoss: N` — removes N units of a random carried cargo type; `{lost}` placeholder in message resolves to the actual loss.

### Event Engine (events.js)

`resolveOutcome(choice)`, `applyEventOutcome(outcome, state)`, `shouldEventTrigger()` (0.20), `shouldPortResupply()` (0.50), `getRandomEvent()`.

---

## UI Layout (index.html + ui.js)

### HTML Structure

```
#app
├── #header (title "L.A.V.A. – Littoral Asset & Vessel Allocation" + day counter + score)
├── #main
│   ├── #map-area > canvas#map-canvas
│   └── aside#sidebar (340px, scrollable)
│       ├── #ship-status      — Location, cargo bar, cargo manifest
│       ├── #actions-panel    — Contextual: loading / delivery / navigation
│       ├── #requests-panel   — Active/contested request cards + recent history
│       └── #log              — Ops log (prepend-only, max 40 entries)
└── #modal-overlay.hidden > #modal (events + game over)
```

### Sidebar Sections (ui.js)

**Ship Status**: location text, cargo capacity bar (visual + numeric), cargo manifest by short label.

**Actions Panel** (contextual):
- At a base: load grid (type, base stock, ship stock, **+5**/All buttons), unload-all, quick-load buttons per active request.
- At a site with request: delivery breakdown (need/have/Ready-or-Short per type), deliver button.
- Navigation: connected ports with travel time + badges (BASE / REQ / **CONTESTED**); contested targets are disabled and show "Blocked".

**Requests Panel**: cards per active/contested request showing destination, urgency badge (CONTESTED/CRITICAL/HIGH=red, MEDIUM=amber, LOW=blue), mission, needed supplies (or "Communications lost" if contested), and stage info:
- Contested → "Recovery ETA: Nd (-Xd/d)" showing recovery rate from supplied neighbors.
- Critical → "Status: AT RISK (Rolls daily for Contested)".
- Otherwise → "Deadline: Day N (Nd left)" (turns red at ≤3 days).
Recent fulfilled/expired requests listed below.

### Modals

Event modal (two-phase: choices with previews → result + Continue). Game-over modal shows the 60-Day Report.

---

## Scoring

60-day game. `game.score`: `fulfilled`, `failed` (expired + contested incidents), `onTime`, `late`, `tonnageDelivered`, `totalRequests`. Fulfillment rate = `fulfilled / totalRequests`. At day 60 all remaining active/contested requests expire; game-over modal shows the report.

---

## CSS Theme (style.css)

Dark naval theme. Key vars: `--accent #4fc3f7` (bases/blue), `--danger #ef5350` (urgent/contested/failure), `--success #66bb6a` (deliveries), `--gold #ffd54f` (request sites/medium urgency), `--text-muted #7a8ba0`. Layout: flex column `#app` → header + `#main` (canvas + 340px sidebar). Request cards have urgency-colored left borders (`urg-contested`, `urg-high`, `urg-med`, `urg-low`).

---

## Reference Data (data_master/ — not integrated into gameplay)

### ship_catalog.json — 10 US Navy Vessels

Fields: `ship_id`, `name`, `cargo_capacity_tons`, `weight_tons`, `max_speed_knots`, `fuel_capacity_tons`, `size.x` (LOA, m), `size.y` (beam, m). Ships: CVN-68 Nimitz, CVN-78 Ford, DDG-51 Burke, CG-52 Bunker Hill, LHD-1 Wasp, LHA-6 America, LPD-17 San Antonio, FFG-62 Constellation, AOE-6 Supply, T-AKE-1 Lewis and Clark. (Schema: `ship_data_description.txt`.)

### cargo_data_schema.txt — Cargo Dictionary Schema

Defines `cargo_id`, `general_label` (Heavy Equipment / Heavy Lift / Construction Material / Modular Structure / Vehicle), `cargo` (full name), `dimensions.{length_ft, width_ft, weight_lbs}`. The in-game `SUPPLY_TYPES` is derived from this catalog.

### typhoon.json — Maritime Weather Resistance Grid (~327KB)

A 50×50 spatial grid (x: 100°E–125°E, y: 0°N–25°N) of sailing-resistance values (0.0 free → 1.0 impassable) across 18 time frames (Δt=10s). Structure: `{ "cells": { "x_y": [r0..r17] } }`. The `typhoon` scenario models an eye entering the east edge tracking WNW with a violent eyewall (~0.96 resistance). Sibling scenarios described in `weather_data_description.txt`: squall, borneo_vortex, itcz, hectic. Resistance = 1 − (wave_penalty × windage_penalty). Not yet wired into gameplay.

---

## Key Design Patterns

1. **Graph-based navigation**: free-roaming port graph; travel time = edge weight in days. Contested ports block routes.
2. **Request escalation as the clock**: instead of static deadlines, requests climb low→medium→high→critical, then risk becoming contested. Contested ports lock out delivery until recovered.
3. **Recovery via network control**: a contested port recovers faster (`1 + suppliedNeighbors` per day) when its neighbors are bases or unburdened sites — rewards keeping the surrounding network healthy.
4. **No economy**: no currency/health/spending. Constraints are cargo capacity (100t) and time (60 days + escalation pressure).
5. **Self-replenishing bases**: 50%/day resupply keeps inventories from running dry over a long game.
6. **Cargo-ID data model**: supplies are keyed by real cargo catalog IDs with physical dimensions, shared between `SUPPLY_TYPES`, base inventories, and request templates.
7. **Data-driven events**: simple `{ delay, cargoLoss }` effects interpreted generically; extend by adding to `EVENT_DATA`.
8. **Sidebar-driven interaction**: all actions happen in the sidebar; the canvas map is display-only; modals only for travel events and game over.

---

## Game Balance

- 60-day game, 3 starting requests + ~7 more (~10 total).
- 100t capacity vs requests needing ~25–115t total → some large requests need multiple trips.
- Travel times 1–5 days; corner-to-corner runs take many days, pressuring prioritization.
- Escalation: low(10d)→medium(8d)→high(6d)→critical→20%/day contested. Contested recovery 12d base, faster with healthy neighbors.
- Events 20%/travel-day (mostly ±1 day, occasional cargo loss). Base resupply 50%/travel-day.
