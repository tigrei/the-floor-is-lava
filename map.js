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
      { name: "Guam",           nx: 0.88, ny: 0.48, state: "secure" },
      { name: "Palau",          nx: 0.73, ny: 0.72, state: "secure" },
      { name: "Davao",          nx: 0.50, ny: 0.85, state: "secure" },
      { name: "Palawan",        nx: 0.32, ny: 0.65, state: "contested",
        mission: {
          name: "RADR — Airfield Repair",
          briefing: "Palawan's primary airstrip took a hit from a loitering munition. Allied P-8 Poseidons cannot launch for sub-hunting until craters are filled and the runway is certified.",
          cargoRequired: 20, reward: 40, fundsReward: 20, deadline: 25, delivered: 0,
        },
      },
      { name: "Subic Bay",      nx: 0.38, ny: 0.40, state: "secure" },
      { name: "Batanes",        nx: 0.42, ny: 0.18, state: "contested",
        mission: {
          name: "ROWPU — Water Security",
          briefing: "The Batanes garrison's aquifers have been intentionally contaminated. Combat effectiveness dropping 15% daily. Deploy water purification before forced surrender.",
          cargoRequired: 20, reward: 50, fundsReward: 20, deadline: 38, delivered: 0,
        },
      },
      { name: "Kaohsiung",      nx: 0.28, ny: 0.08, state: "contested",
        mission: {
          name: "Coastal Fortification",
          briefing: "Amphibious flotilla massing 200nm out. Reinforce the beachhead with Hesco barriers, anti-ship missile emplacements, and OTH radar to deny the landing zone.",
          cargoRequired: 20, reward: 60, fundsReward: 20, deadline: 45, delivered: 0,
        },
      },
    ];

    this.totalDistance = this._computeTotalDistance();
    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = rect.width;
    this.canvas.height = rect.height;
  }

  _computeTotalDistance() {
    let d = 0;
    for (let i = 1; i < this.ports.length; i++) {
      const a = this.ports[i - 1];
      const b = this.ports[i];
      d += Math.hypot(b.nx - a.nx, b.ny - a.ny);
    }
    return d;
  }

  _toPixel(nx, ny) {
    const pad = 40;
    return {
      x: pad + nx * (this.canvas.width  - pad * 2),
      y: pad + ny * (this.canvas.height - pad * 2),
    };
  }

  getShipPosition(progress) {
    const clamped = Math.max(0, Math.min(1, progress));
    const targetDist = clamped * this.totalDistance;
    let accumulated = 0;
    for (let i = 1; i < this.ports.length; i++) {
      const a = this.ports[i - 1];
      const b = this.ports[i];
      const segLen = Math.hypot(b.nx - a.nx, b.ny - a.ny);
      if (accumulated + segLen >= targetDist) {
        const t = (targetDist - accumulated) / segLen;
        return this._toPixel(a.nx + t * (b.nx - a.nx), a.ny + t * (b.ny - a.ny));
      }
      accumulated += segLen;
    }
    const last = this.ports[this.ports.length - 1];
    return this._toPixel(last.nx, last.ny);
  }

  _getStateColor(state) {
    if (state === "contested") return "#ffd54f";
    if (state === "fallen")    return "#ef5350";
    return "#4fc3f7";
  }

  _getStateFill(state, alpha) {
    if (state === "contested") return `rgba(255, 213, 79, ${alpha})`;
    if (state === "fallen")    return `rgba(239, 83, 80, ${alpha})`;
    return `rgba(79, 195, 247, ${alpha})`;
  }

  render(progress) {
    this.currentProgress = progress;
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;

    // --- Ocean background ---
    if (this.bgLoaded) {
      ctx.drawImage(this.bgImage, 0, 0, W, H);
    } else {
      ctx.fillStyle = "#0a1929"; // fallback while image loads
      ctx.fillRect(0, 0, W, H);
    }
    this._drawWaves();

    // Route line (dashed)
    ctx.beginPath();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "rgba(79,195,247,0.3)";
    ctx.lineWidth = 2;
    for (let i = 0; i < this.ports.length; i++) {
      const p = this._toPixel(this.ports[i].nx, this.ports[i].ny);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Traveled portion (solid)
    ctx.beginPath();
    ctx.strokeStyle = "#4fc3f7";
    ctx.lineWidth = 3;
    const shipPos = this.getShipPosition(progress);
    const targetDist = Math.max(0, Math.min(1, progress)) * this.totalDistance;
    let acc = 0;
    for (let i = 0; i < this.ports.length; i++) {
      const p = this._toPixel(this.ports[i].nx, this.ports[i].ny);
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        const segLen = Math.hypot(
          this.ports[i].nx - this.ports[i - 1].nx,
          this.ports[i].ny - this.ports[i - 1].ny,
        );
        if (acc + segLen <= targetDist) {
          ctx.lineTo(p.x, p.y);
        } else {
          ctx.lineTo(shipPos.x, shipPos.y);
          break;
        }
        acc += segLen;
      }
    }
    ctx.stroke();

    // Port markers
    for (let i = 0; i < this.ports.length; i++) {
      const port = this.ports[i];
      const p = this._toPixel(port.nx, port.ny);
      const isVisited = this._isPortVisited(i, progress);
      const color = this._getStateColor(port.state);

      // Outer ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = isVisited ? color : this._getStateFill(port.state, 0.2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isVisited ? "#ffffff" : color;
      ctx.fill();

      // Label
      ctx.fillStyle = color;
      ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(port.name, p.x, p.y - 16);
    }

    this._drawShip(shipPos.x, shipPos.y, progress);
  }

  _isPortVisited(portIndex, progress) {
    if (portIndex === 0) return true;
    let acc = 0;
    for (let i = 1; i <= portIndex; i++) {
      acc += Math.hypot(
        this.ports[i].nx - this.ports[i - 1].nx,
        this.ports[i].ny - this.ports[i - 1].ny,
      );
    }
    return (progress * this.totalDistance) >= acc;
  }

  _drawWaves() {
    const { ctx, canvas } = this;
    const t = Date.now() / 3000;
    ctx.strokeStyle = "rgba(79,195,247,0.06)";
    ctx.lineWidth = 1;
    for (let row = 0; row < canvas.height; row += 40) {
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 4) {
        const y = row + Math.sin((x / 120) + t + row) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  _drawShip(x, y, progress) {
    const { ctx } = this;
    const size = 12;
    let angle = 0;
    const clamped = Math.max(0, Math.min(1, progress));
    const targetDist = clamped * this.totalDistance;
    let acc = 0;
    for (let i = 1; i < this.ports.length; i++) {
      const a = this.ports[i - 1];
      const b = this.ports[i];
      const segLen = Math.hypot(b.nx - a.nx, b.ny - a.ny);
      if (acc + segLen >= targetDist || i === this.ports.length - 1) {
        const pa = this._toPixel(a.nx, a.ny);
        const pb = this._toPixel(b.nx, b.ny);
        angle = Math.atan2(pb.y - pa.y, pb.x - pa.x);
        break;
      }
      acc += segLen;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.shadowColor = "#4fc3f7";
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, -size * 0.6);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size * 0.7, size * 0.6);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size * 0.3, -size);
    ctx.lineTo(-size * 0.3, 0);
    ctx.closePath();
    ctx.fillStyle = "#4fc3f7";
    ctx.fill();

    ctx.restore();
  }
}
