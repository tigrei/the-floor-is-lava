class Game {
  static MAX_WAIT_DAYS = 3; // days held before the crew may brave a storm-blocked lane

  constructor() {
    this.map = new GameMap("map-canvas");
    this.ui = new UI(this);

    this.state = {
      day: 1,
      currentPort: 1,
      traveling: false,
      travelFrom: null,
      travelTo: null,
      travelElapsed: 0,
      travelDaysRemaining: 0,
      waiting: false,
      waitElapsed: 0,
      cargo: {},
      maxCargo: 100,
      gameOver: false,
    };

    this.score = { fulfilled: 0, failed: 0, onTime: 0, late: 0, tonnageDelivered: 0, totalRequests: 0 };
    this.requests = [];
    this._nextId = 1;
    this._nextRequestDay = 0;
    this._tickTimer = null;

    this._initBaseInventories();

    this.weather = new WeatherSystem();
    this.weather.load().then(label => {
      this.ui.addLog(1, `Weather pattern active: ${label}`, "neutral");
      this._render();
      this.ui.renderSidebar();
    });

    this._generateRequest();
    this._generateRequest();
    this._generateRequest();
    this._nextRequestDay = this.state.day + 8;

    this._render();
    this.ui.renderSidebar();
    this.ui.addLog(1, `Docked at ${this.map.ports[this.state.currentPort].name}. Three supply requests are active.`, "port");
    this.ui.showScenarioBrief();
  }

  _initBaseInventories() {
    for (const port of this.map.ports) {
      const scenario = BASE_STARTING_INVENTORIES.find(entry => entry.name === port.name);
      if (scenario) {
        port.inventory = { ...scenario.inventory };
      } else {
        port.inventory = {};
      }
    }
  }

  getCargoTotal() {
    return Object.values(this.state.cargo).reduce((sum, amount) => sum + amount, 0);
  }

  getRequestPorts() {
    const activePorts = new Set();
    for (const request of this.requests) { if (request.status === "active") activePorts.add(request.destination); }
    return activePorts;
  }

  getRequestsAtPort(portIndex) {
    return this.requests.filter(request => request.status === "active" && request.destination === portIndex);
  }

  // --- Travel ---

  startTravel(targetPort) {
    const days = this.map.getTravelTime(this.state.currentPort, targetPort);
    if (days === null || this.state.traveling || this.state.gameOver) return;
    if (this.isPortContested(targetPort)) {
      this.ui.addLog(this.state.day, `Cannot set course to ${this.map.ports[targetPort].name} — port is contested.`, "bad");
      return;
    }
    if (this.isRouteWeatherBlocked(this.state.currentPort, targetPort)) {
      this.ui.addLog(this.state.day, `Cannot transit to ${this.map.ports[targetPort].name} — route blocked by storm. Hold position to wait it out.`, "bad");
      return;
    }
    const state = this.state;
    state.traveling = true;
    state.travelFrom = state.currentPort;
    state.travelTo = targetPort;
    state.travelElapsed = 0;
    state.travelDaysRemaining = days;
    state.currentPort = null;
    this.ui.addLog(state.day, `Underway to ${this.map.ports[targetPort].name}. ETA: ${days} day${days > 1 ? "s" : ""}.`, "port");
    this._render();
    this.ui.renderSidebar();
    this._scheduleTick();
  }

  _scheduleTick() {
    if (!this.state.traveling || this.state.gameOver) return;
    this._tickTimer = setTimeout(() => this._doTick(), 900);
  }

  async _doTick() {
    const state = this.state;
    state.day++;
    state.travelElapsed++;
    state.travelDaysRemaining = Math.max(0, state.travelDaysRemaining - 1);

    this._checkDeadlines();
    this._maybeGenerateRequest();
    this._render();
    this.ui.renderSidebar();

    if (shouldEventTrigger()) {
      const event = getRandomEvent();
      const message = await this.ui.showEvent(event, state);
      this.ui.addLog(state.day, `⚠ ${event.name} — ${message}`, "event");
      this._render();
      this.ui.renderSidebar();
    }

    if (shouldPortResupply()) this._maybeResupply(state.day);

    if (state.travelDaysRemaining <= 0) {
      state.traveling = false;
      state.currentPort = state.travelTo;
      state.travelFrom = null;
      state.travelTo = null;
      this.ui.addLog(state.day, `Arrived at ${this.map.ports[state.currentPort].name}.`, "port");
      this._render();
      this.ui.renderSidebar();
      return;
    }

    if (state.day >= 60) {
      this._endGame();
      return;
    }

    this._scheduleTick();
  }

  _maybeResupply(day) {
    const randomize = (arr) => {
      const randNum = Math.floor(Math.random() * arr.length) + 1;
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, randNum);
    };

    const basePorts = this.map.ports.filter((port) => port.type === "base");
    const selectedBases = randomize(basePorts);

    selectedBases.forEach((base) => {
      const materials = Object.keys(base.inventory);
      if (materials.length === 0) return;

      const selectedMaterials = randomize(materials);
      const logOutput = selectedMaterials.map(material => `\t- ${material}`).join('\n');

      selectedMaterials.forEach((material) => {
        const currentValue = base.inventory[material];
        const min = currentValue + 1;
        const max = currentValue + 50;
        base.inventory[material] = Math.floor(Math.random() * (max - min + 1)) + min;
      });

      this.ui.addLog(day, `${base.name} Resupplied!\n${logOutput}`, "good");
    });
  }

  // --- Weather hold ---

  // A connected route the ship could actually take right now (not contested, not storm-blocked).
  _hasOpenRoute() {
    if (this.state.currentPort == null) return true;
    const conns = this.map.getConnected(this.state.currentPort);
    return conns.some(({ port }) =>
      !this.isPortContested(port) && !this.isRouteWeatherBlocked(this.state.currentPort, port));
  }

  // True when every way out is blocked by weather/contested — the ship is stranded.
  isStranded() {
    if (this.state.currentPort == null) return false;
    const conns = this.map.getConnected(this.state.currentPort);
    return conns.length > 0 && !this._hasOpenRoute();
  }

  // Hold position and let days pass (paying the deadline penalty). Stops early if a
  // lane reopens; after MAX_WAIT_DAYS the crew braves the storm and may push through.
  holdPosition() {
    const state = this.state;
    if (state.traveling || state.waiting || state.gameOver || state.currentPort == null) return;
    state.waiting = true;
    state.waitElapsed = 0;
    this.ui.addLog(state.day, `Holding position at ${this.map.ports[state.currentPort].name} to wait out the weather.`, "port");
    this._render();
    this.ui.renderSidebar();
    this._scheduleWaitTick();
  }

  _scheduleWaitTick() {
    if (!this.state.waiting || this.state.gameOver) return;
    this._tickTimer = setTimeout(() => this._doWaitTick(), 700);
  }

  _doWaitTick() {
    const state = this.state;
    state.day++;
    state.waitElapsed++;

    this._checkDeadlines();
    this._maybeGenerateRequest();
    if (shouldPortResupply()) this._maybeResupply(state.day);
    this._render();
    this.ui.renderSidebar();

    if (state.day >= 60) {
      state.waiting = false;
      this._endGame();
      return;
    }

    if (this._hasOpenRoute()) {
      state.waiting = false;
      this.ui.addLog(state.day, `Seas have eased — lanes are open from ${this.map.ports[state.currentPort].name}.`, "good");
      this._render();
      this.ui.renderSidebar();
      return;
    }

    // Crew has weathered it — force the storm to break so seas subside and lanes reopen.
    if (state.waitElapsed >= Game.MAX_WAIT_DAYS) {
      state.waiting = false;
      this.weather.calm(state.day);
      this.ui.addLog(state.day, `The storm has broken after ${state.waitElapsed} days of holding — seas are subsiding and lanes are reopening.`, "good");
      this._render();
      this.ui.renderSidebar();
      return;
    }

    this._scheduleWaitTick();
  }

  // --- Cargo ---

  loadCargo(type, amount) {
    const port = this.map.ports[this.state.currentPort];
    if (!port || port.type !== "base") return;
    const baseHas = port.inventory[type] || 0;
    const space = this.state.maxCargo - this.getCargoTotal();
    const actual = Math.min(amount, baseHas, space);
    if (actual <= 0) return;
    port.inventory[type] -= actual;
    this.state.cargo[type] = (this.state.cargo[type] || 0) + actual;
    this._render();
    this.ui.renderSidebar();
  }

  unloadAll() {
    const port = this.map.ports[this.state.currentPort];
    if (!port || port.type !== "base") return;
    for (const [type, amt] of Object.entries(this.state.cargo)) {
      port.inventory[type] = (port.inventory[type] || 0) + amt;
    }
    this.state.cargo = {};
    this._render();
    this.ui.renderSidebar();
  }

  quickLoad(requestId) {
    const req = this.requests.find(request => request.id === requestId);
    if (!req || req.status !== "active")
      return;

    for (const [type, needed] of Object.entries(req.remaining)) {
      const totalNeededAcrossRequests = this.requests.map(request => request.remaining[type] || 0).reduce((sum, amount) => sum + amount, 0);
      const have = this.state.cargo[type] || 0;
      if (totalNeededAcrossRequests > have) {
        const totalStillNeeded = totalNeededAcrossRequests - have;
        const totalToLoad = Math.min(totalStillNeeded, needed);
        this.loadCargo(type, totalToLoad);
      }
    }
  }

  // --- Delivery ---

  deliverCargo(requestId) {
    const req = this.requests.find(request => request.id === requestId);
    if (!req || req.status !== "active" || req.destination !== this.state.currentPort) return;
    let delivered = 0;
    for (const type of Object.keys(req.remaining)) {
      const have = this.state.cargo[type] || 0;
      if (have > 0) {
        const amt = Math.min(have, req.remaining[type]);
        this.state.cargo[type] -= amt;
        if (this.state.cargo[type] <= 0) delete this.state.cargo[type];
        req.remaining[type] -= amt;
        if (req.remaining[type] <= 0) delete req.remaining[type];
        delivered += amt;
      }
    }
    this.score.tonnageDelivered += delivered;

    if (Object.keys(req.remaining).length === 0) {
      req.status = "fulfilled";
      req.fulfilledDay = this.state.day;
      this.score.fulfilled++;
      if (this.state.day <= req.deadline) this.score.onTime++; else this.score.late++;
      this.ui.addLog(this.state.day, `Request FULFILLED: ${req.mission}`, "good");
    } else if (delivered > 0) {
      this.ui.addLog(this.state.day, `Partial delivery: ${delivered}t to ${req.destinationName}. More supplies needed.`, "neutral");
    }
    this._render();
    this.ui.renderSidebar();
  }

  // --- Requests ---

  isPortContested(portIndex) {
    return this.requests.some(request => request.destination === portIndex && request.status === "contested");
  }

  _getSuppliedNeighborsCount(portIndex) {
    const connected = this.map.getConnected(portIndex);
    let count = 0;
    for (const conn of connected) {
      const neighborPort = this.map.ports[conn.port];
      if (neighborPort.type === "base") {
        count++;
      } else {
        const hasActiveOrContested = this.requests.some(request =>
          request.destination === conn.port &&
          (request.status === "active" || request.status === "contested")
        );
        if (!hasActiveOrContested) {
          count++;
        }
      }
    }
    return count;
  }

  getContestedPorts() {
    const contestedPorts = new Set();
    for (const request of this.requests) {
      if (request.status === "contested") contestedPorts.add(request.destination);
    }
    return contestedPorts;
  }

  isRouteWeatherBlocked(fromIdx, toIdx) {
    return this.weather.isRouteBlocked(
      this.map.ports[fromIdx],
      this.map.ports[toIdx],
      this.state.day
    );
  }

  getWeatherBlockedRoutes() {
    const blocked = new Set();
    for (const [portA, portB] of this.map.connections) {
      if (this.weather.isRouteBlocked(this.map.ports[portA], this.map.ports[portB], this.state.day)) {
        blocked.add(`${Math.min(portA, portB)}-${Math.max(portA, portB)}`);
      }
    }
    return blocked;
  }

  // --- Requests ---

  _generateRequest() {
    const sites = this.map.ports.map((port, index) => ({ port, index })).filter(entry => entry.port.type === "site");
    const taken = new Set(this.requests.filter(request => request.status === "active" || request.status === "contested").map(request => request.destination));
    const avail = sites.filter(site => !taken.has(site.index));
    if (avail.length === 0) return;

    const site = avail[Math.floor(Math.random() * avail.length)];
    const tmpl = REQUEST_TEMPLATES[Math.floor(Math.random() * REQUEST_TEMPLATES.length)];
    const urgency = tmpl.urgencyPool[Math.floor(Math.random() * tmpl.urgencyPool.length)];
    const stageDaysLeft = { low: 15, medium: 12, high: 10 }[urgency];

    this.requests.push({
      id: this._nextId++,
      destination: site.index,
      destinationName: site.port.name,
      supplies: { ...tmpl.supplies },
      remaining: { ...tmpl.supplies },
      stageDaysLeft,
      urgency,
      mission: tmpl.mission,
      status: "active",
      createdDay: this.state.day,
      fulfilledDay: null,
    });
    this.score.totalRequests++;
    if (this.state.day > 1) {
      this.ui.addLog(this.state.day, `New request: ${tmpl.mission} → ${site.port.name} [${urgency.toUpperCase()}]`, "port");
    }
  }

  _maybeGenerateRequest() {
    const active = this.requests.filter(request => request.status === "active" || request.status === "contested").length;
    if (this.state.day >= this._nextRequestDay && active < 5) {
      this._generateRequest();
      this._nextRequestDay = this.state.day + 7 + Math.floor(Math.random() * 4);
    }
  }

  _checkDeadlines() {
    for (const req of this.requests) {
      if (req.status !== "active" && req.status !== "contested") continue;

      if (req.status === "active") {
        if (req.urgency === "critical") {
          // Roll chance each day to become contested
          if (Math.random() < 0.20) {
            req.status = "contested";
            req.urgency = "contested";
            req.stageDaysLeft = 12; // Base 12 days to recover
            this.score.failed++; // Counts as an incident/failure
            this.ui.addLog(this.state.day, `CRITICAL: ${req.destinationName} is now CONTESTED! Sea lanes blocked.`, "bad");
          }
        } else {
          req.stageDaysLeft--;
          if (req.stageDaysLeft <= 0) {
            if (req.urgency === "low") {
              req.urgency = "medium";
              req.stageDaysLeft = 12;
              this.ui.addLog(this.state.day, `Escalation: Request at ${req.destinationName} is now MEDIUM urgency.`, "neutral");
            } else if (req.urgency === "medium") {
              req.urgency = "high";
              req.stageDaysLeft = 10;
              this.ui.addLog(this.state.day, `Escalation: Request at ${req.destinationName} is now HIGH urgency!`, "bad");
            } else if (req.urgency === "high") {
              req.urgency = "critical";
              this.ui.addLog(this.state.day, `CRITICAL: Request at ${req.destinationName} is now CRITICAL. Port is at risk!`, "bad");
            }
          }
        }
      } else if (req.status === "contested") {
        const suppliedNeighbors = this._getSuppliedNeighborsCount(req.destination);
        const recoverySpeed = 1 + suppliedNeighbors;
        req.stageDaysLeft -= recoverySpeed;

        if (req.stageDaysLeft <= 0) {
          req.status = "active";
          req.urgency = "high";
          req.stageDaysLeft = 8; // 8 days at high to fulfill after recovery
          this.ui.addLog(this.state.day, `Secured: ${req.destinationName} is no longer contested. Sea lanes reopened.`, "good");
        }
      }
    }
  }

  _endGame() {
    this.state.gameOver = true;
    clearTimeout(this._tickTimer);
    for (const req of this.requests) {
      if (req.status === "active" || req.status === "contested") {
        if (req.status === "active") {
          req.status = "expired";
          this.score.failed++;
        } else {
          req.status = "expired";
        }
      }
    }
    this.ui.showGameOver(this.score);
  }

  _render() {
    this.map.render(this.state, this.getRequestPorts(), this.getContestedPorts(), this.getWeatherBlockedRoutes());
    document.getElementById("day-counter").textContent = `Day ${this.state.day}`;
    document.getElementById("score-display").innerHTML = `Delivered: ${this.score.fulfilled}&ensp;<span class="failed-section">Failed: ${this.score.failed}</span>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.game = new Game();
});
