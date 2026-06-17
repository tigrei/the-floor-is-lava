/* ============================================================
   ui.js — DOM manipulation and modal management
   ============================================================
   Responsibilities:
     - Update sidebar resource displays
     - Show/hide the event modal and wire up choice buttons
     - Append entries to the captain's log
   ============================================================ */

class UI {
  constructor() {
    this.els = {
      food:     document.getElementById("res-food"),
      health:   document.getElementById("res-health"),
      ship:     document.getElementById("res-ship"),
      gold:     document.getElementById("res-gold"),
      distance: document.getElementById("res-distance"),
      dayCounter: document.getElementById("day-counter"),
      logEntries: document.getElementById("log-entries"),
      overlay:    document.getElementById("modal-overlay"),
      modalTitle: document.getElementById("modal-title"),
      modalBody:  document.getElementById("modal-body"),
      modalChoices: document.getElementById("modal-choices"),
    };
  }

  /* Refresh all resource displays from game state */
  updateResources(state) {
    this.els.food.textContent     = state.food;
    this.els.health.textContent   = state.crewHealth;
    this.els.ship.textContent     = state.shipCondition;
    this.els.gold.textContent     = state.gold;
    this.els.dayCounter.textContent = `Day ${state.day}`;

    const distLeft = Math.max(0, state.totalRouteDistance - state.distanceTraveled);
    this.els.distance.textContent = Math.round(distLeft);

    // Color-code critical values
    this._colorize(this.els.food,   state.food,          20);
    this._colorize(this.els.health, state.crewHealth,    30);
    this._colorize(this.els.ship,   state.shipCondition, 25);
  }

  /* Turn a value's element red if it drops below threshold */
  _colorize(el, value, threshold) {
    if (value <= threshold) {
      el.style.color = "var(--danger)";
    } else {
      el.style.color = "";
    }
  }

  /* Show an event modal. Returns a Promise that resolves with the
     chosen effect's log message after the player clicks a button. */
  showEvent(event, state) {
    return new Promise((resolve) => {
      this.els.modalTitle.textContent = event.name;
      this.els.modalBody.textContent  = event.description;
      this.els.modalChoices.innerHTML = "";

      event.choices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.textContent = choice.text;
        btn.addEventListener("click", () => {
          const message = choice.effect(state);
          this.hideModal();
          resolve({ message, type: event.type });
        });
        this.els.modalChoices.appendChild(btn);
      });

      this.els.overlay.classList.remove("hidden");
    });
  }

  hideModal() {
    this.els.overlay.classList.add("hidden");
  }

  /* Add an entry to the captain's log (newest on top) */
  addLog(day, message, type = "neutral") {
    const li = document.createElement("li");
    li.textContent = `Day ${day}: ${message}`;

    const classMap = { bad: "event-bad", good: "event-good", port: "event-port" };
    if (classMap[type]) li.classList.add(classMap[type]);

    this.els.logEntries.prepend(li);

    // Keep the log manageable
    while (this.els.logEntries.children.length > 50) {
      this.els.logEntries.lastChild.remove();
    }
  }

  /* Show a game-over modal */
  showGameOver(won, state) {
    this.els.modalTitle.textContent = won ? "Voyage Complete!" : "Voyage Failed";
    this.els.modalBody.textContent  = won
      ? `You arrived at ${state.destinationName} on day ${state.day} with ${state.gold} gold!`
      : "Your ship could not complete the voyage. Better luck next time.";

    this.els.modalChoices.innerHTML = "";
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
