class GameMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext("2d");

    this.bgImage = new Image();
    this.bgImage.src = "assets/google_earth.png";
    this.bgLoaded = false;
    this.bgImage.onload = () => {
      this.bgLoaded = true;
      if (this.lastShipState && this.lastRequestPorts) {
        this.render(this.lastShipState, this.lastRequestPorts, this.lastContestedPorts);
      }
    };

    // Port definitions: { name, x, y } in normalized 0–1 space
    // (mapped to actual canvas size during render)
    // inventory keys are cargo_id values from supply-data.js (SUPPLY_TYPES)
    this.ports = [
      { name: "Yokosuka",     nx: 0.97, ny: 0.03, type: "base",
        inventory: { "CARGO-034": 40, "CARGO-033": 30, "CARGO-004": 30, "CARGO-008": 20, "CARGO-010": 10, "CARGO-028": 5, "CARGO-001": 5} ,
      },
      { name: "Sasebo",       nx: 0.7, ny: 0.15, type: "base",
        inventory: { "CARGO-010": 4, "CARGO-013": 30, "CARGO-001": 30, "CARGO-006": 20, "CARGO-028": 20, "CARGO-004": 5, "CARGO-033": 5 } 
      },
      { name: "Okinawa",      nx: 0.64, ny: 0.47, type: "site" },
      { name: "Kunsan",  nx: 0.63, ny: 0.08, type: "base",
        inventory: { "CARGO-013": 3, "CARGO-008": 30, "CARGO-028": 30, "CARGO-033": 25, "CARGO-010": 5, "CARGO-004": 15, "CARGO-001": 5} ,
       },
      { name: "Batanes",      nx: 0.42, ny: 0.57, type: "site" },
      { name: "Subic Bay",    nx: 0.35, ny: 0.70, type: "base",
        inventory: { "CARGO-013": 3, "CARGO-008": 30, "CARGO-028": 30, "CARGO-033": 20, "CARGO-010": 5, "CARGO-004": 10, "CARGO-001": 5 }
      }, 
      { name: "Palawan",      nx: 0.28, ny: 1.02, type: "site" },
      { name: "Guam",         nx: 0.9, ny: 1.02, type: "base",
        inventory: { "CARGO-013": 5, "CARGO-001": 5, "CARGO-006": 15, "CARGO-004": 30, "CARGO-027": 25, "CARGO-010": 10, "CARGO-034": 10, "CARGO-028": 15 }
      },
      { name: "Camilo Osias", nx: 0.45, ny: 0.86, type: "site"},
      { name: "Kyogamisaki",  nx: 0.87, ny: 0.0, type: "site" },
      { name: "Mujuk",        nx: 0.67, ny: 0.036, type: "site" }
    ];

    this.connections = [
      [0, 1, 3], [0, 2, 4],
      [1, 2, 2],
      [2, 3, 2], [2, 7, 5],
      [4, 5, 2],
      [5, 6, 2],
      [4, 7, 5],
      [4, 2, 2],
      [1, 3, 1],
      [8, 4, 2], [8, 5, 2],
      [9, 3, 2],
      [10, 3, 1], [10, 9, 2],
      [3, 4, 3],
      [8, 7, 3],
      [0, 7, 5]
    ];

    this._resize();
    window.addEventListener("resize", () => this._resize());
    this.canvas.addEventListener("mousemove", (e) => this._handleCanvasMouseMove(e));
    this.canvas.addEventListener("click", (e) => this._handleCanvasClick(e));
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = rect.width;
    this.canvas.height = rect.height;
    if (this.lastShipState && this.lastRequestPorts) {
      this.render(this.lastShipState, this.lastRequestPorts, this.lastContestedPorts);
    }
  }

  _toPixel(nx, ny) {
    const pad = 48;
    return {
      x: pad + nx * (this.canvas.width  - pad * 2),
      y: pad + ny * (this.canvas.height - pad * 2),
    };
  }

  getConnected(portIndex) {
    const result = [];
    for (const [a, b, days] of this.connections) {
      if (a === portIndex) result.push({ port: b, days });
      else if (b === portIndex) result.push({ port: a, days });
    }
    return result;
  }

  getTravelTime(from, to) {
    for (const [a, b, days] of this.connections) {
      if ((a === from && b === to) || (a === to && b === from)) return days;
    }
    return null;
  }

  render(shipState, requestPorts, contestedPorts) {
    this.lastShipState = shipState;
    this.lastRequestPorts = requestPorts;
    this.lastContestedPorts = contestedPorts;

    const { ctx, canvas } = this;
    if (this.bgLoaded) {
      ctx.drawImage(this.bgImage, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(10, 22, 40, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#0a1929";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this._drawWaves();
    }

    for (const [a, b] of this.connections) {
      const pa = this._toPixel(this.ports[a].nx, this.ports[a].ny);
      const pb = this._toPixel(this.ports[b].nx, this.ports[b].ny);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(79,195,247,0.12)";
      ctx.lineWidth = 1;
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    if (shipState.currentPort !== null) {
      const connected = this.getConnected(shipState.currentPort);
      for (const { port: idx, days } of connected) {
        const pa = this._toPixel(this.ports[shipState.currentPort].nx, this.ports[shipState.currentPort].ny);
        const pb = this._toPixel(this.ports[idx].nx, this.ports[idx].ny);
        const isTargetContested = contestedPorts && contestedPorts.has(idx);
        ctx.beginPath();
        ctx.strokeStyle = isTargetContested ? "rgba(239,83,80,0.45)" : "rgba(79,195,247,0.35)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
        ctx.setLineDash([]);
        const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
        ctx.fillStyle = isTargetContested ? "#ef5350" : "#7a8ba0";
        ctx.font = "10px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(isTargetContested ? "Blocked" : `${days}d`, mx, my - 5);
      }
    }

    if (shipState.traveling) {
      const pa = this._toPixel(this.ports[shipState.travelFrom].nx, this.ports[shipState.travelFrom].ny);
      const pb = this._toPixel(this.ports[shipState.travelTo].nx, this.ports[shipState.travelTo].ny);
      ctx.beginPath();
      ctx.strokeStyle = "#4fc3f7";
      ctx.lineWidth = 3;
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    for (let i = 0; i < this.ports.length; i++) {
      const port = this.ports[i];
      const p = this._toPixel(port.nx, port.ny);
      const isBase = port.type === "base";
      const hasReq = requestPorts && requestPorts.has(i);
      const isContested = contestedPorts && contestedPorts.has(i);
      const isCurrent = shipState.currentPort === i;
      
      let color = isBase ? "#4fc3f7" : (hasReq ? "#ffd54f" : "#556070");
      if (isContested) {
        color = "#ef5350";
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, isBase ? 11 : 8, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? color : this._alphaColor(color, 0.2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isCurrent ? 3 : 2;
      ctx.stroke();

      if (isCurrent) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      ctx.fillStyle = color;
      ctx.font = `${isBase ? "bold " : ""}11px 'Segoe UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(port.name, p.x, p.y - (isBase ? 18 : 14));
      if (isBase) {
        ctx.font = "8px 'Segoe UI', sans-serif";
        ctx.fillStyle = "rgba(79,195,247,0.4)";
        ctx.fillText("BASE", p.x, p.y + 20);
      } else if (isContested) {
        ctx.font = "bold 8px 'Segoe UI', sans-serif";
        ctx.fillStyle = "rgba(239,83,80,0.8)";
        ctx.fillText("CONTESTED", p.x, p.y + 18);
      }
    }

    if (shipState.traveling) {
      const from = this.ports[shipState.travelFrom], to = this.ports[shipState.travelTo];
      const total = shipState.travelElapsed + shipState.travelDaysRemaining;
      const t = total > 0 ? shipState.travelElapsed / total : 0;
      const pos = this._toPixel(from.nx + t * (to.nx - from.nx), from.ny + t * (to.ny - from.ny));
      this._drawShip(pos.x, pos.y, Math.atan2(to.ny - from.ny, to.nx - from.nx));
    } else if (shipState.currentPort !== null) {
      const port = this.ports[shipState.currentPort];
      const pos = this._toPixel(port.nx, port.ny);
      this._drawShip(pos.x, pos.y + 22, 0);
    }
  }

  _alphaColor(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  _drawWaves() {
    const { ctx, canvas } = this;
    const t = Date.now() / 3000;
    ctx.strokeStyle = "rgba(79,195,247,0.05)";
    ctx.lineWidth = 1;
    for (let row = 0; row < canvas.height; row += 45) {
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 4) {
        const y = row + Math.sin((x / 120) + t + row) * 5;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  _drawShip(x, y, angle) {
    const { ctx } = this;
    const s = 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.shadowColor = "#4fc3f7";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.7, -s * 0.5);
    ctx.lineTo(-s * 0.3, 0);
    ctx.lineTo(-s * 0.7, s * 0.5);
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
  }

  _handleCanvasClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const portStatuses = this.ports.map((port, idx) => ({
      name: port.name,
      contested: typeof game !== 'undefined' ? game.isPortContested(idx) : false,
    }));

    for (let i = 0; i < this.ports.length; i++) {
      const port = this.ports[i];
      const p = this._toPixel(port.nx, port.ny);
      const radius = port.type === "base" ? 15 : 12;

      if (Math.hypot(clickX - p.x, clickY - p.y) <= radius) {
        this._onPortClick(port, i);
        break;
      }
    }
  }

  _handleCanvasMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let hoveringPort = false;

    for (let i = 0; i < this.ports.length; i++) {
      const p = this._toPixel(this.ports[i].nx, this.ports[i].ny);
      const radius = this.ports[i].type === "base" ? 15 : 12;
      
      if (Math.hypot(mouseX - p.x, mouseY - p.y) <= radius) {
        hoveringPort = true;
        break;
      }
    }
    this.canvas.style.cursor = hoveringPort ? "pointer" : "default";
  }

 _onPortClick(port, index) {
    console.log(`Clicked map port: ${port.name} (Index: ${index})`);
    if (this.lastShipState.currentPort === index) {
      game.ui.showToast("Already at this port.", "warning"); 
      return;
    }

    if (this.lastShipState.traveling) {
      game.ui.showToast("Ship is in transit. Cannot navigate right now.", "warning");
      return;
    }

    if (typeof game !== 'undefined') {
      const isContested = game.isPortContested(index);
      if (isContested) {
        game.ui.showToast(`Cannot travel to ${port.name} — port is contested.`, "error");
        return;
      }

      const neighbors = this.getConnected(this.lastShipState.currentPort);
      const isNeighbor = neighbors.some(n => n.port === index);
      const travelDays = this.getTravelTime(this.lastShipState.currentPort, index);
      const targetInventory = port.type === "base" ? port.inventory : null;
      const requestsAtPort = game.requests.filter(r =>
        (r.status === "active" || r.status === "contested") && r.destination === index
      );
      game.ui.showTravelConfirm({
        portName: port.name,
        days: travelDays,
        inventory: targetInventory,
        requests: requestsAtPort,
        isContested,
        isNeighbor,
        onConfirm: () => game.startTravel(index),
      });
    } else {
      console.error("Game instance 'game' not found globally.");
    }
  }

}
