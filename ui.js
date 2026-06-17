class UI {
  constructor() {
    this.els = {
      money:      document.getElementById("res-money"),
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
    this.els.money.textContent    = state.money;
    this.els.health.textContent   = state.crewHealth;
    this.els.ship.textContent     = state.shipCondition;
    this.els.cargo.textContent    = state.cargo;
    this.els.cargoMax.textContent = state.maxCargo;
    this.els.fuel.textContent     = state.fuel;
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

  showPort(portName, state) {
    return new Promise((resolve) => {
      this.els.modalTitle.textContent = portName;
      this.els.modalChoices.className = "";
      this._renderPortContent(state, resolve);
      this.els.overlay.classList.remove("hidden");
    });
  }

  _renderPortContent(state, resolve) {
    this.els.modalBody.innerHTML = "";
    this.els.modalChoices.innerHTML = "";

    const summary = document.createElement("div");
    summary.className = "port-resources";
    summary.innerHTML =
      `<span>Money: <b>$${state.money}</b></span>` +
      `<span>Fuel: <b>${state.fuel}</b></span>` +
      `<span>Cargo: <b>${state.cargo}/${state.maxCargo}t</b></span>` +
      `<span>Health: <b>${state.crewHealth}%</b></span>` +
      `<span>Ship: <b>${state.shipCondition}%</b></span>`;
    this.els.modalBody.appendChild(summary);

    const trades = document.createElement("div");
    trades.className = "port-trades";

    trades.appendChild(this._tradeBtn(
      "Sell 10 Cargo → +$30",
      () => state.cargo >= 10,
      () => { state.cargo -= 10; state.money += 30; this._renderPortContent(state, resolve); },
    ));

    trades.appendChild(this._tradeBtn(
      "Buy 10 Fuel → $15",
      () => state.money >= 15 && state.fuel < 100,
      () => { state.money -= 15; state.fuel = Math.min(100, state.fuel + 10); this._renderPortContent(state, resolve); },
    ));

    trades.appendChild(this._tradeBtn(
      "Buy 10 Cargo → $20",
      () => state.money >= 20 && state.cargo + 10 <= state.maxCargo,
      () => { state.money -= 20; state.cargo += 10; this._renderPortContent(state, resolve); },
    ));

    trades.appendChild(this._tradeBtn(
      "Heal Crew +20 → $15",
      () => state.money >= 15 && state.crewHealth < 100,
      () => { state.money -= 15; state.crewHealth = Math.min(100, state.crewHealth + 20); this._renderPortContent(state, resolve); },
    ));

    trades.appendChild(this._tradeBtn(
      "Repair Ship +20 → $15",
      () => state.money >= 15 && state.shipCondition < 100,
      () => { state.money -= 15; state.shipCondition = Math.min(100, state.shipCondition + 20); this._renderPortContent(state, resolve); },
    ));

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

  showGameOver(won, state) {
    this.els.modalTitle.textContent = won ? "Voyage Complete!" : "Voyage Failed";
    this.els.modalBody.textContent = won
      ? `Arrived at ${state.destinationName} on day ${state.day} with $${state.money} and ${state.cargo} tons of cargo!`
      : "Your voyage has ended. Better luck next time.";
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
