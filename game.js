class Game {
  constructor() {
    this.map = new GameMap("map-canvas");
    this.ui = new UI(this);

    this.state = {
      day: 1,
      currentPort: 11,
      traveling: false,
      travelFrom: null,
      travelTo: null,
      travelElapsed: 0,
      travelDaysRemaining: 0,
      cargo: {},
      maxCargo: 100,
      gameOver: false,
    };

    this.score = { fulfilled: 0, failed: 0, onTime: 0, late: 0, tonnageDelivered: 0, totalRequests: 0 };
    this.requests = [];
    this._nextId = 1;
    this._nextRequestDay = 0;
    this._tickTimer = null;

    this._generateRequest();
    this._generateRequest();
    this._generateRequest();
    this._nextRequestDay = this.state.day + 8;

    this._render();
    this.ui.renderSidebar();
    this.ui.addLog(1, `Docked at ${this.map.ports[this.state.currentPort].name}. Three supply requests are active.`, "port");
  }

  getCargoTotal() {
    return Object.values(this.state.cargo).reduce((a, b) => a + b, 0);
  }

  getRequestPorts() {
    const s = new Set();
    for (const r of this.requests) { if (r.status === "active") s.add(r.destination); }
    return s;
  }

  getRequestsAtPort(portIndex) {
    return this.requests.filter(r => r.status === "active" && r.destination === portIndex);
  }

  // --- Travel ---

  startTravel(targetPort) {
    const days = this.map.getTravelTime(this.state.currentPort, targetPort);
    if (days === null || this.state.traveling || this.state.gameOver) return;
    if (this.isPortContested(targetPort)) {
      this.ui.addLog(this.state.day, `Cannot set course to ${this.map.ports[targetPort].name} — port is contested.`, "bad");
      return;
    }
    const s = this.state;
    s.traveling = true;
    s.travelFrom = s.currentPort;
    s.travelTo = targetPort;
    s.travelElapsed = 0;
    s.travelDaysRemaining = days;
    s.currentPort = null;
    this.ui.addLog(s.day, `Underway to ${this.map.ports[targetPort].name}. ETA: ${days} day${days > 1 ? "s" : ""}.`, "port");
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
      this.ui.addLog(state.day, message, "neutral");
      this._render();
      this.ui.renderSidebar();
    }

    if (shouldPortResupply()) {
      const randomize = (arr) => {
        const randNum = Math.floor(Math.random() * arr.length) + 1;
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, randNum);
        return selected
      }

      const basePorts = this.map.ports.filter((port) => port.type === "base");
      const selectedBases = randomize(basePorts)

      selectedBases.forEach((base) => {
        const materials = Object.keys(base.inventory)
        if (materials.length === 0) {
          throw new Error("Empty inventory. We should not have gotten here")
        }

        const selectedMaterials = randomize(materials)
        const logOutput = selectedMaterials.map(material => {
          return `\t- ${material}`
        }).join('\n')

        selectedMaterials.forEach((material) => {
          let currentValue = base.inventory[material]

          // Generate random integer greater than existing value
          const min = currentValue + 1;
          const max = currentValue + 100;
          const newValue = Math.floor(Math.random() * (max - min + 1)) + min;
          base.inventory[material] = newValue
        })

        this.ui.addLog(state.day, `${base.name} Resupplied!\n${logOutput}`, "good")
      })
    }

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
    const req = this.requests.find(r => r.id === requestId);
    if (!req || req.status !== "active") return;
    for (const [type, needed] of Object.entries(req.remaining)) {
      const have = this.state.cargo[type] || 0;
      const stillNeed = needed - have;
      if (stillNeed > 0) this.loadCargo(type, stillNeed);
    }
  }

  // --- Delivery ---

  deliverCargo(requestId) {
    const req = this.requests.find(r => r.id === requestId);
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
    return this.requests.some(r => r.destination === portIndex && r.status === "contested");
  }

  _getSuppliedNeighborsCount(portIndex) {
    const connected = this.map.getConnected(portIndex);
    let count = 0;
    for (const conn of connected) {
      const neighborPort = this.map.ports[conn.port];
      if (neighborPort.type === "base") {
        count++;
      } else {
        const hasActiveOrContested = this.requests.some(r => 
          r.destination === conn.port && 
          (r.status === "active" || r.status === "contested")
        );
        if (!hasActiveOrContested) {
          count++;
        }
      }
    }
    return count;
  }

  getContestedPorts() {
    const s = new Set();
    for (const r of this.requests) {
      if (r.status === "contested") s.add(r.destination);
    }
    return s;
  }

  // --- Requests ---

  _generateRequest() {
    const sites = this.map.ports.map((p, i) => ({ p, i })).filter(x => x.p.type === "site");
    const taken = new Set(this.requests.filter(r => r.status === "active" || r.status === "contested").map(r => r.destination));
    const avail = sites.filter(s => !taken.has(s.i));
    if (avail.length === 0) return;

    const site = avail[Math.floor(Math.random() * avail.length)];
    const tmpl = REQUEST_TEMPLATES[Math.floor(Math.random() * REQUEST_TEMPLATES.length)];
    const urgency = tmpl.urgencyPool[Math.floor(Math.random() * tmpl.urgencyPool.length)];
    const stageDaysLeft = { low: 10, medium: 8, high: 6 }[urgency];

    this.requests.push({
      id: this._nextId++,
      destination: site.i,
      destinationName: site.p.name,
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
      this.ui.addLog(this.state.day, `New request: ${tmpl.mission} → ${site.p.name} [${urgency.toUpperCase()}]`, "port");
    }
  }

  _maybeGenerateRequest() {
    const active = this.requests.filter(r => r.status === "active" || r.status === "contested").length;
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
              req.stageDaysLeft = 8;
              this.ui.addLog(this.state.day, `Escalation: Request at ${req.destinationName} is now MEDIUM urgency.`, "neutral");
            } else if (req.urgency === "medium") {
              req.urgency = "high";
              req.stageDaysLeft = 6;
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
    this.map.render(this.state, this.getRequestPorts(), this.getContestedPorts());
    document.getElementById("day-counter").textContent = `Day ${this.state.day}`;
    document.getElementById("score-display").textContent = `Delivered: ${this.score.fulfilled}/${this.score.totalRequests}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.game = new Game();
});
