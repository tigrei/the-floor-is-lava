# L.A.V.A. — Littoral Asset & Vessel Allocation

A browser-based maritime logistics strategy game. You command a naval logistics ship moving combat-engineering supplies to forward-deployed Seabees and expeditionary units across the island chain surrounding Taiwan. The gameplay is route planning, cargo management, and fulfilling delivery requests before neglected ports degrade and become contested.

Built with vanilla HTML/CSS/JavaScript — no frameworks, no build step. Open `index.html` in a browser to play.

## Core Gameplay Loop

1. **Dock at a base** and load combat-engineering supplies (free — capacity is the only constraint).
2. **Chart a route** across a graph of connected ports, balancing travel time against deadlines.
3. **Deliver supplies** to remote sites with active requests.
4. **Manage escalation** — requests left unfulfilled climb in urgency and can tip ports into a contested state that blocks travel.

There is **no currency, no health system, and no combat.** The constraints are cargo capacity (100t), the 60-day clock, and the request-escalation pressure.

## The Map

A graph of **11 ports** across the First Island Chain (Japan → Taiwan → Philippines → Guam):

* **5 Bases** (Yokosuka, Sasebo, Kunsan, Subic Bay, Guam) — logistics hubs that supply cargo for free and restock over time. Each carries a different mix.
* **6 Sites** (Okinawa, Batanes, Palawan, Camilo Osias, Kyogamisaki, Mujuk) — forward delivery destinations that generate requests.

Ports are connected by edges with travel times of 1–5 days. You freely choose your next destination from connected ports — routing efficiency is the heart of the game.

## Supplies & Requests

Cargo is drawn from a catalog of real combat-engineering items (bulldozers, bridge sections, ROWPU water units, SATCOM terminals, tactical comms shelters, drilling rigs, medical kits, fuel, ammunition, and more), each keyed by a cargo ID with physical dimensions.

Each **request** specifies a destination site, a supply mix, an urgency, and a narrative mission (airfield repair, water purification, bridge construction, medical facility, ammunition bunker, etc.). You start with 3 active requests; more arrive over time (up to 5 concurrent).

## The Escalation Mechanic

Instead of fixed deadlines, requests degrade through stages if neglected:

```
low → medium → high → critical → CONTESTED
```

* Each stage has a countdown (`stageDaysLeft`). When it runs out, urgency escalates.
* A **critical** request rolls a 20% chance each day to become **contested**.
* A **contested** port **blocks all travel** to it — deliveries are locked out until it recovers.
* Recovery speed depends on the surrounding network: a contested port heals faster (`1 + supplied neighbors` per day) when its neighbors are bases or unburdened sites. Keep the network healthy to reclaim contested ports.

## Random Events

Occasional logistical complications occur during travel (~20% per day): rough seas, engine trouble, navigation hazards, comms blackouts, cargo lashing failures, shipping traffic, plus favorable currents and clear-weather windows. These are operational complications — they affect travel time or cargo condition, not the core supply-delivery gameplay.

## Scoring

The game runs **60 days**. Your end-of-game report tracks:

* Requests fulfilled vs. total
* On-time / late / failed deliveries
* Total tonnage delivered
* Overall fulfillment rate

## Architecture

| File | Responsibility |
|------|----------------|
| `index.html` | App shell: header, canvas map, sidebar panels, modal |
| `style.css` | Dark naval theme, sidebar panels, request cards |
| `map.js` | `GameMap` — port graph, connections, canvas rendering |
| `game.js` | `Game` — state, travel, cargo, requests, escalation, scoring |
| `ui.js` | `UI` — sidebar panels, port actions, event modals |
| `events.js` / `events-data.js` | Data-driven travel event engine and catalog |
| `data_master/supply-data.js` | `SUPPLY_TYPES` cargo catalog + `REQUEST_TEMPLATES` |
| `data_master/` | Reference data: ship catalog, cargo schema, weather grids |

See [CONTEXT.md](CONTEXT.md) for a full technical breakdown of state, mechanics, and data models.
