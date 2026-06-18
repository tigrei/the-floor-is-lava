class UI {
  constructor(game) {
    this.game = game;
    this.els = {
      shipStatus:   document.getElementById("ship-status"),
      actionsPanel: document.getElementById("actions-panel"),
      requestsPanel: document.getElementById("requests-panel"),
      logEntries:   document.getElementById("log-entries"),
      overlay:      document.getElementById("modal-overlay"),
      modalTitle:   document.getElementById("modal-title"),
      modalBody:    document.getElementById("modal-body"),
      modalChoices: document.getElementById("modal-choices"),
    };

    // port catalog
    this.portCatalog = {};
    for (const port of PORTS) {
      if (port.type === "base")
        this.portCatalog[port.name] = Object.keys(port.inventory);
    }
    console.log(this.portCatalog);
  }

  renderSidebar() {
    this._renderShipStatus();
    this._renderActions();
    this._renderRequests();
  }

  _renderShipStatus() {
    const s = this.game.state;
    const total = this.game.getCargoTotal();
    const loc = s.traveling
      ? `In transit → ${this.game.map.ports[s.travelTo].name} (${s.travelDaysRemaining}d remaining)`
      : `Docked at ${this.game.map.ports[s.currentPort].name}`;

    let cargoHtml = "";
    for (const [type, amt] of Object.entries(s.cargo)) {
      if (amt > 0) cargoHtml += `<div class="cargo-row"><span>${SUPPLY_TYPES[type].short}</span><span>${amt}t</span></div>`;
    }
    if (!cargoHtml) cargoHtml = '<div class="cargo-empty">Empty</div>';

    this.els.shipStatus.innerHTML =
      `<h2>Ship Status</h2>` +
      `<div class="ship-location">${loc}</div>` +
      `<div class="cargo-bar"><span>Cargo</span><span>${total} / ${s.maxCargo}t</span></div>` +
      `<div class="cargo-bar-visual"><div class="cargo-bar-fill" style="width:${(total / s.maxCargo) * 100}%"></div></div>` +
      `<div class="cargo-list">${cargoHtml}</div>`;
  }

  _renderActions() {
    const s = this.game.state;
    if (s.traveling || s.gameOver) {
      this.els.actionsPanel.innerHTML = "";
      return;
    }

    const port = this.game.map.ports[s.currentPort];
    let html = `<h2>${port.type === "base" ? "Base Operations" : "Site Operations"}</h2>`;

    // Delivery section (site with active requests)
    const reqs = this.game.getRequestsAtPort(s.currentPort);
    if (reqs.length > 0) {
      for (const req of reqs) {
        html += `<div class="action-section"><div class="section-label">DELIVERY: ${req.mission}</div>`;
        html += `<div class="delivery-grid">`;
        for (const [type, needed] of Object.entries(req.remaining)) {
          const have = s.cargo[type] || 0;
          const ok = have >= needed;
          html += `<div class="delivery-row">` +
            `<span>${SUPPLY_TYPES[type].short}</span>` +
            `<span>Need ${needed}t</span>` +
            `<span>Have ${have}t</span>` +
            `<span class="${ok ? "status-ok" : "status-need"}">${ok ? "Ready" : "Short"}</span></div>`;
        }
        html += `</div>`;
        html += `<button class="btn-action btn-deliver" onclick="game.deliverCargo(${req.id})">Deliver Available Cargo</button>`;
        html += `</div>`;
      }
    }

    // Loading section (base)
    if (port.type === "base") {
      html += `<div class="action-section"><div class="section-label">LOAD SUPPLIES</div>`;
      const types = Object.keys(SUPPLY_TYPES);
      for (const type of types) {
        const stock = port.inventory[type] || 0;
        if (stock <= 0 && !this.portCatalog[port.name].includes(type)) continue;
        const shipHas = s.cargo[type] || 0;
        html += `<div class="load-row">` +
          `<span class="load-name">${SUPPLY_TYPES[type].short}</span>` +
          `<span class="load-stock">${stock}t</span>` +
          `<span class="load-ship">${shipHas}t</span>` +
          `<button class="btn-sm" onclick="game.loadCargo('${type}',5)">+5</button>` +
          `<button class="btn-sm" onclick="game.loadCargo('${type}',999)">All</button>` +
          `</div>`;
      }
      html += `<button class="btn-action btn-unload" onclick="game.unloadAll()">Unload All Cargo</button>`;

      // Quick load buttons for active requests
      const active = this.game.requests.filter(r => r.status === "active");
      if (active.length > 0) {
        html += `<div class="section-label" style="margin-top:8px">QUICK LOAD FOR REQUEST</div>`;
        for (const req of active) {
          html += `<button class="btn-action btn-quickload" onclick="game.quickLoad(${req.id})">Load for: ${req.destinationName}</button>`;
        }
      }
      html += `</div>`;
    }

    // Navigation
    const connected = this.game.map.getConnected(s.currentPort);
    html += `<div class="action-section"><div class="section-label">NAVIGATE</div>`;
    for (const { port: idx, days } of connected) {
      const target = this.game.map.ports[idx];
      const hasReq = this.game.getRequestsAtPort(idx).length > 0;
      const isContested = this.game.isPortContested(idx);
      
      let badge = "";
      if (isContested) {
        badge = '<span class="nav-badge contested">CONTESTED</span>';
      } else if (target.type === "base") {
        badge = '<span class="nav-badge base">BASE</span>';
      } else if (hasReq) {
        badge = '<span class="nav-badge request">REQ</span>';
      }

      const disabledAttr = isContested ? "disabled" : "";
      const daysText = isContested ? "Blocked" : `${days}d`;

      html += `<button class="btn-nav" ${disabledAttr} onclick="game.startTravel(${idx})">` +
        `<span>${target.name} ${badge}</span><span class="nav-days">${daysText}</span></button>`;
    }
    html += `</div>`;

    this.els.actionsPanel.innerHTML = html;
  }

  _renderRequests() {
    const active = this.game.requests.filter(r => r.status === "active" || r.status === "contested");
    const recent = this.game.requests.filter(r => r.status === "fulfilled" || r.status === "expired").slice(-3);

    let html = `<h2>Active Requests (${active.length})</h2>`;
    if (active.length === 0) html += `<div class="no-requests">No active requests</div>`;

    for (const req of active) {
      const isCont = req.status === "contested";
      const urgClass = isCont ? "urg-contested" : (req.urgency === "critical" || req.urgency === "high" ? "urg-high" : (req.urgency === "medium" ? "urg-med" : "urg-low"));
      
      let badgeText = isCont ? "CONTESTED" : req.urgency.toUpperCase();
      let supplyList = isCont 
        ? "Communications lost. Awaiting recovery."
        : Object.entries(req.remaining).map(([t, n]) => `${SUPPLY_TYPES[t].short} ${n}t`).join(", ");
      
      let deadlineText = isCont
        ? `Recovery ETA: ${req.stageDaysLeft} days (-${1 + this.game._getSuppliedNeighborsCount(req.destination)}d/d)`
        : (req.urgency === "critical" ? `Status: AT RISK (Rolls daily for Contested)` : `Deadline: Day ${this.game.state.day + req.stageDaysLeft} (${req.stageDaysLeft}d left)`);

      html += `<div class="request-card ${urgClass}">` +
        `<div class="req-header"><span class="req-dest">${req.destinationName}</span>` +
        `<span class="req-urgency">${badgeText}</span></div>` +
        `<div class="req-mission">${req.mission}</div>` +
        `<div class="req-supplies">${isCont ? "" : "Needs: "}${supplyList}</div>` +
        `<div class="req-deadline ${!isCont && req.stageDaysLeft <= 3 ? "deadline-urgent" : ""}">${deadlineText}</div>` +
        `</div>`;
    }

    if (recent.length > 0) {
      html += `<div class="section-label" style="margin-top:12px">RECENT</div>`;
      for (const req of recent) {
        const cls = req.status === "fulfilled" ? "req-done" : "req-failed";
        html += `<div class="request-mini ${cls}">${req.status === "fulfilled" ? "Fulfilled" : "Expired"}: ${req.destinationName}</div>`;
      }
    }

    this.els.requestsPanel.innerHTML = html;
  }

  showEvent(event, state) {
    return new Promise((resolve) => {
      this.els.modalTitle.textContent = event.name;
      this.els.modalBody.textContent  = event.description;
      this.els.modalChoices.innerHTML = "";

      event.choices.forEach((choice) => {
        const div = document.createElement("div");
        div.className = "choice-option";
        const btn = document.createElement("button");
        btn.textContent = choice.text;
        btn.addEventListener("click", () => {
          const outcome = resolveOutcome(choice);
          const message = applyEventOutcome(outcome, state);
          this.els.modalBody.textContent = message;
          this.els.modalChoices.innerHTML = "";
          const cont = document.createElement("button");
          cont.textContent = "Continue";
          cont.addEventListener("click", () => { this.hideModal(); resolve(message); });
          this.els.modalChoices.appendChild(cont);
        });
        const hints = document.createElement("div");
        hints.className = "choice-outcomes";
        choice.outcomes.forEach(o => {
          const sp = document.createElement("span");
          sp.textContent = `${o.chance}% — ${o.preview}`;
          hints.appendChild(sp);
        });
        div.append(btn, hints);
        this.els.modalChoices.appendChild(div);
      });

      this.els.overlay.classList.remove("hidden");
    });
  }

  hideModal() { this.els.overlay.classList.add("hidden"); }

  addLog(day, message, type = "neutral") {
    const li = document.createElement("li");
    li.textContent = `Day ${day}: ${message}`;
    const cls = { bad: "event-bad", good: "event-good", port: "event-port" };
    if (cls[type]) li.classList.add(cls[type]);
    this.els.logEntries.prepend(li);
    while (this.els.logEntries.children.length > 40) this.els.logEntries.lastChild.remove();
  }

  showGameOver(score) {
    this.els.modalTitle.textContent = "Mission Complete — 60-Day Report";
    this.els.modalBody.innerHTML =
      `<div class="game-over-stats">` +
      `<p>Requests Fulfilled: <b>${score.fulfilled} / ${score.totalRequests}</b></p>` +
      `<p>On Time: <b>${score.onTime}</b> | Late: <b>${score.late}</b> | Failed: <b>${score.failed}</b></p>` +
      `<p>Total Tonnage Delivered: <b>${score.tonnageDelivered}t</b></p>` +
      `<p>Fulfillment Rate: <b>${score.totalRequests > 0 ? Math.round((score.fulfilled / score.totalRequests) * 100) : 0}%</b></p>` +
      `</div>`;
    this.els.modalChoices.innerHTML = "";
    const btn = document.createElement("button");
    btn.textContent = "Play Again";
    btn.addEventListener("click", () => { this.hideModal(); window.location.reload(); });
    this.els.modalChoices.appendChild(btn);
    this.els.overlay.classList.remove("hidden");
  }
}
