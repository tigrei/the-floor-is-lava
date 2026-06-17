class GameMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext("2d");

    this.bgImage = new Image();
    this.bgImage.src = "assets/google_earth.png";
    this.bgLoaded = false;
    this.bgImage.onload = () => {
      this.bgLoaded = true;
      this.render(this.currentProgress || 0);
    };

    // Port definitions: { name, x, y } in normalized 0–1 space
    // (mapped to actual canvas size during render)
    this.ports = [
      { name: "Yokosuka",     nx: 0.82, ny: 0.08, type: "base",
        inventory: { power: 40, comms: 35, shelter: 25, tools: 20, construction: 15, bridging: 10, water: 5, heavy: 5 } },
      { name: "Sasebo",       nx: 0.58, ny: 0.12, type: "base",
        inventory: { bridging: 40, construction: 35, heavy: 25, tools: 20, water: 15, shelter: 10, power: 5, comms: 5 } },
      { name: "Okinawa",      nx: 0.68, ny: 0.25, type: "site" },
      { name: "Miyako-jima",  nx: 0.55, ny: 0.33, type: "site" },
      { name: "Yonaguni",     nx: 0.43, ny: 0.30, type: "site" },
      { name: "Green Island", nx: 0.47, ny: 0.42, type: "site" },
      { name: "Pratas",       nx: 0.32, ny: 0.54, type: "site" },
      { name: "Batanes",      nx: 0.42, ny: 0.57, type: "site" },
      { name: "Subic Bay",    nx: 0.35, ny: 0.70, type: "base",
        inventory: { construction: 30, tools: 35, water: 30, comms: 20, bridging: 15, power: 10, shelter: 10, heavy: 5 } },
      { name: "Palawan",      nx: 0.22, ny: 0.80, type: "site" },
      { name: "Itu Aba",      nx: 0.15, ny: 0.62, type: "site" },
      { name: "Guam",         nx: 0.90, ny: 0.44, type: "base",
        inventory: { construction: 50, heavy: 40, shelter: 30, power: 15, tools: 10, bridging: 10, comms: 5, water: 10 } },
    ];

    this.connections = [
      [0, 1, 3], [0, 2, 3], [0, 11, 5],
      [1, 2, 2],
      [2, 3, 2], [2, 11, 4],
      [3, 4, 1], [3, 5, 2],
      [4, 5, 1],
      [5, 6, 2], [5, 7, 2],
      [6, 8, 3], [6, 10, 2],
      [7, 8, 2],
      [8, 9, 2], [8, 10, 3], [8, 11, 5],
      [9, 10, 2],
    ];

    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = rect.width;
    this.canvas.height = rect.height;
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

  render(shipState, requestPorts) {
    const { ctx, canvas } = this;
    ctx.fillStyle = "#0a1929";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this._drawWaves();

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
        ctx.beginPath();
        ctx.strokeStyle = "rgba(79,195,247,0.35)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
        ctx.setLineDash([]);
        const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
        ctx.fillStyle = "#7a8ba0";
        ctx.font = "10px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${days}d`, mx, my - 5);
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
      const hasReq = requestPorts.has(i);
      const isCurrent = shipState.currentPort === i;
      const color = isBase ? "#4fc3f7" : (hasReq ? "#ffd54f" : "#556070");

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
}
