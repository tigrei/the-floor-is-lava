const EVENT_DATA = [
  {
    name: "Rough Seas",
    description: "Heavy swells slowing progress. Cargo straining against lashings.",
    choices: [
      { text: "Push through", outcomes: [
        { chance: 60, preview: "Minor delay", effects: { delay: 1 }, message: "Pushed through rough seas. One day added to transit." },
        { chance: 40, preview: "Cargo shifts", effects: { delay: 1, cargoLoss: 3 }, message: "Cargo shifted in heavy seas. Lost {lost}. One day delay." },
      ]},
      { text: "Reduce speed", outcomes: [
        { chance: 85, preview: "Safe passage", effects: { delay: 1 }, message: "Reduced speed and rode it out. One day delay." },
        { chance: 15, preview: "Extended delay", effects: { delay: 2 }, message: "Storm worsened. Two days added to transit." },
      ]},
    ],
  },
  {
    name: "Engine Trouble",
    description: "Engineering reports a fuel line issue. Main engine at reduced power.",
    choices: [
      { text: "Repair underway", outcomes: [
        { chance: 70, preview: "Quick fix", effects: {}, message: "Engineering fixed the issue quickly. No time lost." },
        { chance: 30, preview: "Extended repair", effects: { delay: 1 }, message: "Repair took longer than expected. One day delay." },
      ]},
      { text: "Proceed at reduced speed", outcomes: [
        { chance: 100, preview: "Slow but steady", effects: { delay: 1 }, message: "Ran at reduced speed. One day added." },
      ]},
    ],
  },
  {
    name: "Navigation Hazard",
    description: "Charts show uncharted debris field or shallow water ahead.",
    choices: [
      { text: "Divert around", outcomes: [
        { chance: 85, preview: "Safe detour", effects: { delay: 1 }, message: "Safely navigated around the hazard. One day added." },
        { chance: 15, preview: "Long detour", effects: { delay: 2 }, message: "Detour longer than expected. Two days added." },
      ]},
      { text: "Proceed carefully", outcomes: [
        { chance: 60, preview: "Clear passage", effects: {}, message: "Navigated through carefully. No time lost." },
        { chance: 40, preview: "Close call", effects: { delay: 1, cargoLoss: 2 }, message: "Close call with submerged debris. Lost {lost}. One day delay." },
      ]},
    ],
  },
  {
    name: "Comms Blackout",
    description: "Satellite communications down in this sector. No updates from command.",
    choices: [
      { text: "Continue on plan", outcomes: [
        { chance: 85, preview: "No impact", effects: {}, message: "Comms restored after a few hours. No impact." },
        { chance: 15, preview: "Missed update", effects: {}, message: "Missed a scheduling update. No immediate impact." },
      ]},
      { text: "Hold position", outcomes: [
        { chance: 70, preview: "Quick restore", effects: { delay: 1 }, message: "Held position. Comms restored. One day delay." },
        { chance: 30, preview: "Extended blackout", effects: { delay: 2 }, message: "Extended blackout. Two day delay waiting for restoration." },
      ]},
    ],
  },
  {
    name: "Favorable Current",
    description: "The Kuroshio Current is strong. Excellent speed with minimal effort.",
    choices: [
      { text: "Ride the current", outcomes: [
        { chance: 65, preview: "Faster arrival", effects: { delay: -1 }, message: "Current carried you ahead of schedule. One day saved!" },
        { chance: 35, preview: "Much faster", effects: { delay: -2 }, message: "Exceptional current! Two days ahead of schedule." },
      ]},
    ],
  },
  {
    name: "Cargo Lashing Failure",
    description: "Routine inspection reveals loose tie-downs on deck cargo.",
    choices: [
      { text: "Stop and re-secure", outcomes: [
        { chance: 85, preview: "Cargo secured", effects: { delay: 1 }, message: "Crew re-secured all cargo. One day lost but everything intact." },
        { chance: 15, preview: "Quick fix", effects: {}, message: "Only a few lashings needed tightening. Minimal time lost." },
      ]},
      { text: "Monitor and continue", outcomes: [
        { chance: 50, preview: "Holds fine", effects: {}, message: "Cargo held through transit. No issues." },
        { chance: 50, preview: "Cargo lost", effects: { cargoLoss: 5 }, message: "Lashings failed in moderate seas. Lost {lost} overboard." },
      ]},
    ],
  },
  {
    name: "Shipping Traffic",
    description: "Heavy commercial traffic in this corridor. Multiple vessels on conflicting courses.",
    choices: [
      { text: "Navigate through", outcomes: [
        { chance: 80, preview: "Minor delay", effects: {}, message: "Threaded through traffic safely." },
        { chance: 20, preview: "Course change", effects: { delay: 1 }, message: "Emergency course changes needed. One day added." },
      ]},
      { text: "Wait for clearance", outcomes: [
        { chance: 100, preview: "Safe wait", effects: { delay: 1 }, message: "Waited for shipping lane to clear. One day delay." },
      ]},
    ],
  },
  {
    name: "Clear Weather Window",
    description: "Meteorology reports perfect sailing conditions ahead.",
    choices: [
      { text: "Increase speed", outcomes: [
        { chance: 75, preview: "Faster transit", effects: { delay: -1 }, message: "Made excellent time in clear conditions. One day saved!" },
        { chance: 25, preview: "Smooth sailing", effects: {}, message: "Good conditions but no significant time gain." },
      ]},
    ],
  },
];
