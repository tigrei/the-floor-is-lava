# L.A.V.A. — Littoral Asset & Vessel Allocation

A browser-based maritime logistics strategy game. You command a naval logistics ship moving combat-engineering supplies to forward-deployed Seabees and expeditionary units across the First Island Chain. The gameplay is route planning, cargo management, and fulfilling delivery requests under escalation pressure, dynamic weather, and piracy threats.

Built with vanilla HTML/CSS/JavaScript — no frameworks, no build step. Open `index.html` in a browser to play.

## Core Gameplay Loop

1. **Dock at a base** and load combat-engineering supplies (free — capacity is the only constraint).
2. **Click a port on the map** to see its details, inventory, and active requests, then set sail.
3. **Deliver supplies** to remote sites with active requests.
4. **Manage escalation** — requests left unfulfilled climb in urgency and can tip ports into a contested state that blocks travel.
5. **Navigate weather** — dynamic storm systems block sea routes; hold position to wait them out.

There is **no currency, no health system, and no combat.** The constraints are cargo capacity (100t), the 60-day clock, escalation pressure, and weather.

## The Map

A graph of **16 ports** across the First Island Chain (Japan, South Korea, Taiwan, Philippines, Guam, South China Sea):

* **5 Bases** (Yokosuka, Sasebo, Kunsan, Camilo Osias, Guam) — logistics hubs that supply cargo for free and restock over time.
* **11 Sites** (Okinawa, Batanes, Subic Bay, Palawan, Penghu, Paracel Islands, Pengjia, Pratas, Lanyu, Iriomote Ishigaki) — forward delivery destinations that generate requests.

Ports carry real-world coordinates and NGA World Port Index (WPI) harbor data. Click any port on the canvas to view its details and travel there.

## Supplies & Requests

8 supply types: Fuel, Water, Food, Ammo, Medical, Comms, Steel, Equipment — each representing real combat-engineering logistics categories.

Each **request** specifies a destination site, a supply mix, an urgency, and a narrative mission. You start with 3 active requests; more arrive over time (up to 5 concurrent).

## The Escalation Mechanic

Requests degrade through stages if neglected:

```
low (15d) → medium (12d) → high (10d) → critical → CONTESTED
```

* Each stage has a countdown. When it runs out, urgency escalates.
* A **critical** request rolls a 20% chance each day to become **contested**.
* A **contested** port **blocks all travel** to it until it recovers.
* Recovery speed depends on the surrounding network: `1 + supplied neighbors` per day.

## Weather System

A matrix ocean simulation drives real-time sea conditions across the map.

**The World:** A 50x50 dynamic ocean grid covers the operational area.

**Scenarios:** 10 weather states ranging from calm seas to extreme typhoons, each with different levels of turbulence. On game start, one scenario is selected at random.

**Simulation:** Each scenario evolves across 18 time steps (~3 minutes of continuous simulation), stretched over the 60-day game. Four physics systems drive the resistance field:
* **Wind force** — surface pressure and gusting
* **Wave energy transfer** — sea state buildup from sustained wind
* **Swell diffusion** — long-period energy propagation across the grid
* **Drag resistance** — aerodynamic and hydrodynamic forces on the vessel

The resulting resistance field (0.0 = free sailing, 1.0 = impassable) is sampled in real time by the game's routing and movement systems, dynamically affecting:
* **Route blocking** — routes through impassable weather are blocked (shown orange on the map)
* **Optimal pathfinding** — rerouting decisions around storm cells
* **Risk exposure** — event outcomes influenced by sea state (cautious vs. bold advisory)
* **Tactical decision-making** — hold position vs. push through during storms

**Gameplay impact:**
* The sidebar shows the active weather scenario, blocked route count, and real-time sea state at the ship's position.
* When **stranded** (all routes blocked), use **Hold Position** to wait up to 3 days. After 3 days, the storm breaks and seas subside for 8 days.
* During travel events, a **weather advisory** recommends cautious or bold choices based on current sea conditions.

## Random Events

12 events occur during travel (~10% per day), categorized as:

* **Navigation**: debris fields, cargo lashing failures, shipping traffic
* **Piracy**: surveillance boats, attempted boarding, anchorage theft, armed attacks
* **Mechanical**: propeller damage, generator failure, comms antenna damage, water system leaks, hull breaches

Each event offers two choices tagged as **cautious** or **bold**. The modal shows a weather-informed advisory.

## Scoring

The game runs **60 days**. Your end-of-game report tracks:

* Requests fulfilled vs. total
* On-time / late / failed deliveries
* Total tonnage delivered
* Overall fulfillment rate

## Architecture

| File | Responsibility |
|------|----------------|
| `index.html` | App shell: header, canvas map, sidebar, modal, toast container |
| `style.css` | Dark naval theme, weather indicators, travel modals, toast notifications |
| `map.js` | `GameMap` — port graph, connections, canvas rendering, click-to-navigate |
| `game.js` | `Game` — state, travel, hold position, cargo, requests, escalation, scoring |
| `ui.js` | `UI` — sidebar panels, port actions, travel/event modals, toasts, scenario brief |
| `weather.js` | `WeatherSystem` — scenario loading, resistance grids, route blocking, storm calming |
| `events.js` / `data_master/events-data.js` | Event engine + 12 categorized transit events with posture tags |
| `data_master/supply-data.js` | `SUPPLY_TYPES` (8 types) + `REQUEST_TEMPLATES` (12 templates) |
| `data_master/ports.js` | `PORTS` array (16 ports with WPI harbor data) |
| `data_master/base_starting_scenarios.js` | `BASE_STARTING_INVENTORIES` (5 bases) |
| `data_master/jsonsweather/` | 10 weather scenario JSON files (50x50 resistance grids) |

See [CONTEXT.md](CONTEXT.md) for a full technical breakdown of state, mechanics, and data models.
