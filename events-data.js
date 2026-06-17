const EVENT_DATA = [

  {
    "name": "Maritime Militia",
    "description": "A swarm of 'fishing vessels' with reinforced steel hulls aggressively blocks your path. No military colors, but their formation is tactical.",
    "type": "bad",
    "choices": [
      {
        "text": "Alter course",
        "outcomes": [
          { "chance": 70, "preview": "Safe detour", "effects": [{ "resource": "fuel", "delta": -10 }], "message": "Burned extra fuel on a wide detour. The militia watched but didn't pursue." },
          { "chance": 30, "preview": "Major detour", "effects": [{ "resource": "fuel", "delta": -15 }], "message": "Forced into a long detour. Significant fuel expended to avoid the swarm." }
        ]
      },
      {
        "text": "Push through the swarm",
        "outcomes": [
          { "chance": 40, "preview": "They scatter", "effects": [], "message": "The militia vessels scatter as you hold course. No contact." },
          { "chance": 35, "preview": "Hull scrapes", "effects": [{ "resource": "shipCondition", "delta": -15 }, { "resource": "cargo", "delta": -5 }], "message": "Hulls scraped in close quarters. Minor damage, {cargo_change} tons of deck cargo shifted overboard." },
          { "chance": 25, "preview": "Collision", "effects": [{ "resource": "shipCondition", "delta": -25 }, { "resource": "crewHealth", "delta": -10 }, { "resource": "cargo", "delta": -10 }], "message": "Major collision with a militia vessel. Hull breached, crew injured, {cargo_change} tons lost." }
        ]
      },
      {
        "text": "Fire warning shots",
        "outcomes": [
          { "chance": 50, "preview": "They disperse", "effects": [], "message": "Warning shots fired. The militia disperses immediately." },
          { "chance": 30, "preview": "Return fire", "effects": [{ "resource": "crewHealth", "delta": -15 }, { "resource": "shipCondition", "delta": -10 }], "message": "They returned fire! Small arms damage to the superstructure. Crew casualties." },
          { "chance": 20, "preview": "International incident", "effects": [{ "resource": "crewHealth", "delta": -10 }, { "resource": "funds", "delta": -20 }, { "resource": "fuel", "delta": -5 }], "message": "International incident. Command orders you to divert for debrief. Lost time, funds, and fuel." }
        ]
      }
    ]
  },

  {
    "name": "Typhoon Warning",
    "description": "A Category 4 typhoon is forming in the Philippine Sea. Winds picking up, barometer dropping fast. You're directly in its path.",
    "type": "bad",
    "choices": [
      {
        "text": "Sail through — maintain schedule",
        "outcomes": [
          { "chance": 25, "preview": "Made it through", "effects": [{ "resource": "shipCondition", "delta": -15 }, { "resource": "fuel", "delta": -5 }], "message": "Brutal passage, but you made it through. Hull battered, fuel spent fighting the storm." },
          { "chance": 45, "preview": "Severe damage", "effects": [{ "resource": "shipCondition", "delta": -30 }, { "resource": "crewHealth", "delta": -10 }, { "resource": "cargo", "delta": -15 }], "message": "Massive waves. Hull cracked, crew thrown around. {cargo_change} tons of deck cargo washed away." },
          { "chance": 30, "preview": "Catastrophic", "effects": [{ "resource": "shipCondition", "delta": -40 }, { "resource": "crewHealth", "delta": -20 }, { "resource": "cargo", "delta": -20 }], "message": "Near-capsizing. Catastrophic hull damage, multiple casualties, {cargo_change} tons of mission cargo lost to the sea." }
        ]
      },
      {
        "text": "Divert to safe harbor",
        "outcomes": [
          { "chance": 80, "preview": "Safe but delayed", "effects": [{ "resource": "fuel", "delta": -12 }], "message": "Sheltered in a cove and rode it out. Lost time and fuel, but ship and crew are intact." },
          { "chance": 20, "preview": "Rough approach", "effects": [{ "resource": "fuel", "delta": -12 }, { "resource": "shipCondition", "delta": -10 }], "message": "Harbor approach was rough. Minor hull damage on the breakwater, but safe now." }
        ]
      }
    ]
  },

  {
    "name": "Electronic Warfare",
    "description": "GPS and AIS are spoofed. Navigation displays glitch — reported position jumps 50 miles off course. Enemy EW is active in this sector.",
    "type": "bad",
    "choices": [
      {
        "text": "Dead reckoning — go manual",
        "outcomes": [
          { "chance": 70, "preview": "Safe, burns fuel", "effects": [{ "resource": "fuel", "delta": -8 }], "message": "Switched to manual navigation. Slower and fuel-intensive, but you held course." },
          { "chance": 30, "preview": "Minimal delay", "effects": [{ "resource": "fuel", "delta": -4 }], "message": "Navigator's celestial fix was spot-on. Minimal fuel wasted." }
        ]
      },
      {
        "text": "Trust instruments",
        "outcomes": [
          { "chance": 40, "preview": "Spoofing clears", "effects": [], "message": "The jamming cleared after 20 minutes. No harm done." },
          { "chance": 35, "preview": "Close call", "effects": [{ "resource": "shipCondition", "delta": -15 }], "message": "Navigated dangerously close to a shoal. Hull scraped the bottom." },
          { "chance": 25, "preview": "Near minefield", "effects": [{ "resource": "shipCondition", "delta": -25 }, { "resource": "crewHealth", "delta": -10 }], "message": "Sailed near an enemy minefield. Close detonation rattled the hull and injured crew." }
        ]
      }
    ]
  },

  {
    "name": "Submarine Contact",
    "description": "Sonar reports submerged contact bearing 270, range closing. Possible enemy submarine. Battle stations!",
    "type": "bad",
    "choices": [
      {
        "text": "Evasive maneuvers",
        "outcomes": [
          { "chance": 60, "preview": "Lost the contact", "effects": [{ "resource": "fuel", "delta": -10 }, { "resource": "crewHealth", "delta": -5 }], "message": "Contact lost after aggressive maneuvering. Crew shaken but safe." },
          { "chance": 40, "preview": "Persistent contact", "effects": [{ "resource": "fuel", "delta": -15 }, { "resource": "crewHealth", "delta": -10 }], "message": "Contact shadowed you for hours. Exhausting evasion burned fuel and frayed nerves." }
        ]
      },
      {
        "text": "Deploy countermeasures ($20)",
        "outcomes": [
          { "chance": 70, "preview": "Effective", "requires": { "funds": 20 }, "effects": [{ "resource": "funds", "delta": -20 }], "message": "Countermeasures deployed. Contact broke off. Expensive but effective.", "failEffects": [{ "resource": "crewHealth", "delta": -15 }], "failMessage": "No funds for countermeasures! Crew endures a nerve-wracking close pass." },
          { "chance": 30, "preview": "Partial success", "requires": { "funds": 20 }, "effects": [{ "resource": "funds", "delta": -20 }, { "resource": "crewHealth", "delta": -5 }], "message": "Countermeasures partially effective. Contact circled twice before leaving.", "failEffects": [{ "resource": "crewHealth", "delta": -15 }], "failMessage": "No funds for countermeasures! Crew endures a nerve-wracking close pass." }
        ]
      },
      {
        "text": "Maintain course and speed",
        "outcomes": [
          { "chance": 50, "preview": "False alarm", "effects": [], "message": "Contact identified as a whale pod. False alarm — stand down." },
          { "chance": 30, "preview": "Torpedo in the water!", "effects": [{ "resource": "crewHealth", "delta": -15 }, { "resource": "shipCondition", "delta": -10 }], "message": "Torpedo in the water! Emergency maneuver — near miss. Shockwave damaged hull." },
          { "chance": 20, "preview": "Close hit", "effects": [{ "resource": "shipCondition", "delta": -20 }, { "resource": "cargo", "delta": -10 }, { "resource": "crewHealth", "delta": -10 }], "message": "Torpedo detonated close aboard. Hull breached, {cargo_change} tons of cargo flooded." }
        ]
      }
    ]
  },

  {
    "name": "Minefield",
    "description": "Intelligence reports enemy sea mines deployed in this sector. Your mine countermeasures are limited.",
    "type": "bad",
    "choices": [
      {
        "text": "Navigate carefully",
        "outcomes": [
          { "chance": 70, "preview": "Clear passage", "effects": [{ "resource": "fuel", "delta": -6 }], "message": "Careful navigation found a clear path. Extra fuel burned on slow transit." },
          { "chance": 30, "preview": "Close detonation", "effects": [{ "resource": "fuel", "delta": -6 }, { "resource": "shipCondition", "delta": -15 }], "message": "Mine detonated nearby. Shockwave buckled hull plates. Damage but still afloat." }
        ]
      },
      {
        "text": "Find alternate route",
        "outcomes": [
          { "chance": 80, "preview": "Safe detour", "effects": [{ "resource": "fuel", "delta": -12 }], "message": "Long detour around the field. Safe, but burned significant fuel." },
          { "chance": 20, "preview": "Detour also mined", "effects": [{ "resource": "fuel", "delta": -10 }, { "resource": "shipCondition", "delta": -10 }], "message": "Alternate route had mines too. Minor hull damage before clearing the area." }
        ]
      }
    ]
  },

  {
    "name": "Cyber Attack",
    "description": "Ship's combat and engineering systems under cyber attack. Damage control displays offline, engine controls locking up.",
    "type": "bad",
    "choices": [
      {
        "text": "Isolate affected systems",
        "outcomes": [
          { "chance": 60, "preview": "Systems isolated", "effects": [{ "resource": "fuel", "delta": -5 }], "message": "Affected networks isolated. Running on backup systems — less efficient but operational." },
          { "chance": 40, "preview": "Cargo monitoring lost", "effects": [{ "resource": "fuel", "delta": -5 }, { "resource": "cargo", "delta": -5 }], "message": "Isolation killed cargo environmental controls. {cargo_change} tons of sensitive equipment damaged." }
        ]
      },
      {
        "text": "Manual override — all hands",
        "outcomes": [
          { "chance": 50, "preview": "Crew handles it", "effects": [{ "resource": "crewHealth", "delta": -8 }], "message": "All hands on manual stations. Exhausting but systems restored." },
          { "chance": 50, "preview": "Exhausting effort", "effects": [{ "resource": "crewHealth", "delta": -15 }], "message": "36-hour manual watch rotation. Crew near collapse but ship stays running." }
        ]
      },
      {
        "text": "Counter-hack ($25)",
        "outcomes": [
          { "chance": 70, "preview": "Systems restored", "requires": { "funds": 25 }, "effects": [{ "resource": "funds", "delta": -25 }], "message": "Cyber team traced and neutralized the intrusion. Full systems restored.", "failEffects": [{ "resource": "crewHealth", "delta": -15 }, { "resource": "shipCondition", "delta": -10 }], "failMessage": "No funds for cyber response tools. Systems degrade, crew struggles." },
          { "chance": 30, "preview": "Partial restore", "requires": { "funds": 25 }, "effects": [{ "resource": "funds", "delta": -25 }, { "resource": "crewHealth", "delta": -5 }], "message": "Intrusion partially neutralized. Some systems still degraded.", "failEffects": [{ "resource": "crewHealth", "delta": -15 }, { "resource": "shipCondition", "delta": -10 }], "failMessage": "No funds for cyber response tools. Systems degrade, crew struggles." }
        ]
      }
    ]
  },

  {
    "name": "Kuroshio Current",
    "description": "The Kuroshio Current is strong today. Your ship is making excellent speed with the flow.",
    "type": "good",
    "choices": [
      {
        "text": "Ride the current",
        "outcomes": [
          { "chance": 70, "preview": "Good boost", "effects": [{ "resource": "distanceTraveled", "delta": "speedPerTick" }], "message": "The current pushed you well ahead of schedule. Bonus distance covered." },
          { "chance": 30, "preview": "Exceptional boost", "effects": [{ "resource": "distanceTraveled", "delta": "speedPerTick", "multiplier": 2 }], "message": "Incredible current! Covered a huge stretch with minimal fuel." }
        ]
      }
    ]
  },

  {
    "name": "Allied Supply Cache",
    "description": "An allied logistics drone has marked a pre-positioned supply cache on a nearby atoll. Encrypted coordinates received.",
    "type": "good",
    "choices": [
      {
        "text": "Retrieve supplies",
        "outcomes": [
          { "chance": 55, "preview": "Full cache", "effects": [{ "resource": "fuel", "delta": 10 }, { "resource": "cargo", "delta": 10 }, { "resource": "funds", "delta": 10 }], "message": "Cache intact. Retrieved fuel, cargo, and operational funds. +{fuel_change} fuel, +{cargo_change}t cargo, +$10." },
          { "chance": 30, "preview": "Partial cache", "effects": [{ "resource": "fuel", "delta": 8 }], "message": "Cache partially depleted by a previous unit. Recovered some fuel." },
          { "chance": 15, "preview": "Enemy trap", "effects": [{ "resource": "crewHealth", "delta": -10 }, { "resource": "shipCondition", "delta": -10 }], "message": "Booby-trapped by enemy SOF! IED detonated during retrieval. Casualties sustained." }
        ]
      },
      {
        "text": "Leave it — could be compromised",
        "outcomes": [
          { "chance": 100, "preview": "Continue mission", "effects": [], "message": "Cache left in place. Can't risk the mission on a potential trap." }
        ]
      }
    ]
  },

  {
    "name": "Allied Escort",
    "description": "A Littoral Combat Ship has been assigned to escort your convoy through this sector. Her crew offers damage control assistance.",
    "type": "good",
    "choices": [
      {
        "text": "Accept escort and assistance",
        "outcomes": [
          { "chance": 60, "preview": "Repairs and rest", "effects": [{ "resource": "crewHealth", "delta": 10 }, { "resource": "shipCondition", "delta": 12 }], "message": "LCS crew assisted with repairs and gave your crew a break. Morale improved." },
          { "chance": 40, "preview": "Full support", "effects": [{ "resource": "crewHealth", "delta": 15 }, { "resource": "shipCondition", "delta": 15 }, { "resource": "fuel", "delta": 5 }], "message": "Full support package: hull repairs, medical aid, and fuel transfer. Outstanding." }
        ]
      }
    ]
  },

  {
    "name": "UNREP — Logistics Vessel",
    "description": "USNS Supply, a fast combat support ship, is conducting underway replenishment in the area. They're offering UNREP.",
    "type": "neutral",
    "choices": [
      {
        "text": "Request fuel ($12)",
        "outcomes": [
          { "chance": 70, "preview": "Standard UNREP", "requires": { "funds": 12 }, "effects": [{ "resource": "funds", "delta": -12 }, { "resource": "fuel", "delta": 15 }], "message": "UNREP complete. +15 fuel received alongside.", "failEffects": [], "failMessage": "Insufficient operational funds for UNREP." },
          { "chance": 30, "preview": "Bonus stores", "requires": { "funds": 12 }, "effects": [{ "resource": "funds", "delta": -12 }, { "resource": "fuel", "delta": 15 }, { "resource": "crewHealth", "delta": 5 }], "message": "UNREP complete with bonus medical stores. Crew health improved.", "failEffects": [], "failMessage": "Insufficient operational funds for UNREP." }
        ]
      },
      {
        "text": "Request cargo ($15)",
        "outcomes": [
          { "chance": 80, "preview": "Standard transfer", "requires": { "funds": 15 }, "effects": [{ "resource": "funds", "delta": -15 }, { "resource": "cargo", "delta": 10 }], "message": "Mission cargo transferred. +{cargo_change} tons loaded.", "failEffects": [], "failMessage": "Insufficient funds for cargo transfer." },
          { "chance": 20, "preview": "Priority cargo", "requires": { "funds": 15 }, "effects": [{ "resource": "funds", "delta": -15 }, { "resource": "cargo", "delta": 15 }], "message": "Priority resupply — extra mission packages available. +{cargo_change} tons loaded.", "failEffects": [], "failMessage": "Insufficient funds for cargo transfer." }
        ]
      },
      {
        "text": "Decline UNREP",
        "outcomes": [
          { "chance": 100, "preview": "Continue mission", "effects": [], "message": "UNREP declined. USNS Supply continues on her route." }
        ]
      }
    ]
  },

  {
    "name": "EMCON Order",
    "description": "Command orders EMCON Alpha — full emissions control. Enemy over-the-horizon radar is actively scanning this sector.",
    "type": "neutral",
    "choices": [
      {
        "text": "Comply — reduce speed, go dark",
        "outcomes": [
          { "chance": 75, "preview": "Evade detection", "effects": [{ "resource": "fuel", "delta": -5 }], "message": "Running dark. Slower transit but enemy radar sweep passed without detecting you." },
          { "chance": 25, "preview": "Intercept enemy intel", "effects": [{ "resource": "fuel", "delta": -5 }, { "resource": "deterrence", "delta": 10 }], "message": "While dark, SIGINT team intercepted enemy comms. Valuable intelligence forwarded to command. +10 deterrence." }
        ]
      },
      {
        "text": "Maintain speed — risk detection",
        "outcomes": [
          { "chance": 50, "preview": "Pass undetected", "effects": [], "message": "Lucky — enemy radar missed you despite emissions. No time lost." },
          { "chance": 30, "preview": "Detected, rerouted", "effects": [{ "resource": "fuel", "delta": -10 }], "message": "Detected! Command orders emergency reroute. Significant fuel wasted." },
          { "chance": 20, "preview": "Detected, engaged", "effects": [{ "resource": "crewHealth", "delta": -10 }, { "resource": "shipCondition", "delta": -10 }], "message": "Detected and targeted! Anti-ship missile launched — countermeasures barely intercepted it." }
        ]
      }
    ]
  },

  {
    "name": "Disputed Waters",
    "description": "A foreign naval destroyer is shadowing your movements and demanding over radio that you alter course. This is contested territory.",
    "type": "neutral",
    "choices": [
      {
        "text": "Comply and alter course",
        "outcomes": [
          { "chance": 80, "preview": "Peaceful detour", "effects": [{ "resource": "fuel", "delta": -8 }], "message": "Altered course to avoid confrontation. Fuel burned on the detour." },
          { "chance": 20, "preview": "They follow anyway", "effects": [{ "resource": "fuel", "delta": -10 }, { "resource": "crewHealth", "delta": -5 }], "message": "They followed despite compliance. Tense standoff before they broke off. Crew rattled." }
        ]
      },
      {
        "text": "Assert freedom of navigation",
        "outcomes": [
          { "chance": 55, "preview": "They back down", "effects": [], "message": "Held course and broadcast legal justification. The destroyer shadowed but didn't interfere." },
          { "chance": 30, "preview": "Aggressive maneuvering", "effects": [{ "resource": "shipCondition", "delta": -10 }, { "resource": "crewHealth", "delta": -5 }], "message": "The destroyer made aggressive close passes. Near-collision damaged your hull." },
          { "chance": 15, "preview": "Escalation", "effects": [{ "resource": "crewHealth", "delta": -15 }, { "resource": "shipCondition", "delta": -15 }, { "resource": "funds", "delta": -15 }], "message": "Water cannon and laser dazzlers employed against your bridge. Crew blinded, equipment damaged." }
        ]
      }
    ]
  }

];
