class UI {
  constructor() {
    this.els = {
      deterrence: document.getElementById("res-deterrence"),
      funds:      document.getElementById("res-funds"),
      health:     document.getElementById("res-health"),
      ship:       document.getElementById("res-ship"),
      cargo:      document.getElementById("res-cargo"),
      cargoMax:   document.getElementById("res-cargo-max"),
      fuel:       document.getElementById("res-fuel"),
      distance:   document.getElementById("res-distance"),
      dayCounter: document.getElementById("day-counter"),
      logEntries: document.getElementById("log-entries"),
      overlay:    document.getElementById("modal-overlay"),
      modalTitle: document.getElementById("modal-title"),
      modalBody:  document.getElementById("modal-body"),
      modalChoices: document.getElementById("modal-choices"),
    };
  }

  updateResources(state) {
    this.els.deterrence.textContent = state.deterrence;
    this.els.funds.textContent      = state.funds;
    this.els.health.textContent     = state.crewHealth;
    this.els.ship.textContent       = state.shipCondition;
    this.els.cargo.textContent      = state.cargo;
    this.els.cargoMax.textContent   = state.maxCargo;
    this.els.fuel.textContent       = state.fuel;
    this.els.dayCounter.textContent = `Day ${state.day}`;

    const distLeft = Math.max(0, state.totalRouteDistance - state.distanceTraveled);
    this.els.distance.textContent = Math.round(distLeft);

    this._colorize(this.els.health, state.crewHealth, 30);
    this._colorize(this.els.ship, state.shipCondition, 25);
    this._colorize(this.els.fuel, state.fuel, 15);
  }

  _colorize(el, value, threshold) {
    el.style.color = value <= threshold ? "var(--danger)" : "";
  }

  showEvent(event, state) {
    return new Promise((resolve) => {
      this.els.modalTitle.textContent = event.name;
      this.els.modalBody.textContent  = event.description;
      this.els.modalChoices.innerHTML = "";
      this.els.modalChoices.className = "event-choices";

      event.choices.forEach((choice) => {
        const choiceDiv = document.createElement("div");
        choiceDiv.className = "choice-option";

        const btn = document.createElement("button");
        btn.textContent = choice.text;
        btn.addEventListener("click", () => {
          const outcome = resolveOutcome(choice);
          const message = applyOutcome(outcome, state);

          this.els.modalBody.textContent = message;
          this.els.modalChoices.innerHTML = "";
          this.els.modalChoices.className = "";

          const continueBtn = document.createElement("button");
          continueBtn.textContent = "Continue";
          continueBtn.addEventListener("click", () => {
            this.hideModal();
            resolve({ message, type: event.type });
          });
          this.els.modalChoices.appendChild(continueBtn);
        });

        const outcomesDiv = document.createElement("div");
        outcomesDiv.className = "choice-outcomes";
        choice.outcomes.forEach((o) => {
          const span = document.createElement("span");
          span.textContent = `${o.chance}% — ${o.preview}`;
          outcomesDiv.appendChild(span);
        });

        choiceDiv.append(btn, outcomesDiv);
        this.els.modalChoices.appendChild(choiceDiv);
      });

      this.els.overlay.classList.remove("hidden");
    });
  }

  showPort(port, gameState) {
    return new Promise((resolve) => {
      const tag = port.state.toUpperCase();
      this.els.modalTitle.textContent = `[${tag}] ${port.name}`;
      this.els.modalChoices.className = "";
      this._renderPortContent(port, gameState, resolve);
      this.els.overlay.classList.remove("hidden");
    });
  }

  _renderPortContent(port, gs, resolve) {
    this.els.modalBody.innerHTML = "";
    this.els.modalChoices.innerHTML = "";

    // Mission briefing for contested ports
    if (port.state === "contested" && port.mission) {
      const m = port.mission;
      const brief = document.createElement("div");
      brief.className = "mission-briefing";
      brief.innerHTML =
        `<div class="mission-title">${m.name}</div>` +
        `<p class="mission-desc">${m.briefing}</p>` +
        `<div class="mission-progress">Progress: ${m.delivered}/${m.cargoRequired}t delivered | Deadline: Day ${m.deadline}</div>`;
      this.els.modalBody.appendChild(brief);
    } else if (port.state === "secure") {
      const desc = document.createElement("p");
      desc.textContent = "Allied logistics hub. Resupply and repair available.";
      desc.style.marginBottom = "12px";
      this.els.modalBody.appendChild(desc);
    }

    // Resource summary
    const summary = document.createElement("div");
    summary.className = "port-resources";
    summary.innerHTML =
      `<span>Funds: <b>$${gs.funds}</b></span>` +
      `<span>Fuel: <b>${gs.fuel}</b></span>` +
      `<span>Cargo: <b>${gs.cargo}/${gs.maxCargo}t</b></span>` +
      `<span>Health: <b>${gs.crewHealth}%</b></span>` +
      `<span>Hull: <b>${gs.shipCondition}%</b></span>`;
    this.els.modalBody.appendChild(summary);

    // Trade buttons
    const trades = document.createElement("div");
    trades.className = "port-trades";

    // Mission delivery (contested with active mission)
    if (port.state === "contested" && port.mission) {
      const m = port.mission;
      const remaining = m.cargoRequired - m.delivered;
      if (remaining > 0) {
        const amt = Math.min(10, remaining);
        const det = Math.floor(m.reward * amt / m.cargoRequired);
        const pay = Math.floor(m.fundsReward * amt / m.cargoRequired);
        trades.appendChild(this._tradeBtn(
          `Deliver ${amt}t Cargo → +${det} Det, +$${pay}`,
          () => gs.cargo >= amt,
          () => {
            gs.cargo -= amt;
            gs.deterrence += det;
            gs.funds += pay;
            m.delivered += amt;
            if (m.delivered >= m.cargoRequired) port.state = "secure";
            this._renderPortContent(port, gs, resolve);
          },
        ));
      }
    }

    const isSecure = port.state === "secure";
    const fuelPrice = isSecure ? 10 : 15;
    const repairPrice = isSecure ? 10 : 15;
    const healPrice = isSecure ? 10 : 15;

    trades.appendChild(this._tradeBtn(
      `Resupply Fuel +10 → $${fuelPrice}`,
      () => gs.funds >= fuelPrice && gs.fuel < 100,
      () => { gs.funds -= fuelPrice; gs.fuel = Math.min(100, gs.fuel + 10); this._renderPortContent(port, gs, resolve); },
    ));

    trades.appendChild(this._tradeBtn(
      `Repair Hull +20 → $${repairPrice}`,
      () => gs.funds >= repairPrice && gs.shipCondition < 100,
      () => { gs.funds -= repairPrice; gs.shipCondition = Math.min(100, gs.shipCondition + 20); this._renderPortContent(port, gs, resolve); },
    ));

    trades.appendChild(this._tradeBtn(
      `Rest Crew +20 → $${healPrice}`,
      () => gs.funds >= healPrice && gs.crewHealth < 100,
      () => { gs.funds -= healPrice; gs.crewHealth = Math.min(100, gs.crewHealth + 20); this._renderPortContent(port, gs, resolve); },
    ));

    if (isSecure) {
      trades.appendChild(this._tradeBtn(
        "Load 10t Cargo → $15",
        () => gs.funds >= 15 && gs.cargo + 10 <= gs.maxCargo,
        () => { gs.funds -= 15; gs.cargo += 10; this._renderPortContent(port, gs, resolve); },
      ));
    }

    this.els.modalChoices.appendChild(trades);

    const sailBtn = document.createElement("button");
    sailBtn.textContent = "Set Sail";
    sailBtn.className = "btn-set-sail";
    sailBtn.addEventListener("click", () => {
      this.hideModal();
      resolve();
    });
    this.els.modalChoices.appendChild(sailBtn);
  }

  _tradeBtn(text, canAfford, action) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.disabled = !canAfford();
    btn.addEventListener("click", () => { if (canAfford()) action(); });
    return btn;
  }

  hideModal() {
    this.els.overlay.classList.add("hidden");
  }

  addLog(day, message, type = "neutral") {
    const li = document.createElement("li");
    li.textContent = `Day ${day}: ${message}`;
    const classMap = { bad: "event-bad", good: "event-good", port: "event-port" };
    if (classMap[type]) li.classList.add(classMap[type]);
    this.els.logEntries.prepend(li);
    while (this.els.logEntries.children.length > 50) {
      this.els.logEntries.lastChild.remove();
    }
  }

  showGameOver(won, state, ports) {
    this.els.modalTitle.textContent = won ? "Mission Accomplished" : "Mission Failed";
    this.els.modalBody.innerHTML = "";

    const stats = document.createElement("div");
    stats.className = "game-over-stats";

    if (won) {
      const secured = ports.filter(p => p.mission && p.state === "secure").map(p => p.name);
      const fallen = ports.filter(p => p.state === "fallen").map(p => p.name);

      stats.innerHTML =
        `<p>Day ${state.day} | Deterrence: <b>${state.deterrence}</b> | Funds: <b>$${state.funds}</b></p>` +
        (secured.length ? `<p>Islands Secured: <b>${secured.join(", ")}</b></p>` : "") +
        (fallen.length ? `<p>Islands Lost: <b>${fallen.join(", ")}</b></p>` : "") +
        `<p style="margin-top:12px">The First Island Chain holds. Your engineering packages denied the enemy critical positions.</p>`;
    } else {
      const fallen = ports.filter(p => p.state === "fallen").map(p => p.name);
      stats.innerHTML =
        `<p>Day ${state.day} | Deterrence: <b>${state.deterrence}</b></p>` +
        (fallen.length ? `<p>Islands Lost: <b>${fallen.join(", ")}</b></p>` : "") +
        `<p style="margin-top:12px">The deterrence gap widens. Without Seabee support, the island garrisons cannot hold.</p>`;
    }

    this.els.modalBody.appendChild(stats);
    this.els.modalChoices.innerHTML = "";
    this.els.modalChoices.className = "";
    const btn = document.createElement("button");
    btn.textContent = "Play Again";
    btn.addEventListener("click", () => {
      this.hideModal();
      window.location.reload();
    });
    this.els.modalChoices.appendChild(btn);
    this.els.overlay.classList.remove("hidden");
  }
}
