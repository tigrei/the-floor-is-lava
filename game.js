class Game {
  constructor() {
    this.map = new GameMap("map-canvas");
    this.ui  = new UI();

    this.state = {
      day:               1,
      funds:             50,
      deterrence:        0,
      crewHealth:        100,
      shipCondition:     100,
      cargo:             80,
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
    this._dangerLevel = 0;

    this._bindControls();
    this._render();
    this.ui.addLog(1, `Departing ${this.map.ports[0].name}. ${this.state.cargo} tons of mission cargo loaded. First Island Chain — hold the line.`, "port");
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
    btn.textContent = "All Stop";
    btn.dataset.running = "true";
    this._scheduleNextTick();
  }

  _stopSailing() {
    this._sailing = false;
    clearTimeout(this._tickTimer);
    this._tickTimer = null;
    const btn = document.getElementById("btn-sail");
    btn.textContent = "Ahead Full";
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
      this.ui.addLog(s.day, "Fuel exhausted. Drifting on current. Crew readiness declining.", "bad");
    }

    s.distanceTraveled += this._lastTickDistance;

    if (s.shipCondition > 0 && s.shipCondition < 20) {
      s.crewHealth = Math.max(0, s.crewHealth - 2);
      this.ui.addLog(s.day, "Hull critically damaged — taking on water.", "bad");
    }

    this._checkDeadlines();
    this._render();

    // Port arrival
    const portIndex = this._getReachedPort();
    if (portIndex !== -1) {
      this._visitedPorts.add(portIndex);
      const port = this.map.ports[portIndex];

      if (port.state === "fallen") {
        this.ui.addLog(s.day, `Passing ${port.name} — fallen to enemy forces. Too dangerous to dock.`, "bad");
        this._render();
        this._busy = false;
        if (this._sailing) this._scheduleNextTick();
        return;
      }

      this._stopSailing();
      this.ui.addLog(s.day, `Arrived at ${port.name}.`, "port");
      this._render();

      if (portIndex === this.map.ports.length - 1) {
        if (port.mission && s.cargo >= 1) {
          await this.ui.showPort(port, s);
          this._render();
        }
        s.gameOver = true;
        this.ui.showGameOver(true, s, this.map.ports);
        this._busy = false;
        return;
      }

      await this.ui.showPort(port, s);
      this._render();
      this._busy = false;
      this._startSailing();
      return;
    }

    // Random event
    if (this._eventCooldown <= 0 && shouldEventTrigger(this._dangerLevel)) {
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
      this.ui.addLog(s.day, "All hands lost. Mission failed.", "bad");
      this.ui.showGameOver(false, s, this.map.ports);
    } else if (s.shipCondition <= 0) {
      s.gameOver = true;
      this._stopSailing();
      this.ui.addLog(s.day, "Hull breach — the ship is going down.", "bad");
      this.ui.showGameOver(false, s, this.map.ports);
    }

    this._render();
    this._busy = false;

    if (this._sailing && !s.gameOver) {
      this._scheduleNextTick();
    }
  }

  _checkDeadlines() {
    for (const port of this.map.ports) {
      if (port.state === "contested" && port.mission &&
          this.state.day > port.mission.deadline &&
          port.mission.delivered < port.mission.cargoRequired) {
        port.state = "fallen";
        this._dangerLevel += 0.10;
        this.ui.addLog(this.state.day, `${port.name} has FALLEN. ${port.mission.name} failed. Enemy interdiction range expanding.`, "bad");
      }
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
