const SUPPLY_TYPES = {
  "CARGO-001": { name: "Caterpillar D9 Bulldozers", short: "Dozer", length_ft: 17.5, width_ft: 14.0, weight_lbs: 114000 },
  "CARGO-006": { name: "Liebherr LTM 1500 Mobile Cranes", short: "Crane", length_ft: 65.0, width_ft: 10.5, weight_lbs: 500000 },
  "CARGO-027": { name: "Bauer BG 40 Rotary Drilling Rigs", short: "Drill", length_ft: 48.0, width_ft: 14.0, weight_lbs: 286000 },
  "CARGO-010": { name: "Prefabricated Steel Bridge Sections", short: "Bridge", length_ft: 80.0, width_ft: 16.0, weight_lbs: 520000 },
  "CARGO-013": { name: "Steel Sheet Pile Sections (AZ-26)", short: "SheetPile", length_ft: 65.0, width_ft: 2.1, weight_lbs: 185000 },
  "CARGO-008": { name: "Reinforced Concrete Pipe Sections (48-inch dia)", short: "Pipe", length_ft: 12.0, width_ft: 4.5, weight_lbs: 95000 },
  "CARGO-004": { name: "ISO Containerized Field Barracks Units", short: "Barracks", length_ft: 40.0, width_ft: 8.0, weight_lbs: 62000 },
  "CARGO-019": { name: "Containerized Reverse Osmosis Water Units", short: "ROUnit", length_ft: 20.0, width_ft: 8.0, weight_lbs: 28000 },
  "CARGO-028": { name: "Potable Water (palletized bottled water / bulk bladders)", short: "Water", length_ft: 20.0, width_ft: 8.0, weight_lbs: 42000 },
  "CARGO-029": { name: "Rationed Food Supplies (MREs / bulk grain, palletized)", short: "Food", length_ft: 20.0, width_ft: 8.0, weight_lbs: 35000 },
  "CARGO-030": { name: "Medical Supplies (field hospital kits, trauma/pharma)", short: "Medical", length_ft: 10.0, width_ft: 8.0, weight_lbs: 18000 },
  "CARGO-031": { name: "Fuel (Diesel / JP-8 Bladders)", short: "Fuel", length_ft: 20.0, width_ft: 8.0, weight_lbs: 48000 },
  "CARGO-032": { name: "Ammunition Magazines (small arms / ordnance, palletized)", short: "Ammo", length_ft: 10.0, width_ft: 8.0, weight_lbs: 25000 },
  "CARGO-033": { name: "Mobile Tactical Communications Shelter (radio/relay, vehicle-mounted)", short: "TacComms", length_ft: 20.0, width_ft: 8.0, weight_lbs: 24000 },
  "CARGO-034": { name: "Containerized SATCOM Terminal Unit", short: "SATCOM", length_ft: 10.0, width_ft: 8.0, weight_lbs: 16000 },
};

const REQUEST_TEMPLATES = [
  { supplies: { "CARGO-013": 2, "CARGO-001": 1 }, mission: "Airfield damage repair — runway cratered by loitering munitions", urgencyPool: ["high"] },
  { supplies: { "CARGO-019": 1, "CARGO-028": 2 }, mission: "Garrison water contaminated — emergency purification needed", urgencyPool: ["high"] },
  { supplies: { "CARGO-033": 1, "CARGO-031": 1 }, mission: "Forward radar array needs comms upgrade and backup power", urgencyPool: ["medium", "high"] },
  { supplies: { "CARGO-010": 1 }, mission: "Coastal road destroyed — temporary bridge for vehicle access", urgencyPool: ["medium"] },
  { supplies: { "CARGO-004": 1, "CARGO-013": 1 }, mission: "Camp expansion — hardened shelters and field workshop", urgencyPool: ["low", "medium"] },
  { supplies: { "CARGO-004": 1, "CARGO-030": 2 }, mission: "Forward medical facility — modular shelter with generators", urgencyPool: ["high"] },
  { supplies: { "CARGO-006": 1, "CARGO-013": 1 }, mission: "Port facility repair — crane equipment and pier reinforcement", urgencyPool: ["medium"] },
  { supplies: { "CARGO-034": 1 }, mission: "SIGINT station — antenna array and encrypted relay equipment", urgencyPool: ["low"] },
  { supplies: { "CARGO-008": 2, "CARGO-032": 1 }, mission: "Ammunition bunker — hardened underground structure required", urgencyPool: ["medium", "high"] },
  { supplies: { "CARGO-028": 1, "CARGO-029": 1, "CARGO-004": 1 }, mission: "Remote observation post — self-sufficient station deployment", urgencyPool: ["low", "medium"] },
  { supplies: { "CARGO-031": 1, "CARGO-033": 1 }, mission: "Mobile command post — power grid and tactical comms array", urgencyPool: ["high"] },
  { supplies: { "CARGO-027": 1 }, mission: "Coastal fortification — excavation equipment for earthworks", urgencyPool: ["medium", "high"] },

  // Critical-urgency missions: site is actively under attack, deadline window is tightest.
  { supplies: { "CARGO-032": 2, "CARGO-030": 1 }, mission: "UNDER ATTACK: garrison pinned down, ammunition and medical resupply needed immediately", urgencyPool: ["critical"] },
  { supplies: { "CARGO-033": 1, "CARGO-032": 1 }, mission: "UNDER ATTACK: comms array destroyed mid-engagement, emergency relay and ammo needed", urgencyPool: ["critical"] },
  { supplies: { "CARGO-030": 2 }, mission: "UNDER ATTACK: casualties mounting, forward medical resupply needed before position is overrun", urgencyPool: ["critical"] },
  { supplies: { "CARGO-031": 1, "CARGO-032": 1 }, mission: "UNDER ATTACK: generators down under fire, fuel and ammunition needed to hold the line", urgencyPool: ["critical"] },
];