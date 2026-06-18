const SUPPLY_TYPES = {
  "Fuel":      { name: "Diesel / JP-8 Bladders",         weight_lbs:  48000, length_ft: 20.0, width_ft:  8.0 },
  "Water":     { name: "Potable Water & Purification",   weight_lbs:  35000, length_ft: 20.0, width_ft:  8.0 },
  "Food":      { name: "Rationed Food Supplies",         weight_lbs:  35000, length_ft: 20.0, width_ft:  8.0 },
  "Ammo":      { name: "Ammunition Magazines",           weight_lbs:  25000, length_ft: 10.0, width_ft:  8.0 },
  "Medical":   { name: "Medical Supplies",               weight_lbs:  18000, length_ft: 10.0, width_ft:  8.0 },
  "Comms":     { name: "Tactical Communications",        weight_lbs:  20000, length_ft: 20.0, width_ft:  8.0 },
  "Steel":     { name: "Structural Steel & Pipe",        weight_lbs: 150000, length_ft: 40.0, width_ft: 10.0 },
  "Equipment": { name: "Heavy Construction Equipment",   weight_lbs: 200000, length_ft: 45.0, width_ft: 12.0 },
};

const REQUEST_TEMPLATES = [
  { mission: "Airfield damage repair — runway cratered by loitering munitions",     supplies: { "Steel": 35, "Equipment": 20 },             urgencyPool: ["high"] },
  { mission: "Garrison water contaminated — emergency purification needed",          supplies: { "Water": 50 },                              urgencyPool: ["high"] },
  { mission: "Forward radar array needs comms upgrade and backup power",             supplies: { "Comms": 15, "Fuel": 20 },                  urgencyPool: ["medium", "high"] },
  { mission: "Coastal road destroyed — temporary bridge for vehicle access",         supplies: { "Steel": 30 },                              urgencyPool: ["medium"] },
  { mission: "Camp expansion — hardened shelters and field workshop",                supplies: { "Equipment": 10, "Steel": 15 },             urgencyPool: ["low", "medium"] },
  { mission: "Forward medical facility — modular shelter with generators",           supplies: { "Equipment": 20, "Medical": 45 },           urgencyPool: ["high"] },
  { mission: "Port facility repair — crane equipment and pier reinforcement",        supplies: { "Equipment": 15, "Steel": 30 },             urgencyPool: ["medium"] },
  { mission: "SIGINT station — antenna array and encrypted relay equipment",         supplies: { "Comms": 10 },                              urgencyPool: ["low"] },
  { mission: "Ammunition bunker — hardened underground structure required",          supplies: { "Steel": 35, "Ammo": 25 },                  urgencyPool: ["medium", "high"] },
  { mission: "Remote observation post — self-sufficient station deployment",         supplies: { "Water": 30, "Food": 25, "Equipment": 40 }, urgencyPool: ["low", "medium"] },
  { mission: "Mobile command post — power grid and tactical comms array",            supplies: { "Fuel": 35, "Comms": 55 },                  urgencyPool: ["high"] },
  { mission: "Coastal fortification — excavation equipment for earthworks",          supplies: { "Equipment": 60 },                          urgencyPool: ["medium", "high"] },
];
