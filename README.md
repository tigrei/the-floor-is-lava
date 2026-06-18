Weather Feature: 

Summary: A matrix ocean simulation with 11 evolving weather states (calm to typhoons) driven by wind, waves, swell, and drag; producing a real-time resistance field that directly affects ships and delivery 

------
Weather Highlight 
World: 50×50 dynamic ocean grid
Scenarios: 11 weather states (calm → extreme typhoon) - different levels of turbulance 
Simulation: 18 time steps per scenario (continuous evolution over ~3 minutes)
Physics systems: wind force, wave energy transfer, swell diffusion, and drag resistance

This resistance is sampled in real time by the game’s routing and movement systems, dynamically affecting:

ship speed and fuel consumption
optimal pathfinding and rerouting decisions
risk exposure and damage probability
tactical decision-making during storms



# First Island Chain: Gray Zone Operations

A browser-based JavaScript wargaming scenario game, set in the high-tension "Gray Zone" of the Philippine Sea, South China Sea, and Taiwan Strait.

## 1. The World State: The First Island Chain

**The Setting:** The Area of Responsibility (AOR) spans the Philippine Sea, the South China Sea, and the Taiwan Strait. This is a "Gray Zone" conflict—war hasn't formally been declared, but acts of sabotage, maritime blockades, and asymmetric warfare are active.

**The Atmosphere:** High-tension, humid, and constantly monitored. Radio silence (EMCON - Emissions Control) is frequently necessary to avoid detection by enemy over-the-horizon radar.

**Island States:**
* **Secure:** Allied-controlled, functioning as logistical hubs.
* **Contested (The Brink):** Experiencing heavy cyber attacks, supply starvation, or covert insertion of enemy special forces.
* **Fallen:** Overrun. Approaching these islands requires stealth or escorts, and the mission shifts from "fortify" to "clandestine extraction" or "sabotage."

## 2. Mission Profiles: Combat Engineer Packages

Your "cargo" consists of modular engineering capabilities needed to secure contested islands:

* **Expeditionary Airfield Repair (Rapid Airfield Damage Repair - RADR):**
  * *The Narrative:* "Palawan's primary airstrip took a hit from an unclaimed loitering munition. Allied P-8 Poseidons cannot launch to hunt enemy submarines until the craters are filled and the runway is certified. Deliver the RADR package and heavy equipment within 48 hours, or the sub-hunting net collapses."
* **Water Security (ROWPU - Reverse Osmosis Water Purification Unit):**
  * *The Narrative:* "An island garrison in the Batanes has had its local aquifers intentionally contaminated. Morale is collapsing, and combat effectiveness is dropping by 15% a day. We need to deploy a heavy ROWPU and generator package before they are forced to surrender due to dehydration."
* **Coastal Fortification & Sensor Grids:**
  * *The Narrative:* "Intelligence indicates an amphibious flotilla is massing 200 nautical miles away. We need to reinforce a beachhead on a critical choke-point island with Hesco barriers, anti-ship missile emplacements, and an over-the-horizon radar array to deny them the landing zone."

## 3. The Hazards: Events & Interdictions

The "random events" reflect the geopolitical reality of the South China Sea.

* **The Maritime Militia (Asymmetric Piracy):**
  * *Event:* A swarm of "fishing vessels" aggressively blocks your path. They aren't flying military colors, but their hulls are reinforced steel.
  * *Dilemma:* Ramming them creates an international incident and delays your voyage; altering course burns precious fuel and time; firing warning shots escalates the conflict meter.
* **Severe Weather (Typhoon Alley):**
  * *Event:* A Category 4 Typhoon is forming in the Philippine Sea.
  * *Dilemma:* Do you sail straight through it to meet your deadline (risking severe damage to the ship and loss of deck cargo), or do you divert to a safe harbor, guaranteeing the island falls to the enemy while you wait out the storm?
* **Electronic Warfare & Spoofing:**
  * *Event:* Your GPS and Automatic Identification System (AIS) are spoofed. The map UI glitches out, and your ship's reported position jumps 50 miles off course.
  * *Dilemma:* You must rely on dead reckoning (using a manual, slower navigation method) for the next 24 hours, costing you time but ensuring you don't sail into an enemy minefield.

## 4. The "Ticking Clock" & Scoring Dynamics

* **Scoring via "Force Projection":** Instead of just gold or points, the player earns "Force Projection" or "Deterrence Points." Successfully setting up a missile battery on an island increases the allied threat radius, making future voyages in that sector safer.
* **The Domino Effect:** If an island falls because the Seabees didn't arrive in time, the enemy's radar and interdiction range expands, permanently altering the map and making the route to Taiwan vastly more dangerous.

## 5. Game Architecture & Data Models

The game utilizes a structured, data-driven architecture to manage the complexity of military logistics and dynamic events:

* **Cargo Systems (`data_master/cargo.json` & `cargo_schema.txt`):** A comprehensive catalog of modular engineering capabilities, categorized into Heavy Equipment, Modular Structures, Construction Materials, and Heavy Lift items (e.g., Bulldozers, ROWPUs, Cranes). Each item includes specific weight and dimension constraints.
* **Vessel Data:** Dedicated ship models dictate the capacity, speed, and defense capabilities of the transport vessels.
* **Data-Driven Events (`events-data.js`):** Geopolitical hazards and interdictions are processed through a modular event engine, allowing for branching choices, skill checks, and direct impact on ship condition, crew morale, and Force Projection scores.

---

