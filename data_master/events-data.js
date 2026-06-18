// Transit events for L.A.V.A. — interactive en-route incidents.
// NOTE: Weather is handled by weather.js (route resistance grid). No weather
//       events live here, but each choice is tagged with a `posture`:
//         "cautious" = wait / slow / stop / divert
//         "bold"     = press on / keep speed
//       The event modal uses current sea state to advise cautious vs bold.
// Engine support (events.js -> applyEventOutcome) is limited to two effects:
//   - delay:     whole days added to travelDaysRemaining
//   - cargoLoss: tons removed from one random cargo type currently aboard
// {lost} is substituted with the actual cargo lost at runtime.
const EVENT_DATA = [
  // ---- General navigation / handling ----
  {
    name: "Navigation Hazard",
    description: "Charts show an uncharted debris field or shallow water ahead.",
    choices: [
      { text: "Divert around", posture: "cautious", outcomes: [
        { chance: 85, preview: "Safe detour", effects: { delay: 1 }, message: "Safely navigated around the hazard. One day added." },
        { chance: 15, preview: "Long detour", effects: { delay: 2 }, message: "Detour longer than expected. Two days added." },
      ]},
      { text: "Proceed carefully", posture: "bold", outcomes: [
        { chance: 60, preview: "Clear passage", effects: {}, message: "Navigated through carefully. No time lost." },
        { chance: 40, preview: "Close call", effects: { delay: 1, cargoLoss: 2 }, message: "Close call with submerged debris. Lost {lost}. One day delay." },
      ]},
    ],
  },
  {
    name: "Cargo Lashing Failure",
    description: "Routine inspection reveals loose tie-downs on deck cargo.",
    choices: [
      { text: "Stop and re-secure", posture: "cautious", outcomes: [
        { chance: 85, preview: "Cargo secured", effects: { delay: 1 }, message: "Crew re-secured all cargo. One day lost but everything intact." },
        { chance: 15, preview: "Quick fix", effects: {}, message: "Only a few lashings needed tightening. Minimal time lost." },
      ]},
      { text: "Monitor and continue", posture: "bold", outcomes: [
        { chance: 50, preview: "Holds fine", effects: {}, message: "Cargo held through transit. No issues." },
        { chance: 50, preview: "Cargo lost", effects: { cargoLoss: 5 }, message: "Lashings failed in moderate seas. Lost {lost} overboard." },
      ]},
    ],
  },
  {
    name: "Shipping Traffic",
    description: "Heavy commercial traffic in this corridor. Multiple vessels on conflicting courses.",
    choices: [
      { text: "Navigate through", posture: "bold", outcomes: [
        { chance: 80, preview: "Threaded safely", effects: {}, message: "Threaded through traffic safely." },
        { chance: 20, preview: "Course change", effects: { delay: 1 }, message: "Emergency course changes needed. One day added." },
      ]},
      { text: "Wait for clearance", posture: "cautious", outcomes: [
        { chance: 100, preview: "Safe wait", effects: { delay: 1 }, message: "Waited for the shipping lane to clear. One day delay." },
      ]},
    ],
  },

  // ---- Piracy / security (from pirate_scenarios) ----
  {
    // PIR_001 — Low severity, surveillance
    name: "Suspicious Fast Boat Approach",
    description: "A small fast craft shadows your vessel before peeling away. Possible pirate surveillance.",
    choices: [
      { text: "Hold course, sound the alert", posture: "bold", outcomes: [
        { chance: 80, preview: "Contact departs", effects: {}, message: "The skiff broke off once the security team mustered. No impact." },
        { chance: 20, preview: "Brief shadow", effects: { delay: 1 }, message: "Shadowed for hours before leaving. Caution cost one day." },
      ]},
      { text: "Alter course to evade", posture: "cautious", outcomes: [
        { chance: 100, preview: "Shake the contact", effects: { delay: 1 }, message: "Altered course to shake the contact. One day added." },
      ]},
    ],
  },
  {
    // PIR_002 — High severity, attempted boarding
    name: "Attempted Boarding",
    description: "An armed skiff comes alongside and attempts to board. The security team moves to repel them.",
    choices: [
      { text: "Repel with security team", posture: "cautious", outcomes: [
        { chance: 75, preview: "Boarders driven off", effects: {}, message: "Security team repelled the boarders. No losses." },
        { chance: 25, preview: "Pallet snatched", effects: { cargoLoss: 5 }, message: "Boarders grabbed a pallet before being driven back. Lost {lost}." },
      ]},
      { text: "Increase speed and evade", posture: "bold", outcomes: [
        { chance: 60, preview: "Outrun them", effects: { delay: 1 }, message: "Opened the distance and outran the skiff. One day added." },
        { chance: 40, preview: "Grappled briefly", effects: { delay: 1, cargoLoss: 4 }, message: "They grappled on before falling away. Lost {lost}. One day delay." },
      ]},
    ],
  },
  {
    // PIR_003 — Medium severity, theft at anchor
    name: "Anchorage Theft",
    description: "At anchor overnight, thieves slip aboard and target portable cargo.",
    choices: [
      { text: "Post an armed watch", posture: "cautious", outcomes: [
        { chance: 70, preview: "Theft deterred", effects: {}, message: "Armed watch deterred the thieves. Nothing taken." },
        { chance: 30, preview: "Partial theft", effects: { cargoLoss: 4 }, message: "A few items slipped past the watch. Lost {lost}." },
      ]},
      { text: "Get underway immediately", posture: "bold", outcomes: [
        { chance: 100, preview: "Leave early", effects: { delay: 1 }, message: "Weighed anchor early to avoid the theft. One day added." },
      ]},
    ],
  },
  {
    // PIR_004 — Critical severity, armed attack
    name: "Armed Pirate Attack",
    description: "A coordinated armed attack — RPGs and small arms from multiple craft. This is serious.",
    choices: [
      { text: "Full evasive, call for escort", posture: "cautious", outcomes: [
        { chance: 55, preview: "Escort arrives", effects: { delay: 2 }, message: "Held them off until an escort arrived. Two days lost on the diversion." },
        { chance: 45, preview: "Hit while fleeing", effects: { delay: 2, cargoLoss: 12 }, message: "Took hits while breaking contact. Lost {lost}. Two days added." },
      ]},
      { text: "Stand and defend", posture: "bold", outcomes: [
        { chance: 50, preview: "Repelled, some loss", effects: { cargoLoss: 8 }, message: "Drove them off after a firefight. Lost {lost} in the exchange." },
        { chance: 50, preview: "Boarded, heavy loss", effects: { cargoLoss: 18 }, message: "Boarded before they were repelled. Lost {lost}." },
      ]},
    ],
  },

  // ---- Mechanical failures (from mechanical_issues) ----
  {
    // ENG_001 — Propulsion, High (24h repair, 50% speed)
    name: "Propeller Damage",
    description: "Underwater debris has damaged propeller blades. Main shaft vibration at speed.",
    choices: [
      { text: "Reduce to safe RPM", posture: "bold", outcomes: [
        { chance: 100, preview: "Limp along", effects: { delay: 2 }, message: "Ran at reduced revolutions to spare the shaft. Two days added." },
      ]},
      { text: "Dive team inspection & repair", posture: "cautious", outcomes: [
        { chance: 65, preview: "Patched fast", effects: { delay: 1 }, message: "Dive team cleared and balanced the blades. One day added." },
        { chance: 35, preview: "Extensive damage", effects: { delay: 3 }, message: "Damage was worse than hoped. Three days for repairs." },
      ]},
    ],
  },
  {
    // ELEC_001 — Electrical, Medium (6h)
    name: "Generator Failure",
    description: "One generator is offline. Ship's systems shift onto backup power.",
    choices: [
      { text: "Run on backup, continue", posture: "bold", outcomes: [
        { chance: 80, preview: "Holds load", effects: {}, message: "Backup carried the load fine. No time lost." },
        { chance: 20, preview: "Cascading fault", effects: { delay: 1 }, message: "Backup tripped under load — had to stabilize. One day added." },
      ]},
      { text: "Stop to repair", posture: "cautious", outcomes: [
        { chance: 100, preview: "Repaired", effects: { delay: 1 }, message: "Brought the generator back online. One day added." },
      ]},
    ],
  },
  {
    // COMM_001 — Communications, Medium (5h)
    name: "Communications Antenna Damage",
    description: "The long-range comms array is damaged and reception is degraded.",
    choices: [
      { text: "Continue with limited comms", posture: "bold", outcomes: [
        { chance: 85, preview: "Manageable", effects: {}, message: "Worked around the degraded link. No impact." },
        { chance: 15, preview: "Missed routing", effects: { delay: 1 }, message: "Missed a routing update and backtracked. One day added." },
      ]},
      { text: "Repair before proceeding", posture: "cautious", outcomes: [
        { chance: 100, preview: "Antenna restored", effects: { delay: 1 }, message: "Repaired the antenna array. One day added." },
      ]},
    ],
  },
  {
    // AUX_001 — Auxiliary, Medium (4h) — threatens water cargo
    name: "Fresh Water System Leak",
    description: "The freshwater system is leaking and potable reserves are dropping.",
    choices: [
      { text: "Ration and press on", posture: "bold", outcomes: [
        { chance: 70, preview: "Reserves hold", effects: {}, message: "Rationing held the reserves until port. No loss." },
        { chance: 30, preview: "Tapped cargo", effects: { cargoLoss: 5 }, message: "Had to draw on cargo water to cover the shortfall. Lost {lost}." },
      ]},
      { text: "Stop and patch the line", posture: "cautious", outcomes: [
        { chance: 100, preview: "Line patched", effects: { delay: 1 }, message: "Patched the freshwater line. One day added." },
      ]},
    ],
  },
  {
    // HULL_001 — Hull, High (18h, 30% speed)
    name: "Minor Hull Breach",
    description: "Localized flooding in a forward compartment. Damage control is underway.",
    choices: [
      { text: "Damage control & pumps", posture: "bold", outcomes: [
        { chance: 70, preview: "Flooding contained", effects: { delay: 1 }, message: "Pumps and shoring contained the breach. One day added." },
        { chance: 30, preview: "Flooding spreads", effects: { delay: 2, cargoLoss: 6 }, message: "Flooding reached the hold before it was sealed. Lost {lost}. Two days added." },
      ]},
      { text: "Divert to sheltered water", posture: "cautious", outcomes: [
        { chance: 100, preview: "Safe repair", effects: { delay: 2 }, message: "Diverted to calm water for hull repairs. Two days added." },
      ]},
    ],
  },
];
