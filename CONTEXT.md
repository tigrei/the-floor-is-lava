# L.A.V.A. — Littoral Asset & Vessel Allocation: Full Application Context

## Overview

**L.A.V.A. (Littoral Asset & Vessel Allocation)** is a browser-based logistics strategy game. The player commands a naval logistics ship navigating a graph of 16 ports across the First Island Chain (Japan, South Korea, Taiwan, Philippines, Guam, South China Sea). The core gameplay is **route planning, cargo management, and fulfilling supply delivery requests** for forward-deployed Seabees and expeditionary combat engineers.

There is no currency, no health system, no combat. The constraints are cargo capacity (100t), time (60-day game), a request-escalation system where neglected requests degrade and ports can become **contested** (blocking travel), and a dynamic **weather system** that blocks sea routes with storms.

Built with vanilla HTML/CSS/JavaScript. No frameworks, no build step. Open `index.html` in a browser to play.

---

## File Structure

```
the-floor-is-lava/
├── index.html                        — App shell: header, canvas, sidebar, modal, toast
├── style.css                         — Dark naval theme, sidebar panels, request cards, toasts
├── weather.js                        — WeatherSystem class (route blocking, sea state, storm calming)
├── events.js                         — Event engine: outcome resolution, cargo loss, delay
├── map.js                            — GameMap class: port graph, connections, canvas rendering, click nav
├── ui.js                             — UI class: sidebar panels, port actions, event/travel modals, toasts
├── game.js                           — Game class: state, travel, hold position, cargo, requests, scoring
├── data_master/
│   ├── supply-data.js                — SUPPLY_TYPES dict + REQUEST_TEMPLATES (loaded at runtime)
│   ├── ports.js                      — PORTS array with WPI data (loaded at runtime)
│   ├── base_starting_scenarios.js    — BASE_STARTING_INVENTORIES (loaded at runtime)
│   ├── events-data.js                — EVENT_DATA array (loaded at runtime)
│   ├── jsonsweather/                 — 10 weather scenario JSON files (fetched by weather.js)
│   │   ├── typhoon.json, typhoon_small.json, twin_typhoons.json, typhoon_squall.json
│   │   ├── squall_line.json, scattered_cells.json, borneo_vortex.json
│   │   ├── itcz_trough.json, triple_typhoon.json, hectic.json
│   ├── ship_catalog.json             — 10 US Navy vessel specs (reference, not integrated)
│   ├── ship_data_description.txt     — ship schema docs
│   ├── cargo_data_schema.txt         — cargo schema docs
│   └── weather_data_description.txt  — weather grid schema docs
├── assets/
│   └── google_earth.png              — Map background image
├── helper_scripts/                   — Build-time scripts (build_ports.py etc.)
└── CONTEXT.md                        — This file
```

**Script load order** (in index.html):
`data_master/supply-data.js` → `data_master/ports.js` → `data_master/base_starting_scenarios.js` → `weather.js` → `data_master/events-data.js` → `events.js` → `map.js` → `ui.js` → `game.js`

All classes/functions are globals. Game boots on `DOMContentLoaded`.

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
  cargo: {},                 // { "Steel": 15, "Equipment": 10 }
  maxCargo: 100,
  gameOver: false,
};

this.score = { fulfilled: 0, failed: 0, onTime: 0, late: 0, tonnageDelivered: 0, totalRequests: 0 };
this.requests = [];
this.holdPositionState = { active: false, daysLeft: null };
```

All supply units weigh 1 ton each for capacity purposes. `getCargoTotal()` = sum of all cargo values.

---

## Port Graph (map.js + data_master/ports.js)

### 16 Ports — 5 Bases + 11 Sites

| Idx | Name | Type | Position (nx, ny) | WPI | Lat/Lon |
|-----|------|------|-------------------|-----|---------|
| 0 | Yokosuka | base | (0.97, 0.03) | 61400 | 35.28N, 139.67E |
| 1 | Sasebo | base | (0.70, 0.15) | 62380 | 33.17N, 129.72E |
| 2 | Okinawa | site | (0.64, 0.47) | 62500 | 26.22N, 127.68E |
| 3 | Kunsan | base | (0.63, 0.08) | 60330 | 35.98N, 126.62E |
| 4 | Batanes | site | (0.42, 0.57) | 57970 | 20.45N, 121.97E |
| 5 | Subic Bay | site | (0.35, 0.70) | 58395 | 14.80N, 120.27E |
| 6 | Palawan | site | (0.28, 1.02) | 59270 | 9.73N, 118.73E |
| 7 | Guam | base | (0.90, 1.02) | 56550 | 13.45N, 144.62E |
| 8 | Camilo Osias | base | (0.45, 0.86) | est. | 18.50N, 122.15E |
| 9 | Penghu | site | (0.36, 0.61) | 57950 | 23.58N, 119.53E |
| 10 | Paracel Islands | site | (0.10, 0.96) | est. | 16.60N, 112.70E |
| 11 | Pengjia | site | (0.46, 0.49) | est. | 25.63N, 122.08E |
| 12 | Pratas | site | (0.25, 0.75) | est. | 20.70N, 116.72E |
| 13 | Lanyu | site | (0.43, 0.68) | est. | 22.05N, 121.52E |
| 14 | Iriomote Ishigaki | site | (0.52, 0.56) | 62520 | 24.33N, 124.17E |

Each port has real lat/lon, WPI harbor data (or estimated values marked `"estimated": true`), and stylized nx/ny canvas positions. Ports without WPI entries carry regional approximations.

### Connections (23 edges, bidirectional, `[portA, portB, days]`)

```
Sasebo↔Okinawa (2)   Sasebo↔Yokosuka (2)
Okinawa↔Kunsan (2)   Okinawa↔Guam (5)   Okinawa↔Batanes (2)
Batanes↔Subic Bay (2)   Batanes↔Guam (5)
Subic Bay↔Palawan (2)   Subic Bay↔Pratas (1)
Sasebo↔Kunsan (1)
Camilo Osias↔Subic Bay (2)   Camilo Osias↔Guam (3)
Pengjia↔Batanes (1)   Pengjia↔Kunsan (3)   Pengjia↔Okinawa (1)
Iriomote↔Batanes (1)   Iriomote↔Okinawa (2)
Lanyu↔Batanes (1)   Lanyu↔Camilo Osias (1)
Pratas↔Paracel (2)   Pratas↔Subic Bay (1)
Kunsan↔Batanes (3)
Yokosuka↔Guam (5)
```

Helpers: `getConnected(portIndex)` → `[{ port, days }]`, `getTravelTime(from, to)` → days or null.

### Base Inventories (data_master/base_starting_scenarios.js)

Inventories are loaded from `BASE_STARTING_INVENTORIES` at game start via `_initBaseInventories()`, not from the ports.js file. 5 bases with inventory keyed by supply type names:

- **Yokosuka**: Comms 120, Equipment 100, Steel 90, Water 80, Fuel 80, Food 70, Medical 70, Ammo 60
- **Sasebo**: Steel 120, Equipment 90, Water 80, Comms 70, Fuel 70, Food 70, Medical 60, Ammo 60
- **Kunsan**: Steel 90, Equipment 90, Comms 70, Water 70, Fuel 70, Food 60, Medical 60, Ammo 60
- **Camilo Osias**: Equipment 130, Steel 110, Water 90, Fuel 80, Comms 70, Food 70, Medical 70, Ammo 70
- **Guam**: Comms 130, Equipment 130, Steel 130, Water 110, Fuel 110, Food 100, Medical 100, Ammo 90

Inventories deplete when the player loads cargo and **restock randomly during travel** (50% chance per travel day; random bases get random materials bumped by +1 to +50).

### Map Rendering

- **Background**: `assets/google_earth.png` scaled to canvas with dark `rgba(10,22,40,0.75)` overlay. Falls back to dark fill + animated sine waves.
- **Edges**: thin lines color-coded — gray (normal), orange (weather-blocked). Active navigation edges are dashed with travel time labels, colored red if contested or orange if storm-blocked.
- **Travel edge**: solid bright blue line during transit.
- **Port nodes**: blue (base), amber (site with request), gray (idle site), red (contested). Current port has white highlight ring. Bases show "BASE" label; contested sites show "CONTESTED".
- **Ship**: white triangle at current port (offset below) or interpolated along travel edge.
- **Click interaction**: clicking a port opens a travel confirmation modal (via `_onPortClick`). Hovering shows pointer cursor. The modal shows port details (WPI harbor info), inventory, active requests, and a Travel button if the route is valid.

---

## Supply System (data_master/supply-data.js)

### 8 Supply Types (simplified names)

| Key | Name | Weight (lbs) |
|-----|------|-------------|
| Fuel | Diesel / JP-8 Bladders | 48,000 |
| Water | Potable Water & Purification | 35,000 |
| Food | Rationed Food Supplies | 35,000 |
| Ammo | Ammunition Magazines | 25,000 |
| Medical | Medical Supplies | 18,000 |
| Comms | Tactical Communications | 20,000 |
| Steel | Structural Steel & Pipe | 150,000 |
| Equipment | Heavy Construction Equipment | 200,000 |

### 12 Request Templates

Each with `mission` (narrative), `supplies` (type→quantity), and `urgencyPool`. Cover: airfield repair, water purification, bridge construction, camp expansion, medical facility, port repair, SIGINT station, ammunition bunker, observation post, mobile command post, coastal fortification.

---

## Weather System (weather.js)

### WeatherSystem Class

On game start, loads one of **10 weather scenarios** from `data_master/jsonsweather/` via `fetch()`. Each scenario is a time-series of 50x50 resistance grids (0.0 = free sailing, 1.0 = impassable).

**Key methods:**
- `getResistanceAt(nx, ny, day)` — resistance at a canvas position on a given game day. Respects the calm override.
- `routeResistance(portA, portB, day)` — worst resistance along a route (11 samples end-to-end).
- `isRouteBlocked(portA, portB, day)` — true if any sample point >= 0.9.
- `seaState(resistance)` — maps resistance to label (Calm/Light chop/Choppy/Rough/Impassable), CSS class, and `rough` boolean.
- `calm(currentDay)` — forces the storm to break: caps resistance to 0.25 for `CALM_DURATION_DAYS` (8 days).

**Scenarios**: typhoon, typhoon_small, twin_typhoons, typhoon_squall, squall_line, scattered_cells, borneo_vortex, itcz_trough, triple_typhoon, hectic.

**Integration with game:**
- `game.isRouteWeatherBlocked(from, to)` checks if a route is storm-blocked.
- `game.getWeatherBlockedRoutes()` returns a Set of `"min-max"` route keys for the map renderer.
- Storm-blocked routes show orange on the map with "Storm" label; nav buttons are disabled.
- The sidebar shows current weather scenario label, blocked route count, and real-time sea state at the ship's position.

---

## Hold Position Mechanic (game.js)

When all routes from the current port are blocked (by weather and/or contested ports), the ship is **stranded**. The player can click **"Hold Position"** to wait out the storm:

- The ship holds for up to `MAX_WAIT_DAYS` (3 days), advancing the game day each tick.
- Each day, deadlines still tick and new requests may generate.
- If a lane reopens during the wait, holding stops early.
- If still stranded after 3 days, `weather.calm(day)` is called — the storm **breaks** and seas subside, capping resistance to 0.25 for 8 days.
- During hold, the sidebar shows a "Holding Position" state and the actions panel shows a waiting message.

---

## Request & Escalation System (game.js)

### Request Object

```js
{
  id: 1,
  destination: 4,
  destinationName: "Batanes",
  supplies: { "Steel": 35, "Equipment": 20 },
  remaining: { "Steel": 35, "Equipment": 20 },
  stageDaysLeft: 10,
  urgency: "high",       // "low"|"medium"|"high"|"critical"|"contested"
  mission: "Airfield damage repair...",
  status: "active",      // "active"|"contested"|"fulfilled"|"expired"
  createdDay: 1,
  fulfilledDay: null,
}
```

### Escalation Ladder

Each day, `_checkDeadlines()` processes active/contested requests:

1. **Active, non-critical**: `stageDaysLeft--`. When it hits 0:
   - `low` → `medium` (resets to 12 days)
   - `medium` → `high` (resets to 10 days)
   - `high` → `critical` (no timer; now rolls daily)
2. **Active, critical**: 20% daily chance to become **contested**. On contest: `status="contested"`, `stageDaysLeft=12`, `score.failed++`.
3. **Contested**: recovers at `1 + suppliedNeighborsCount` per day. When `stageDaysLeft <= 0`: secured back to `status="active"`, `urgency="high"`, `stageDaysLeft=8`.

### Starting stage days by urgency: low=15, medium=12, high=10.

### Contested Ports Block Travel

- `isPortContested(portIndex)` — true if any request there has status "contested".
- `startTravel()` refuses contested destinations and storm-blocked routes.
- The map draws contested ports/edges in red; nav buttons are disabled.

### Request Generation

3 at game start, then 1 every 7-10 days (max 5 active+contested). Picks a random site without an active/contested request, a random template, and a random urgency from its pool.

---

## Cargo Operations (game.js)

```js
loadCargo(type, amount)    // Base→ship: min(amount, baseStock, shipSpace)
unloadCargo(type, amount)  // Ship→base: individual type unload
unloadAll()                // Ship→base: return all cargo
quickLoad(requestId)       // Auto-load for a specific request (accounts for overlapping needs)
deliverCargo(requestId)    // Ship→request.remaining (partial deliveries OK)
```

The `quickLoad` method is smart: it checks total needs across all requests for each type and only loads the shortfall for the target request, avoiding over-loading when multiple requests share supply types.

---

## Travel System (game.js)

1. Player clicks a port on the map → `showTravelConfirm()` modal shows port details, inventory, requests, and a Travel button.
2. Or player clicks a sidebar nav button → `startTravel(targetPort)` (blocked if contested or storm-blocked).
3. State: `traveling=true, currentPort=null, travelDaysRemaining = edge weight`.
4. Tick timer: 900ms per tick = 1 day. Each `_advanceDay()`:
   - `day++`, `travelElapsed++`, `travelDaysRemaining--`
   - `_checkDeadlines()` (escalation), `_maybeGenerateRequest()`
   - **10% chance** of a random event (modal interrupts travel)
   - **50% chance** of port resupply
   - On arrival (`travelDaysRemaining <= 0`): dock, stop ticking
   - At day 60: `_endGame()`

The `_advanceDay()` method is shared between travel ticks and hold-position ticks (with `allowEvents` flag).

---

## Event System

### Event Data (data_master/events-data.js)

**12 events** in three categories:

**General navigation (3):** Navigation Hazard, Cargo Lashing Failure, Shipping Traffic

**Piracy/security (4):** Suspicious Fast Boat Approach (low), Attempted Boarding (high), Anchorage Theft (medium), Armed Pirate Attack (critical)

**Mechanical failures (5):** Propeller Damage (propulsion), Generator Failure (electrical), Communications Antenna Damage, Fresh Water System Leak (threatens water cargo), Minor Hull Breach

### Event Choice Postures

Each choice is tagged with a `posture`: `"cautious"` (wait/slow/divert) or `"bold"` (press on/keep speed). The event modal uses the current sea state from the weather system to display a **weather advisory** recommending cautious or bold based on whether seas are rough.

### Event Effects

- `delay: N` — adds N to `travelDaysRemaining` (clamped >= 0)
- `cargoLoss: N` — removes N units of a random carried cargo type; `{lost}` placeholder resolves to actual loss

### Event Engine (events.js)

- `resolveOutcome(choice)` — dice roll over outcomes
- `applyEventOutcome(outcome, state)` — applies delay/cargoLoss
- `shouldEventTrigger()` — 10% per travel day
- `shouldPortResupply()` — 50% per travel day
- `getRandomEvent()` — random pick from EVENT_CATALOG

---

## UI System (ui.js)

### Sidebar Sections

**Ship Status**: location, weather scenario + blocked routes count, sea state at current position, cargo bar + manifest, **Hold Position** button (with countdown when active).

**Actions Panel** (contextual):
- At a base: load grid (type, base stock, ship stock, **-5/+5/All** buttons), unload-all, quick-load buttons per active request.
- At a site with request: delivery breakdown (need/have/Ready-or-Short per type), deliver button.
- Stranded: message pointing to Hold Position button.
- During hold: "Holding Position — Waiting Out Weather" message.

**Requests Panel**: cards per active/contested request with urgency badge, mission text, supplies needed, and escalation timer ("Escalates in N day(s)" or "AT RISK" for critical, or "Recovery ETA" for contested). Recent fulfilled/expired shown below.

### Travel Confirmation Modal

Clicking a port on the map opens a modal showing:
- Port name + type badge (BASE/SITE) + close button
- Status warnings (contested, storm-blocked, not adjacent, currently docked)
- Port details from WPI (harbor type, size, channel/anchorage depth)
- Available inventory (or "Comms Blackout" if contested)
- Active requests at destination with urgency cards
- Travel button (only if route is valid)

### Event Modal

Two-phase: choices with outcome previews + weather advisory → result + Continue. The advisory reads current sea state on the active leg and recommends cautious vs bold.

### Toast Notifications

`showToast(message, type, duration)` for non-blocking notifications (warning/error/notif). Used when clicking the map during transit, etc.

### Scenario Briefing

`showScenarioBrief()` displays an operations briefing modal on game start with situation, mission objectives, and execution window.

---

## Scoring

60-day game. `game.score`: `fulfilled`, `failed` (expired + contested incidents), `onTime`, `late`, `tonnageDelivered`, `totalRequests`. Header shows delivered and failed counts live. At day 60 all remaining active/contested requests expire; game-over modal shows the 60-Day Report.

---

## CSS Theme (style.css)

Dark naval theme. Key variables: `--accent #4fc3f7` (bases/blue), `--danger #ef5350` (urgent/contested/failure), `--success #66bb6a` (deliveries), `--gold #ffd54f` (request sites/medium urgency), `--text-muted #7a8ba0`.

Layout: flex column `#app` → header + `#main` (canvas + 340px sidebar). Modal overlay excludes sidebar (right: 340px). Travel modals align top-left. Custom scrollbar styling. Toast container fixed top-right.

Notable CSS features:
- Weather status bar with orange border-left
- Sea state color scale: calm (blue) → light chop (green) → choppy (gold) → rough (orange) → impassable (red)
- Hold Position button with pulse animation during active hold
- Contested request cards with dashed red border
- Event advisory styling (rough=orange, calm=blue)
- Travel modal with port type tags, request urgency cards, WPI details

---

## Key Design Patterns

1. **Graph-based navigation with map clicking**: free-roaming port graph; click ports on the canvas to get info and travel. Routes blocked by both contested ports and weather.
2. **Dual blocking systems**: contested ports (from escalation) AND weather (from scenario grid) both block routes independently. Hold Position resolves weather blocks after MAX_WAIT_DAYS.
3. **Request escalation as the clock**: low(15d)→medium(12d)→high(10d)→critical→20%/day contested. Recovery via network neighbors.
4. **Weather-driven gameplay**: 10 randomized weather scenarios create dynamic route blocking. Sea state advisory influences event choices. Storm can be waited out.
5. **Separate inventory initialization**: base inventories come from `base_starting_scenarios.js`, not from `ports.js`. The `_initBaseInventories()` method matches by port name at startup.
6. **No economy**: no currency/health/spending. Constraints are cargo capacity (100t), time (60 days), escalation pressure, and weather.
7. **Self-replenishing bases**: 50%/day resupply keeps inventories from running dry.
8. **Data-driven events with weather advisory**: events tagged with cautious/bold postures; the modal reads live sea state to recommend one over the other.

---

## Game Balance

- 60-day game, 3 starting requests + ~7 more (~10 total).
- 100t capacity vs requests needing 10-90t total each.
- Travel times 1-5 days; cross-map runs (e.g. Yokosuka↔Guam) take 5 days.
- Escalation: low(15d)→medium(12d)→high(10d)→critical→20%/day contested. Contested recovery 12d base, faster with healthy neighbors.
- Events 10%/travel-day. Base resupply 50%/travel-day.
- Weather blocks can strand the ship; hold position up to 3 days then storm breaks for 8 days.
