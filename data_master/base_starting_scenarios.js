const SCENARIO_1 = [
  {
    name: "Yokosuka",
    inventory: { "Comms": 70, "Equipment": 45, "Steel": 40, "Water": 35 }
  },
  {
    name: "Sasebo",
    inventory: { "Steel": 60, "Water": 40, "Comms": 30, "Equipment": 30 }
  },
  {
    name: "Kunsan",
    inventory: { "Steel": 45, "Equipment": 50, "Water": 30, "Comms": 25 }
  },
  {
    name: "Subic Bay",
    inventory: { "Equipment": 65, "Steel": 55, "Water": 45, "Comms": 25 }
  },
  {
    name: "Guam",
    inventory: { "Comms": 85, "Equipment": 75, "Steel": 70, "Water": 40 }
  }
]; // Balanced readiness (easy - no bottlenecks)

const SCENARIO_2 = [
  {
    name: "Yokosuka",
    inventory: { "Comms": 65, "Equipment": 45, "Steel": 40, "Water": 30 }
  },
  {
    name: "Sasebo",
    inventory: { "Steel": 55, "Water": 30, "Comms": 25, "Equipment": 25 }
  },
  {
    name: "Kunsan",
    inventory: { "Steel": 40, "Equipment": 45, "Water": 25, "Comms": 20 }
  },
  {
    name: "Subic Bay",
    inventory: { "Equipment": 60, "Steel": 50, "Water": 35, "Comms": 15 }
  },
  {
    name: "Guam",
    inventory: { "Comms": 75, "Equipment": 70, "Steel": 65, "Water": 30 }
  }
]; // Mild strain + slow resupply (still stable if planned well)

const SCENARIO_3 = [
  {
    name: "Yokosuka",
    inventory: { "Comms": 60, "Equipment": 40, "Steel": 35, "Water": 25 }
  },
  {
    name: "Sasebo",
    inventory: { "Steel": 50, "Water": 25, "Comms": 20, "Equipment": 20 }
  },
  {
    name: "Kunsan",
    inventory: { "Steel": 35, "Equipment": 40, "Water": 20, "Comms": 15 }
  },
  {
    name: "Subic Bay",
    inventory: { "Equipment": 55, "Steel": 45, "Water": 25, "Comms": 15 }
  },
  {
    name: "Guam",
    inventory: { "Comms": 70, "Equipment": 65, "Steel": 60, "Water": 25 }
  }
]; // Water + fuel movement friction (routing decisions matter)

const SCENARIO_4 = [
  {
    name: "Yokosuka",
    inventory: { "Comms": 55, "Equipment": 35, "Steel": 30, "Water": 20 }
  },
  {
    name: "Sasebo",
    inventory: { "Steel": 45, "Water": 20, "Comms": 15, "Equipment": 15 }
  },
  {
    name: "Kunsan",
    inventory: { "Steel": 30, "Equipment": 35, "Water": 15, "Comms": 10 }
  },
  {
    name: "Subic Bay",
    inventory: { "Equipment": 50, "Steel": 40, "Water": 20, "Comms": 10 }
  },
  {
    name: "Guam",
    inventory: { "Comms": 65, "Equipment": 60, "Steel": 55, "Water": 20 }
  }
]; // Comms degradation but strong physical logistics remain

const SCENARIO_5 = [
  {
    name: "Yokosuka",
    inventory: { "Comms": 50, "Equipment": 30, "Steel": 25, "Water": 15 }
  },
  {
    name: "Sasebo",
    inventory: { "Steel": 40, "Water": 15, "Comms": 10, "Equipment": 10 }
  },
  {
    name: "Kunsan",
    inventory: { "Steel": 25, "Equipment": 30, "Water": 10, "Comms": 10 }
  },
  {
    name: "Subic Bay",
    inventory: { "Equipment": 45, "Steel": 35, "Water": 15, "Comms": 5 }
  },
  {
    name: "Guam",
    inventory: { "Comms": 60, "Equipment": 55, "Steel": 50, "Water": 15 }
  }
]; // Forward bases strained, but hubs compensate

const SCENARIO_6 = [
  {
    name: "Yokosuka",
    inventory: { "Comms": 55, "Equipment": 25, "Steel": 30, "Water": 15 }
  },
  {
    name: "Sasebo",
    inventory: { "Steel": 35, "Water": 25, "Comms": 15, "Equipment": 15 }
  },
  {
    name: "Kunsan",
    inventory: { "Steel": 30, "Equipment": 25, "Water": 10, "Comms": 15 }
  },
  {
    name: "Subic Bay",
    inventory: { "Equipment": 40, "Steel": 30, "Water": 15, "Comms": 10 }
  },
  {
    name: "Guam",
    inventory: { "Comms": 80, "Equipment": 50, "Steel": 55, "Water": 15 }
  }
]; // Comms strong at hub, weak elsewhere (routing dependency scenario)

const SCENARIO_7 = [
  {
    name: "Yokosuka",
    inventory: { "Comms": 40, "Equipment": 20, "Steel": 20, "Water": 10 }
  },
  {
    name: "Sasebo",
    inventory: { "Steel": 30, "Water": 10, "Comms": 10, "Equipment": 10 }
  },
  {
    name: "Kunsan",
    inventory: { "Steel": 25, "Equipment": 20, "Water": 5, "Comms": 10 }
  },
  {
    name: "Subic Bay",
    inventory: { "Equipment": 35, "Steel": 25, "Water": 10, "Comms": 5 }
  },
  {
    name: "Guam",
    inventory: { "Comms": 65, "Equipment": 40, "Steel": 45, "Water": 10 }
  }
]; // Supply prioritization required (cannot satisfy everything locally)

const SCENARIO_8 = [
  {
    name: "Yokosuka",
    inventory: { "Comms": 35, "Equipment": 15, "Steel": 20, "Water": 10 }
  },
  {
    name: "Sasebo",
    inventory: { "Steel": 25, "Water": 10, "Comms": 5, "Equipment": 10 }
  },
  {
    name: "Kunsan",
    inventory: { "Steel": 20, "Equipment": 15, "Water": 5, "Comms": 5 }
  },
  {
    name: "Subic Bay",
    inventory: { "Equipment": 30, "Steel": 20, "Water": 10, "Comms": 5 }
  },
  {
    name: "Guam",
    inventory: { "Comms": 55, "Equipment": 35, "Steel": 40, "Water": 10 }
  }
]; // Critical shortages but major hubs still functional

const SCENARIO_9 = [
  {
    name: "Yokosuka",
    inventory: { "Comms": 30, "Equipment": 15, "Steel": 15, "Water": 5 }
  },
  {
    name: "Sasebo",
    inventory: { "Steel": 20, "Water": 5, "Comms": 5, "Equipment": 5 }
  },
  {
    name: "Kunsan",
    inventory: { "Steel": 15, "Equipment": 15, "Water": 5, "Comms": 5 }
  },
  {
    name: "Subic Bay",
    inventory: { "Equipment": 25, "Steel": 15, "Water": 5, "Comms": 5 }
  },
  {
    name: "Guam",
    inventory: { "Comms": 50, "Equipment": 30, "Steel": 35, "Water": 10 }
  }
]; // High pressure but still recoverable with prioritization

const SCENARIO_10 = [
  {
    name: "Yokosuka",
    inventory: { "Comms": 25, "Equipment": 10, "Steel": 10, "Water": 5 }
  },
  {
    name: "Sasebo",
    inventory: { "Steel": 15, "Water": 5, "Comms": 5, "Equipment": 5 }
  },
  {
    name: "Kunsan",
    inventory: { "Steel": 10, "Equipment": 10, "Water": 5, "Comms": 5 }
  },
  {
    name: "Subic Bay",
    inventory: { "Equipment": 20, "Steel": 15, "Water": 5, "Comms": 5 }
  },
  {
    name: "Guam",
    inventory: { "Comms": 45, "Equipment": 25, "Steel": 30, "Water": 10 }
  }
]; // Collapse pressure but hub prevents total failure
