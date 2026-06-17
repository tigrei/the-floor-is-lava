/* ============================================================
   game.js — Core game loop and state management
   ============================================================
   Orchestrates map, ui, and events modules.
   Tick-based: each "day" advances the ship, consumes food,
   and may trigger a random event.
   ============================================================ */

class Game {
  constructor() {
    this.map = new GameMap("map-canvas");
    this.ui  = new UI();

    // --- Game state ---
    this.state = {
      day:               1,
      food:              100,
      crewHealth:        100,
      shipCondition:     100,
      gold:              50,
      distanceTraveled:  0,
      totalRouteDistance: 1000,   // arbitrary distance units
      speedPerTick:      25,     // distance per day
      destinationName:   this.map.ports[this.map.ports.length - 1].name,
      gameOver:          false,
    };

    // Auto-sail interval handle
    this._autoInterval = null;

    // Busy flag — prevents overlapping ticks while a modal is open
    this._ticking = false;

    this._bindControls();
    this._render();
    this.ui.addLog(1, "Set sail from " + this.map.ports[0].name + "!", "port");
  }

  /* Wire up header buttons */
  _bindControls() {
    document.getElementById("btn-sail").addEventListener("click", () => {
      this.tick();
    });

    const autoBtn = document.getElementById("btn-auto");
    autoBtn.addEventListener("click", () => {
      if (this._autoInterval) {
        this._stopAuto();
      } else {
        this._startAuto();
      }
    });
  }

  _startAuto() {
    const btn = document.getElementById("btn-auto");
    btn.dataset.running = "true";
    btn.textContent = "Stop";
    this._autoInterval = setInterval(() => this.tick(), 1200);
  }

  _stopAuto() {
    const btn = document.getElementById("btn-auto");
    btn.dataset.running = "false";
    btn.textContent = "Auto-Sail";
    clearInterval(this._autoInterval);
    this._autoInterval = null;
  }

  /* --------------------------------------------------------
     Core tick — one "day" of the voyage
     -------------------------------------------------------- */
  async tick() {
    if (this.state.gameOver || this._ticking) return;
    this._ticking = true;

    const s = this.state;
    s.day++;

    // --- Travel ---
    s.distanceTraveled += s.speedPerTick;

    // --- Daily resource drain ---
    s.food = Math.max(0, s.food - 2);

    // Starvation penalty
    if (s.food === 0) {
      s.crewHealth = Math.max(0, s.crewHealth - 5);
      this.ui.addLog(s.day, "No food! Crew health is dropping.", "bad");
    }

    // Poor ship condition slows travel
    if (s.shipCondition < 20) {
      s.distanceTraveled = Math.max(0, s.distanceTraveled - Math.floor(s.speedPerTick * 0.3));
      this.ui.addLog(s.day, "Ship badly damaged — progress slowed.", "bad");
    }

    // --- Check for port arrival ---
    this._checkPortArrival();

    // --- Random event (pauses auto-sail while modal is open) ---
    if (shouldEventTrigger()) {
      const event = getRandomEvent();
      if (this._autoInterval) this._stopAuto();
      const result = await this.ui.showEvent(event, s);
      this.ui.addLog(s.day, result.message, result.type);
    }

    // --- Win/lose check ---
    if (s.distanceTraveled >= s.totalRouteDistance) {
      s.gameOver = true;
      this._stopAuto();
      this.ui.showGameOver(true, s);
    } else if (s.crewHealth <= 0) {
      s.gameOver = true;
      this._stopAuto();
      this.ui.addLog(s.day, "The crew has perished.", "bad");
      this.ui.showGameOver(false, s);
    } else if (s.shipCondition <= 0) {
      s.gameOver = true;
      this._stopAuto();
      this.ui.addLog(s.day, "The ship sank beneath the waves.", "bad");
      this.ui.showGameOver(false, s);
    }

    this._render();
    this._ticking = false;
  }

  /* Detect if we just crossed a port threshold and log it */
  _checkPortArrival() {
    const s = this.state;
    const progress = s.distanceTraveled / s.totalRouteDistance;
    const ports = this.map.ports;

    // Check each intermediate port
    let cumulative = 0;
    for (let i = 1; i < ports.length - 1; i++) {
      const segLen = Math.hypot(
        ports[i].nx - ports[i - 1].nx,
        ports[i].ny - ports[i - 1].ny,
      );
      cumulative += segLen;
      const portProgress = cumulative / this.map.totalDistance;

      // Fire once when we cross the port threshold
      const prevProgress = (s.distanceTraveled - s.speedPerTick) / s.totalRouteDistance;
      if (prevProgress < portProgress && progress >= portProgress) {
        // Port arrival bonus
        s.food = Math.min(100, s.food + 10);
        s.crewHealth = Math.min(100, s.crewHealth + 5);
        this.ui.addLog(s.day, `Arrived at ${ports[i].name}! Resupplied.`, "port");
      }
    }
  }

  /* Render map and sidebar */
  _render() {
    const progress = this.state.distanceTraveled / this.state.totalRouteDistance;
    this.map.render(progress);
    this.ui.updateResources(this.state);
  }
}

/* ============================================================
   Boot the game when the DOM is ready
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  window.game = new Game();
});
