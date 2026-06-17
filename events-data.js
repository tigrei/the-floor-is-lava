const EVENT_DATA = [

  {
    "name": "Storm!",
    "description": "Dark clouds roll in and waves crash over the deck. The crew braces for impact.",
    "type": "bad",
    "choices": [
      {
        "text": "Ride it out",
        "outcomes": [
          { "chance": 50, "preview": "Minor damage", "effects": [{ "resource": "shipCondition", "delta": -10 }], "message": "The storm passes with minor hull damage." },
          { "chance": 30, "preview": "Cargo lost", "effects": [{ "resource": "shipCondition", "delta": -20 }, { "resource": "cargo", "delta": -10 }], "message": "Waves battered the hull and washed {cargo_change} tons of cargo overboard." },
          { "chance": 20, "preview": "Devastating", "effects": [{ "resource": "shipCondition", "delta": -30 }, { "resource": "crewHealth", "delta": -15 }, { "resource": "cargo", "delta": -15 }], "message": "Catastrophic storm! Hull breached, crew injured, {cargo_change} tons lost." }
        ]
      },
      {
        "text": "Seek shelter",
        "outcomes": [
          { "chance": 70, "preview": "Safe, burns fuel", "effects": [{ "resource": "fuel", "delta": -8 }], "message": "Found shelter and waited out the storm. Burned extra fuel." },
          { "chance": 30, "preview": "Rocky shoals", "effects": [{ "resource": "fuel", "delta": -8 }, { "resource": "shipCondition", "delta": -12 }], "message": "The cove had rocky shoals. Hull scraped and fuel burned." }
        ]
      }
    ]
  },

  {
    "name": "Pirates!",
    "description": "A black-flagged vessel approaches fast off the starboard bow.",
    "type": "bad",
    "choices": [
      {
        "text": "Fight them off",
        "outcomes": [
          { "chance": 40, "preview": "Victory, minor losses", "effects": [{ "resource": "crewHealth", "delta": -5 }, { "resource": "money", "delta": 30 }], "message": "Victory! Minor casualties. Seized $30 from the pirates." },
          { "chance": 35, "preview": "Costly victory", "effects": [{ "resource": "crewHealth", "delta": -15 }, { "resource": "shipCondition", "delta": -15 }, { "resource": "money", "delta": 10 }], "message": "Hard-fought victory. Crew wounded, hull damaged. Seized $10." },
          { "chance": 25, "preview": "Overwhelmed", "effects": [{ "resource": "crewHealth", "delta": -20 }, { "resource": "shipCondition", "delta": -20 }, { "resource": "cargo", "delta": -15 }], "message": "Overwhelmed! Heavy losses. Pirates plundered {cargo_change} tons of cargo." }
        ]
      },
      {
        "text": "Surrender cargo",
        "outcomes": [
          { "chance": 60, "preview": "Lose some cargo", "effects": [{ "resource": "cargo", "delta": -15 }], "message": "Pirates took {cargo_change} tons of cargo and sailed away." },
          { "chance": 40, "preview": "Greedy pirates", "effects": [{ "resource": "cargo", "delta": -20 }, { "resource": "money", "delta": -20 }], "message": "Greedy pirates took {cargo_change} tons of cargo and ${money_change}!" }
        ]
      },
      {
        "text": "Try to outrun",
        "outcomes": [
          { "chance": 45, "preview": "Escape, burn fuel", "effects": [{ "resource": "fuel", "delta": -10 }], "message": "Escaped! Burned extra fuel in the chase." },
          { "chance": 30, "preview": "Narrow escape", "effects": [{ "resource": "fuel", "delta": -10 }, { "resource": "shipCondition", "delta": -10 }], "message": "Barely escaped! Sails torn and fuel spent." },
          { "chance": 25, "preview": "Caught!", "effects": [{ "resource": "crewHealth", "delta": -10 }, { "resource": "cargo", "delta": -20 }, { "resource": "fuel", "delta": -5 }], "message": "Caught! Lost {cargo_change} tons of cargo after a brutal chase." }
        ]
      }
    ]
  },

  {
    "name": "Sickness",
    "description": "Fever spreads below deck. Sailors are falling ill one by one.",
    "type": "bad",
    "choices": [
      {
        "text": "Buy medicine ($20)",
        "outcomes": [
          { "chance": 60, "preview": "Contained", "requires": { "money": 20 }, "effects": [{ "resource": "money", "delta": -20 }, { "resource": "crewHealth", "delta": -5 }], "message": "Medicine contained the outbreak. Minor crew losses.", "failEffects": [{ "resource": "crewHealth", "delta": -25 }], "failMessage": "Can't afford medicine! The fever ravages the crew." },
          { "chance": 40, "preview": "Full recovery", "requires": { "money": 20 }, "effects": [{ "resource": "money", "delta": -20 }], "message": "The medicine worked perfectly. Full recovery!", "failEffects": [{ "resource": "crewHealth", "delta": -25 }], "failMessage": "Can't afford medicine! The fever ravages the crew." }
        ]
      },
      {
        "text": "Quarantine the sick",
        "outcomes": [
          { "chance": 50, "preview": "Partial containment", "effects": [{ "resource": "crewHealth", "delta": -12 }], "message": "Quarantine helped, but many suffered." },
          { "chance": 30, "preview": "Contained well", "effects": [{ "resource": "crewHealth", "delta": -5 }], "message": "Quick quarantine action prevented the worst." },
          { "chance": 20, "preview": "Spreads anyway", "effects": [{ "resource": "crewHealth", "delta": -20 }], "message": "Quarantine failed. The sickness spread to most of the crew." }
        ]
      }
    ]
  },

  {
    "name": "Reef Ahead!",
    "description": "The lookout spots dangerous coral formations directly in your path.",
    "type": "bad",
    "choices": [
      {
        "text": "Navigate carefully",
        "outcomes": [
          { "chance": 60, "preview": "Safe passage", "effects": [{ "resource": "fuel", "delta": -5 }], "message": "Careful navigation avoided the reef. Used extra fuel." },
          { "chance": 40, "preview": "Scrape the hull", "effects": [{ "resource": "fuel", "delta": -5 }, { "resource": "shipCondition", "delta": -10 }], "message": "Minor scrape on the reef despite careful navigation." }
        ]
      },
      {
        "text": "Push straight through",
        "outcomes": [
          { "chance": 30, "preview": "Lucky pass", "effects": [], "message": "Somehow threaded the needle! No damage." },
          { "chance": 45, "preview": "Hull damage", "effects": [{ "resource": "shipCondition", "delta": -20 }], "message": "The reef tore into the hull. Significant damage." },
          { "chance": 25, "preview": "Severe damage", "effects": [{ "resource": "shipCondition", "delta": -30 }, { "resource": "cargo", "delta": -10 }], "message": "Hull breached! {cargo_change} tons of cargo fell into the sea." }
        ]
      }
    ]
  },

  {
    "name": "Fire Below Deck!",
    "description": "Smoke billows from the cargo hold. Fire is spreading fast!",
    "type": "bad",
    "choices": [
      {
        "text": "Fight the fire",
        "outcomes": [
          { "chance": 50, "preview": "Extinguished", "effects": [{ "resource": "crewHealth", "delta": -5 }, { "resource": "cargo", "delta": -5 }], "message": "Fire extinguished! Minor burns, {cargo_change} tons charred." },
          { "chance": 30, "preview": "Struggled", "effects": [{ "resource": "crewHealth", "delta": -10 }, { "resource": "cargo", "delta": -15 }], "message": "Hard fight with the flames. {cargo_change} tons destroyed." },
          { "chance": 20, "preview": "Out of control", "effects": [{ "resource": "crewHealth", "delta": -15 }, { "resource": "shipCondition", "delta": -15 }, { "resource": "cargo", "delta": -25 }], "message": "Fire raged out of control! {cargo_change} tons lost, hull scorched." }
        ]
      },
      {
        "text": "Jettison burning cargo",
        "outcomes": [
          { "chance": 70, "preview": "Quick resolution", "effects": [{ "resource": "cargo", "delta": -20 }], "message": "Dumped {cargo_change} tons of burning cargo overboard. Fire out." },
          { "chance": 30, "preview": "Fire spread first", "effects": [{ "resource": "cargo", "delta": -25 }, { "resource": "shipCondition", "delta": -10 }], "message": "Jettisoned cargo but fire already damaged the hull. {cargo_change} tons lost." }
        ]
      }
    ]
  },

  {
    "name": "Favorable Winds",
    "description": "Strong tailwinds fill your sails. The ship surges forward!",
    "type": "good",
    "choices": [
      {
        "text": "Full speed ahead",
        "outcomes": [
          { "chance": 70, "preview": "Extra distance", "effects": [{ "resource": "distanceTraveled", "delta": "speedPerTick" }], "message": "The wind carried you far! Extra distance covered." },
          { "chance": 30, "preview": "Great distance", "effects": [{ "resource": "distanceTraveled", "delta": "speedPerTick", "multiplier": 2 }], "message": "Incredible winds! Covered a huge stretch of extra distance." }
        ]
      }
    ]
  },

  {
    "name": "Floating Cargo",
    "description": "Your lookout spots barrels and crates floating on the water — salvage from a wreck.",
    "type": "good",
    "choices": [
      {
        "text": "Salvage it",
        "outcomes": [
          { "chance": 60, "preview": "Good haul", "effects": [{ "resource": "cargo", "delta": 15 }, { "resource": "money", "delta": 10 }], "message": "Recovered {cargo_change} tons of cargo and $10 in valuables." },
          { "chance": 30, "preview": "Small find", "effects": [{ "resource": "cargo", "delta": 8 }], "message": "Found {cargo_change} tons of salvageable cargo." },
          { "chance": 10, "preview": "Trap!", "effects": [{ "resource": "crewHealth", "delta": -10 }, { "resource": "money", "delta": 20 }], "message": "It was a pirate trap! Crew injured in the ambush, but found $20 hidden aboard." }
        ]
      },
      {
        "text": "Leave it",
        "outcomes": [
          { "chance": 100, "preview": "Play it safe", "effects": [], "message": "The superstitious crew sighs with relief." }
        ]
      }
    ]
  },

  {
    "name": "Calm Seas",
    "description": "The ocean is perfectly still. A rare moment of peace.",
    "type": "good",
    "choices": [
      {
        "text": "Rest and repair",
        "outcomes": [
          { "chance": 60, "preview": "Crew rests", "effects": [{ "resource": "crewHealth", "delta": 8 }, { "resource": "shipCondition", "delta": 10 }], "message": "The crew rested and patched up the ship." },
          { "chance": 40, "preview": "Great recovery", "effects": [{ "resource": "crewHealth", "delta": 15 }, { "resource": "shipCondition", "delta": 15 }], "message": "Exceptional recovery! Crew morale soaring, ship in better shape." }
        ]
      }
    ]
  },

  {
    "name": "Merchant Ship",
    "description": "A friendly merchant vessel hails you, offering to trade.",
    "type": "neutral",
    "choices": [
      {
        "text": "Buy fuel ($15)",
        "outcomes": [
          { "chance": 70, "preview": "Fair trade", "requires": { "money": 15 }, "effects": [{ "resource": "money", "delta": -15 }, { "resource": "fuel", "delta": 12 }], "message": "Bought 12 fuel for $15.", "failEffects": [], "failMessage": "Not enough money to trade." },
          { "chance": 30, "preview": "Bonus goods", "requires": { "money": 15 }, "effects": [{ "resource": "money", "delta": -15 }, { "resource": "fuel", "delta": 12 }, { "resource": "crewHealth", "delta": 5 }], "message": "Bought fuel and the merchant threw in some medicine!", "failEffects": [], "failMessage": "Not enough money to trade." }
        ]
      },
      {
        "text": "Buy cargo ($15)",
        "outcomes": [
          { "chance": 80, "preview": "Standard goods", "requires": { "money": 15 }, "effects": [{ "resource": "money", "delta": -15 }, { "resource": "cargo", "delta": 10 }], "message": "Loaded {cargo_change} tons of cargo.", "failEffects": [], "failMessage": "Not enough money to trade." },
          { "chance": 20, "preview": "Premium goods", "requires": { "money": 15 }, "effects": [{ "resource": "money", "delta": -15 }, { "resource": "cargo", "delta": 15 }], "message": "Premium goods! Loaded {cargo_change} tons for the price of 10.", "failEffects": [], "failMessage": "Not enough money to trade." }
        ]
      },
      {
        "text": "Decline",
        "outcomes": [
          { "chance": 100, "preview": "No trade", "effects": [], "message": "You wave them off and continue sailing." }
        ]
      }
    ]
  },

  {
    "name": "Dense Fog",
    "description": "A thick fog rolls in, reducing visibility to almost nothing.",
    "type": "neutral",
    "choices": [
      {
        "text": "Slow down",
        "outcomes": [
          { "chance": 80, "preview": "Safe but slow", "effects": [{ "resource": "fuel", "delta": -3 }], "message": "Navigated safely through the fog. Used extra fuel." },
          { "chance": 20, "preview": "Discover something", "effects": [{ "resource": "money", "delta": 15 }], "message": "Spotted a drifting chest in the fog! Found $15 inside." }
        ]
      },
      {
        "text": "Push through",
        "outcomes": [
          { "chance": 40, "preview": "Clear quickly", "effects": [], "message": "The fog cleared quickly. No trouble." },
          { "chance": 35, "preview": "Minor collision", "effects": [{ "resource": "shipCondition", "delta": -10 }], "message": "Hit something in the fog! Minor hull damage." },
          { "chance": 25, "preview": "Lost course", "effects": [{ "resource": "fuel", "delta": -8 }], "message": "Got completely lost in the fog. Wasted fuel finding your way back." }
        ]
      }
    ]
  },

  {
    "name": "Mysterious Island",
    "description": "An uncharted island appears through the mist. Lush and inviting.",
    "type": "neutral",
    "choices": [
      {
        "text": "Explore the island",
        "outcomes": [
          { "chance": 40, "preview": "Treasure!", "effects": [{ "resource": "money", "delta": 25 }, { "resource": "fuel", "delta": 5 }], "message": "Found a hidden cache! $25 and some fuel." },
          { "chance": 35, "preview": "Fresh water", "effects": [{ "resource": "crewHealth", "delta": 10 }, { "resource": "fuel", "delta": 5 }], "message": "Found fresh water and fruit. Crew health improved!" },
          { "chance": 25, "preview": "Hostile wildlife", "effects": [{ "resource": "crewHealth", "delta": -12 }], "message": "Dangerous wildlife! Crew injured in the retreat." }
        ]
      },
      {
        "text": "Sail past",
        "outcomes": [
          { "chance": 100, "preview": "Continue voyage", "effects": [], "message": "You sail past, wondering what might have been." }
        ]
      }
    ]
  }

];
