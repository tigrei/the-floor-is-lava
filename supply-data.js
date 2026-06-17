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

const REQUEST_TEMPLATES = [
  { supplies: { construction: 15, heavy: 10 }, mission: "Airfield damage repair — runway cratered by loitering munitions", urgencyPool: ["high"] },
  { supplies: { water: 15, shelter: 5 }, mission: "Garrison water contaminated — emergency purification needed", urgencyPool: ["high"] },
  { supplies: { comms: 10, power: 5 }, mission: "Forward radar array needs comms upgrade and backup power", urgencyPool: ["medium", "high"] },
  { supplies: { bridging: 20 }, mission: "Coastal road destroyed — temporary bridge for vehicle access", urgencyPool: ["medium"] },
  { supplies: { tools: 15, construction: 10 }, mission: "Camp expansion — hardened shelters and field workshop", urgencyPool: ["low", "medium"] },
  { supplies: { shelter: 15, power: 10 }, mission: "Forward medical facility — modular shelter with generators", urgencyPool: ["high"] },
  { supplies: { heavy: 15, bridging: 10 }, mission: "Port facility repair — crane equipment and pier reinforcement", urgencyPool: ["medium"] },
  { supplies: { comms: 15 }, mission: "SIGINT station — antenna array and encrypted relay equipment", urgencyPool: ["low"] },
  { supplies: { construction: 20, tools: 10 }, mission: "Ammunition bunker — hardened underground structure required", urgencyPool: ["medium", "high"] },
  { supplies: { water: 10, tools: 10, shelter: 5 }, mission: "Remote observation post — self-sufficient station deployment", urgencyPool: ["low", "medium"] },
  { supplies: { power: 15, comms: 10 }, mission: "Mobile command post — power grid and tactical comms array", urgencyPool: ["high"] },
  { supplies: { heavy: 20 }, mission: "Coastal fortification — excavation equipment for earthworks", urgencyPool: ["medium", "high"] },
];
