class Game {
  constructor() {
    this.map = new GameMap("map-canvas");
    this.ui  = new UI();

    this.state = {
      day:               1,
      money:             50,
      crewHealth:        100,
      shipCondition:     100,
      cargo:             60,
      maxCargo:          100,
      fuel:              80,
      distanceTraveled:  0,
      totalRouteDistance: 1000,
      speedPerTick:      25,
      destinationName:   this.map.ports[this.map.ports.length - 1].name,
      gameOver:          false,
    };

    this._sailing = false;
    this._tickTimer = null;
    this._busy = false;
    this._visitedPorts = new Set([0]);
    this._eventCooldown = 0;
    this._lastTickDistance = 0;

    this._bindControls();
    this._render();
    this.ui.addLog(1, `Set sail from ${this.map.ports[0].name} with ${this.state.cargo} tons of cargo!`, "port");
  }

  _bindControls() {
    document.getElementById("btn-sail").addEventListener("click", () => {
      if (this._busy) return;
      if (this._sailing) this._stopSailing();
      else this._startSailing();
    });
  }

  _startSailing() {
    if (this._sailing || this.state.gameOver) return;
    this._sailing = true;
    const btn = document.getElementById("btn-sail");
    btn.textContent = "Pause";
    btn.dataset.running = "true";
    this._scheduleNextTick();
  }

  _stopSailing() {
    this._sailing = false;
    clearTimeout(this._tickTimer);
    this._tickTimer = null;
    const btn = document.getElementById("btn-sail");
    btn.textContent = "Set Sail";
    btn.dataset.running = "false";
  }

  _scheduleNextTick() {
    if (!this._sailing || this.state.gameOver) return;
    this._tickTimer = setTimeout(() => this._doTick(), 800);
  }

  async _doTick() {
    if (this.state.gameOver || this._busy) return;
    this._busy = true;

    const s = this.state;
    s.day++;

    if (s.fuel > 0) {
      s.fuel = Math.max(0, s.fuel - 2);
      this._lastTickDistance = s.speedPerTick;
    } else {
      this._lastTickDistance = Math.floor(s.speedPerTick * 0.3);
      s.crewHealth = Math.max(0, s.crewHealth - 5);
      this.ui.addLog(s.day, "Out of fuel! Drifting. Crew losing hope.", "bad");
    }

    s.distanceTraveled += this._lastTickDistance;

    if (s.shipCondition > 0 && s.shipCondition < 20) {
      s.crewHealth = Math.max(0, s.crewHealth - 2);
      this.ui.addLog(s.day, "Ship badly damaged — taking on water.", "bad");
    }

    this._render();

    // Port arrival
    const portIndex = this._getReachedPort();
    if (portIndex !== -1) {
      this._visitedPorts.add(portIndex);
      this._stopSailing();
      this.ui.addLog(s.day, `Arrived at ${this.map.ports[portIndex].name}!`, "port");
      this._render();

      if (portIndex === this.map.ports.length - 1) {
        s.gameOver = true;
        this.ui.showGameOver(true, s);
        this._busy = false;
        return;
      }

      await this.ui.showPort(this.map.ports[portIndex].name, s);
      this._render();
      this._busy = false;
      this._startSailing();
      return;
    }

    // Random event
    if (this._eventCooldown <= 0 && shouldEventTrigger()) {
      this._eventCooldown = 2;
      this._stopSailing();
      const event = getRandomEvent();
      const result = await this.ui.showEvent(event, s);
      this.ui.addLog(s.day, result.message, result.type);
      this._render();
      this._busy = false;
      this._startSailing();
      return;
    }
    if (this._eventCooldown > 0) this._eventCooldown--;

    // Game over checks
    if (s.crewHealth <= 0) {
      s.gameOver = true;
      this._stopSailing();
      this.ui.addLog(s.day, "The crew has perished.", "bad");
      this.ui.showGameOver(false, s);
    } else if (s.shipCondition <= 0) {
      s.gameOver = true;
      this._stopSailing();
      this.ui.addLog(s.day, "The ship sank beneath the waves.", "bad");
      this.ui.showGameOver(false, s);
    }

    this._render();
    this._busy = false;

    if (this._sailing && !s.gameOver) {
      this._scheduleNextTick();
    }
  }

  _getReachedPort() {
    const s = this.state;
    const progress = s.distanceTraveled / s.totalRouteDistance;
    const prevProgress = (s.distanceTraveled - this._lastTickDistance) / s.totalRouteDistance;

    let cumulative = 0;
    for (let i = 1; i < this.map.ports.length; i++) {
      const segLen = Math.hypot(
        this.map.ports[i].nx - this.map.ports[i - 1].nx,
        this.map.ports[i].ny - this.map.ports[i - 1].ny,
      );
      cumulative += segLen;
      const portProgress = cumulative / this.map.totalDistance;

      if (!this._visitedPorts.has(i) && prevProgress < portProgress && progress >= portProgress) {
        return i;
      }
    }
    return -1;
  }

  _render() {
    const progress = this.state.distanceTraveled / this.state.totalRouteDistance;
    this.map.render(progress);
    this.ui.updateResources(this.state);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.game = new Game();
});
