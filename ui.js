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
      toastContainer: document.getElementById("toast-container"),
    };

    this.els.shipStatus.addEventListener("click", (event) => {
      const button = event.target.closest("#hold-position-btn");
      if (!button || button.disabled) return;
      this.game.holdPosition();
    });

    const helpBtn = document.getElementById("help-btn");
    if (helpBtn) helpBtn.addEventListener("click", () => this.showHelp());
  }

  renderSidebar() {
    this._renderShipStatus();
    this._renderActions();
    this._renderRequests();
  }

  _renderShipStatus() {
    const state = this.game.state;
    const holdState = this.game.holdPositionState;
    const total = this.game.getCargoTotal();
    const loc = state.traveling
      ? `In transit → ${this.game.map.ports[state.travelTo].name} (${state.travelDaysRemaining}d remaining)`
      : `Docked at ${this.game.map.ports[state.currentPort].name}`;

    let cargoHtml = "";
    for (const [type, amt] of Object.entries(state.cargo)) {
      if (amt > 0) cargoHtml += `<div class="cargo-row"><span>${type}</span><span>${amt}t</span></div>`;
    }
    if (!cargoHtml) cargoHtml = '<div class="cargo-empty">Empty</div>';

    const blockedCount = this.game.weather.scenario ? this.game.getWeatherBlockedRoutes().size : 0;
    const weatherLabel = this.game.weather.label;
    const weatherDetail = blockedCount > 0
      ? `<span class="weather-blocked">${blockedCount} route${blockedCount > 1 ? "s" : ""} blocked</span>`
      : `<span class="weather-clear">Lanes open</span>`;

    // Sea state at the ship's actual position (interpolated while in transit).
    let seaHtml = "";
    if (this.game.weather.scenario) {
      let nx, ny;
      if (state.traveling) {
        const from = this.game.map.ports[state.travelFrom], to = this.game.map.ports[state.travelTo];
        const totalDays = state.travelElapsed + state.travelDaysRemaining;
        const progress = totalDays > 0 ? state.travelElapsed / totalDays : 0;
        nx = from.nx + progress * (to.nx - from.nx);
        ny = from.ny + progress * (to.ny - from.ny);
      } else {
        const port = this.game.map.ports[state.currentPort];
        nx = port.nx; ny = port.ny;
      }
      const res = this.game.weather.getResistanceAt(nx, ny, state.day);
      const sea = this.game.weather.seaState(res);
      seaHtml = `<div class="weather-status"><span class="weather-label">Sea state</span><span class="sea-state ${sea.cls}">${sea.label}</span></div>`;
    }

    const holdLabel = holdState.active
      ? `Holding... ${holdState.daysLeft}d left`
      : "Hold Position";
    const holdDisabled = state.traveling || state.gameOver || holdState.active ? "disabled" : "";

    this.els.shipStatus.innerHTML =
      `<div class="ship-status-header"><h2>Ship Status</h2><button id="hold-position-btn" type="button" ${holdDisabled}>${holdLabel}</button></div>` +
      `<div class="ship-location">${loc}</div>` +
      `<div class="weather-status"><span class="weather-label">Weather: ${weatherLabel}</span>${weatherDetail}</div>` +
      seaHtml +
      `<div class="cargo-bar"><span>Cargo</span><span>${total} / ${state.maxCargo}t</span></div>` +
      `<div class="cargo-bar-visual"><div class="cargo-bar-fill" style="width:${(total / state.maxCargo) * 100}%"></div></div>` +
      `<div class="cargo-list">${cargoHtml}</div>`;
  }

  _renderActions() {
    const state = this.game.state;
    if (state.traveling || state.gameOver) {
      this.els.actionsPanel.innerHTML = "";
      return;
    }
    if (this.game.holdPositionState.active) {
      this.els.actionsPanel.innerHTML =
        `<h2>Holding Position</h2>` +
        `<div class="action-section"><div class="section-label">Waiting Out Weather</div>` +
        `<p class="wait-note">Riding out the storm at ${this.game.map.ports[state.currentPort].name}. Holding until the seas break…</p></div>`;
      return;
    }

    const port = this.game.map.ports[state.currentPort];
    let html = `<h2>${port.type === "base" ? "Base Operations" : "Site Operations"}</h2>`;

    // Stranded note — points to the Hold Position button in the Ship Status header above.
    if (this.game.isStranded()) {
      html += `<div class="action-section">` +
        `<p class="wait-note stranded">All lanes are impassable. Use <b>Hold Position</b> (top) to wait out the storm.</p>` +
        `</div>`;
    }

    // Delivery section (site with active requests)
    const reqs = this.game.getRequestsAtPort(state.currentPort);
    if (reqs.length > 0) {
      for (const req of reqs) {
        html += `<div class="action-section"><div class="section-label">DELIVERY: ${req.mission}</div>`;
        html += `<div class="delivery-grid">`;
        for (const [type, needed] of Object.entries(req.remaining)) {
          const have = state.cargo[type] || 0;
          const ok = have >= needed;
          html += `<div class="delivery-row">` +
            `<span>${type}</span>` +
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
      
      // --- FIXED HEADER ROW (Strict Flex Alignment) ---
      html += `<div class="load-row load-header" style="display: flex; align-items: center; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 8px; padding-bottom: 5px;">` +
        `<span class="load-name" style="flex: 2; text-align: left;">Item</span>` +
        `<span class="load-stock" style="flex: 1; text-align: center;">Base</span>` +
        `<span class="load-ship" style="flex: 1; text-align: center;">Ship</span>` +
        `<span class="load-actions" style="flex: 2; text-align: right; padding-right: 5px;">Actions</span>` +
        `</div>`;
      // ------------------------------------------------

      const types = Object.keys(SUPPLY_TYPES);
      for (const type of types) {
        const stock = port.inventory[type] || 0;
        const shipHas = state.cargo[type] || 0;
        
        // --- FIXED DATA ROW (Matching Flex Alignment) ---
        html += `<div class="load-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">` +
          `<span class="load-name" style="flex: 2; text-align: left;">${type}</span>` +
          `<span class="load-stock" style="flex: 1; text-align: center;">${stock}t</span>` +
          `<span class="load-ship" style="flex: 1; text-align: center;">${shipHas}t</span>` +
          `<div class="load-actions" style="flex: 2; text-align: right;">` +
          `<button class="btn-sm" onclick="game.unloadCargo('${type}',5)">-5</button>` +
          `<button class="btn-sm" onclick="game.loadCargo('${type}',5)">+5</button>` +
          `<button class="btn-sm" style="margin-left: 4px;" onclick="game.loadCargo('${type}',999)">All</button>` +
          `</div>` +
          `</div>`;
      }
      html += `<button class="btn-action btn-unload" onclick="game.unloadAll()">Unload All Cargo</button>`;

      // Quick load buttons for active requests
      const active = this.game.requests.filter(request => request.status === "active");
      if (active.length > 0) {
        html += `<div class="section-label" style="margin-top:8px">QUICK LOAD FOR REQUEST</div>`;
        for (const req of active) {
          html += `<button class="btn-action btn-quickload" onclick="game.quickLoad(${req.id})">Load for: ${req.destinationName}</button>`;
        }
      }
      html += `</div>`;
    }

    this.els.actionsPanel.innerHTML = html;
  }

  _renderRequests() {
    const active = this.game.requests.filter(request => request.status === "active" || request.status === "contested");
    const recent = this.game.requests.filter(request => request.status === "fulfilled" || request.status === "expired").slice(-3);

    let html = `<h2>Active Requests (${active.length})</h2>`;
    if (active.length === 0) html += `<div class="no-requests">No active requests</div>`;

    for (const req of active) {
      const isCont = req.status === "contested";
      const urgClass = isCont ? "urg-contested" : (req.urgency === "critical" || req.urgency === "high" ? "urg-high" : (req.urgency === "medium" ? "urg-med" : "urg-low"));
      
      let badgeText = isCont ? "CONTESTED" : req.urgency.toUpperCase();
      let supplyList = isCont 
        ? "Communications lost. Awaiting recovery."
        : Object.entries(req.remaining).map(([t, n]) => `${t} ${n}t`).join(", ");
      
      let deadlineText = isCont
        ? `Recovery ETA: ${req.stageDaysLeft} days (-${1 + this.game._getSuppliedNeighborsCount(req.destination)}d/d)`
        : (req.urgency === "critical" ? `Status: AT RISK (Rolls daily for Contested)` : `Escalates in ${req.stageDaysLeft} day(s)`);

      // Readiness: can the cargo aboard fulfill this? If short, point to the best base.
      let readyHtml = "";
      if (!isCont) {
        const cargo = this.game.state.cargo;
        const covered = Object.entries(req.remaining).every(([t, n]) => (cargo[t] || 0) >= n);
        if (covered) {
          readyHtml = `<div class="req-ready ok">✓ Cargo aboard covers this — sail &amp; deliver</div>`;
        } else {
          // Best source = base that can supply the most of what's still missing.
          let best = null, bestScore = 0;
          for (const base of this.game.map.ports) {
            if (base.type !== "base") continue;
            let score = 0;
            for (const [t, n] of Object.entries(req.remaining)) {
              const stillNeed = Math.max(0, n - (cargo[t] || 0));
              score += Math.min(base.inventory[t] || 0, stillNeed);
            }
            if (score > bestScore) { bestScore = score; best = base; }
          }
          const carryingSome = Object.entries(req.remaining).some(([t, n]) => (cargo[t] || 0) > 0);
          const lead = carryingSome ? "◐ Carrying some" : "Load needed";
          const source = best ? ` — best source: <b>${best.name}</b>` : "";
          readyHtml = `<div class="req-ready partial">${lead}${source}</div>`;
        }
      }

      html += `<div class="request-card ${urgClass}">` +
        `<div class="req-header"><span class="req-dest">${req.destinationName}</span>` +
        `<span class="req-urgency">${badgeText}</span></div>` +
        `<div class="req-mission">${req.mission}</div>` +
        `<div class="req-supplies">${isCont ? "" : "Needs: "}${supplyList}</div>` +
        readyHtml +
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

  // Reads current sea state on the active leg and advises wait-vs-rush.
  _weatherAdvisory(event, state) {
    const weather = this.game.weather;
    if (!weather || !weather.data || state.travelFrom == null || state.travelTo == null) return "";
    const fromPort = this.game.map.ports[state.travelFrom];
    const toPort = this.game.map.ports[state.travelTo];
    const sea = weather.seaState(weather.routeResistance(fromPort, toPort, state.day));
    const rec = (event.choices || []).find(choice => choice.posture === (sea.rough ? "cautious" : "bold"));
    const advice = sea.rough
      ? `seas are <b>${sea.label}</b> on this leg — better to wait it out or ease off`
      : `seas are <b>${sea.label}</b> on this leg — good conditions to push ahead`;
    const recLine = rec ? ` Ops recommends: <b>${rec.text}</b>.` : "";
    return `<div class="event-advisory ${sea.rough ? "rough" : "calm"}">⚓ Advisory: ${advice}.${recLine}</div>`;
  }

  showEvent(event, state) {
    return new Promise((resolve) => {
      this.els.modalTitle.textContent = event.name;
      this.els.modalBody.innerHTML = `<div>${event.description}</div>${this._weatherAdvisory(event, state)}`;
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
        choice.outcomes.forEach(outcome => {
          const sp = document.createElement("span");
          sp.textContent = `${outcome.chance}% — ${outcome.preview}`;
          hints.appendChild(sp);
        });
        div.append(btn, hints);
        this.els.modalChoices.appendChild(div);
      });

      this.els.overlay.classList.remove("hidden");
    });
  }

  showTravelConfirm({ port, days, inventory, requests, isContested, isNeighbor, isCurrentPort, isStorm, onConfirm }) {
    const daysLabel = days === 1 ? "1 day" : `${days} days`;
    const portTypeTag = port.type === "base" ? '<span class="port-type-tag base">Base</span>' : '<span class="port-type-tag site">Site</span>';
    this.els.modalTitle.innerHTML = `${port.name} ${portTypeTag}`;
    
    // Add close button
    let closeBtn = this.els.modalTitle.querySelector(".modal-close");
    if (!closeBtn) {
      closeBtn = document.createElement("button");
      closeBtn.className = "modal-close";
      closeBtn.textContent = "×";
      closeBtn.addEventListener("click", () => this.hideModal());
      this.els.modalTitle.appendChild(closeBtn);
    }
    
    if (isCurrentPort) {
      this.els.modalTitle.insertAdjacentHTML("beforeend", `<div class="modal-subtitle">Currently Docked</div>`);
    } else if (isContested) {
      this.els.modalTitle.insertAdjacentHTML("beforeend", `<div class="modal-subtitle contested">Warning: cannot travel to contested port.</div>`);
    } else if (isStorm) {
      this.els.modalTitle.insertAdjacentHTML("beforeend", `<div class="modal-subtitle storm">Warning: route is blocked by storm.</div>`);
    } else if (!isNeighbor) {
      this.els.modalTitle.insertAdjacentHTML("beforeend", `<div class="modal-subtitle">Direct travel not available from current port.</div>`);
    }
    this.els.modalTitle.classList.toggle("modal-title-contested", isContested);
    
    // Add travel-modal class to position in top-left
    this.els.overlay.classList.add("travel-modal");

    let portDetailsHtml;
    let detailsLines = [];
    if (port.wpi?.harborType) detailsLines.push(`Harbor Type: ${port.wpi.harborType}`);
    if (port.wpi?.harborSize) detailsLines.push(`Harbor Size: ${port.wpi.harborSize}`);
    if (port.wpi?.channelDepthM) detailsLines.push(`Channel Depth: ${port.wpi.channelDepthM} M`);
    if (port.wpi?.anchorageDepthM) detailsLines.push(`Anchorage Depth: ${port.wpi.anchorageDepthM} M`);
    
    portDetailsHtml = detailsLines.length > 0 
      ? `<div class="travel-section"><strong>Port Details:</strong> ${detailsLines.join("<br/>")}</div>`
      : "";

    let inventoryHtml;
    if (isContested) {
      inventoryHtml = `<div class="travel-section"><strong>Available inventory:</strong> Comms Blackout: Unable to see inventory at this moment.</div>`;
    } else {
      inventoryHtml = inventory && Object.keys(inventory).length
        ? `<div class="travel-section"><strong>Available inventory:</strong> ${Object.entries(inventory)
            .filter(([, amt]) => amt > 0)
            .map(([type, amt]) => `${SUPPLY_TYPES[type]?.short || type}: ${amt}t`)
            .join(", ")}</div>`
        : "<div class=\"travel-section\"><strong>Available inventory:</strong> None</div>";
    }
    const requestHtml = requests && requests.length
      ? `<div class="travel-section"><strong>Requests at destination:</strong>${requests.map(req => {
          const urgencyLabel = req.status === "contested"
            ? "CONTESTED"
            : req.urgency.toUpperCase();
          const supplies = Object.entries(req.remaining)
            .map(([type, amt]) => `${SUPPLY_TYPES[type]?.short || type}: ${amt}t`)
            .join(", ");
          const urgencyClass = req.status === "contested" ? "urg-contested" : (req.urgency === "high" ? "urg-high" : (req.urgency === "medium" ? "urg-med" : "urg-low"));
          return `<div class="travel-request ${urgencyClass}">` +
            `<div class="travel-request-header"><span>${urgencyLabel}</span></div>` +
            `<div class="travel-request-mission">${req.mission}</div>` +
            `<div class="travel-request-supplies">Needs: ${supplies}</div>` +
            `</div>`;
        }).join("")}</div>`
      : "<div class=\"travel-section\"><strong>Requests at destination:</strong> None</div>";

    this.els.modalBody.innerHTML =
      `${(isNeighbor && !isContested && !isCurrentPort) ? `<div class="travel-summary">Set sail to ${port.name}? Estimated travel time: ${daysLabel}.</div>` : ""}` +
      `${portDetailsHtml}` +
      `${inventoryHtml}` +
      `${requestHtml}`;

    this.els.modalChoices.innerHTML = "";

    if (isNeighbor && !isContested && !isStorm && !isCurrentPort) {
      const travelBtn = document.createElement("button");
      travelBtn.textContent = "Travel";
      travelBtn.addEventListener("click", () => {
        this.hideModal();
        onConfirm();
      });
      this.els.modalChoices.appendChild(travelBtn);
    }

    this.els.overlay.classList.remove("hidden");
  }

  hideModal() {
    const closeBtn = this.els.modalTitle.querySelector(".modal-close");
    if (closeBtn) closeBtn.remove();
    this.els.overlay.classList.remove("travel-modal");
    this.els.overlay.classList.add("hidden");
  }

  showToast(message, type = "notif", duration = 3500) {
    this._clearToastTimeout();
    const toast = document.createElement("div");
    const variant = type === "error" ? "toast-error" : (type === "warning" ? "toast-warning" : "toast-notif");
    toast.className = `toast ${variant}`;
    toast.textContent = message;
    this.els.toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));

    this.toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
      this.toastTimeout = null;
    }, duration);
  }

  _clearToastTimeout() {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    const current = this.els.toastContainer.querySelector(".toast.show");
    if (current) {
      current.classList.remove("show");
      current.addEventListener("transitionend", () => current.remove(), { once: true });
    }
  }

  addLog(day, message, type = "neutral") {
    const li = document.createElement("li");
    li.textContent = `Day ${day}: ${message}`;
    const cls = { bad: "event-bad", good: "event-good", port: "event-port", event: "event-incident" };
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

  showHelp() {
    this.els.overlay.classList.remove("travel-modal");
    this.els.modalTitle.textContent = "How to Play";
    this.els.modalBody.innerHTML =
      `<div style="text-align:left; font-size:0.85rem; line-height:1.5;">` +
      `<p style="margin-bottom:8px;"><b style="color:var(--accent);">Goal:</b> deliver as much requested cargo to sites as you can before <b>Day 60</b>.</p>` +
      `<ul style="margin-left:16px; list-style-type:square; line-height:1.5;">` +
      `<li><b>Move:</b> <b>click a port on the map</b> to open it, then press <b>Travel</b>. Sailing takes days.</li>` +
      `<li><b>Load:</b> dock at a <span style="color:var(--accent);">Base</span> and use <b>+5 / All</b> in the Actions panel. <b>Load for: …</b> auto-loads a request.</li>` +
      `<li><b>Deliver:</b> sail to a <span style="color:var(--gold);">Site</span> with an active request and press <b>Deliver</b>.</li>` +
      `<li><b>Weather:</b> storms can block lanes (orange). When every lane is blocked, press <b>Hold Position</b> (top of Ship Status) to wait out the storm.</li>` +
      `<li><b>Deadlines:</b> requests escalate if ignored — <span style="color:var(--gold);">MED</span> → <span style="color:var(--danger);">HIGH</span> → <b>CRITICAL</b> → <b>CONTESTED</b> (lanes cut until neighbors recover it).</li>` +
      `</ul>` +
      `<p style="margin-top:10px; color:var(--text-muted);">Tip: keep an eye on <b>Day x / 60</b> and the <b>Active Requests</b> deadlines, and pre-load cargo before a storm strands you.</p>` +
      `</div>`;
    this.els.modalChoices.innerHTML = "";
    const btn = document.createElement("button");
    btn.textContent = "Got it";
    btn.addEventListener("click", () => this.hideModal());
    this.els.modalChoices.appendChild(btn);
    this.els.overlay.classList.remove("hidden");
  }

  showScenarioBrief() {
    this.els.modalTitle.textContent = "L.A.V.A. — Operations Briefing";
    this.els.modalBody.innerHTML =
      `<div class="brief-container" style="text-align: left; font-size: 0.85rem; line-height: 1.5;">` +
      `<p style="margin-bottom: 8px; font-weight: bold; color: var(--gold);">1. SITUATION</p>` +
      `<p style="margin-bottom: 12px;">` +
      `You are in command of supply and delivery operations for expeditionary forces in the contested First Island Chain. Under intense Gray Zone pressure, neighboring ports depend on your logistics support to maintain deterrence.` +
      `</p>` +
      `<p style="margin-bottom: 8px; font-weight: bold; color: var(--gold);">2. MISSION OBJECTIVES</p>` +
      `<ul style="margin-left: 16px; margin-bottom: 12px; list-style-type: square; line-height: 1.4;">` +
      `<li style="margin-bottom: 4px;"><b>Load Cargo</b>: Pick up vital construction materials, communication grids, mobile shelters, and heavy machinery at Base Ports.</li>` +
      `<li style="margin-bottom: 4px;"><b>Route Optimization</b>: Deliver requests to contested sites before deadlines expire.</li>` +
      `<li style="margin-bottom: 4px;"><b>Prevent Domino Effect</b>: If ports remain unsupplied in a high-need status, their urgency escalates. Critical ports will roll to become <b>CONTESTED</b>, blocking sea lanes until neighboring base nodes facilitate a recovery.</li>` +
      `</ul>` +
      `<p style="margin-bottom: 8px; font-weight: bold; color: var(--gold);">3. EXECUTION WINDOW</p>` +
      `<p>Deliver maximum tonnage within <b>60 Days</b>. Hostile forces are monitoring. <br><br>Good luck, Commander.</p>` +
      `</div>`;
    this.els.modalChoices.innerHTML = "";
    const btn = document.createElement("button");
    btn.textContent = "Acknowledge & Start Mission";
    btn.addEventListener("click", () => { this.hideModal(); });
    this.els.modalChoices.appendChild(btn);
    this.els.overlay.classList.remove("hidden");
  }
}
