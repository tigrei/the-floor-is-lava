/* ============================================================
   map.js — Canvas-based map rendering
   ============================================================
   Responsibilities:
     - Define port coordinates and the route
     - Draw ocean background, route line, ports, and ship icon
     - Interpolate ship position along the route based on progress
   ============================================================ */

class GameMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext("2d");

    this.bgImage = new Image();
    this.bgImage.src = "assets/southeast_asia_location_map.png";
    this.bgLoaded = false;
    this.bgImage.onload = () => {
      this.bgLoaded = true;
      this.render(this.currentProgress || 0);
    };

    // Port definitions: { name, x, y } in normalized 0–1 space
    // (mapped to actual canvas size during render)
    this.ports = [
      { name: "Bangkok",        nx: 0.19, ny: 0.34 },
      { name: "Ho Chi Minh",    nx: 0.35, ny: 0.42 },
      { name: "Singapore",      nx: 0.28, ny: 0.66 },
      { name: "Jakarta",        nx: 0.35, ny: 0.85 },
      { name: "Bali",           nx: 0.57, ny: 0.92 },
      { name: "Makassar",       nx: 0.68, ny: 0.82 },
      { name: "Brunei",         nx: 0.56, ny: 0.57 },
      { name: "Manila",         nx: 0.72, ny: 0.32 },
    ];

    // Total route distance (arbitrary units — game uses this for progress)
    this.totalDistance = this._computeTotalDistance();

    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  /* Fit canvas to its container */
  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = rect.width;
    this.canvas.height = rect.height;
  }

  /* Sum Euclidean segment lengths in normalized space */
  _computeTotalDistance() {
    let d = 0;
    for (let i = 1; i < this.ports.length; i++) {
      const a = this.ports[i - 1];
      const b = this.ports[i];
      d += Math.hypot(b.nx - a.nx, b.ny - a.ny);
    }
    return d;
  }

  /* Convert normalized coords to canvas pixels */
  _toPixel(nx, ny) {
    const pad = 40;
    return {
      x: pad + nx * (this.canvas.width  - pad * 2),
      y: pad + ny * (this.canvas.height - pad * 2),
    };
  }

  /* Get the ship's pixel position from a 0–1 progress fraction */
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
        const nx = a.nx + t * (b.nx - a.nx);
        const ny = a.ny + t * (b.ny - a.ny);
        return this._toPixel(nx, ny);
      }
      accumulated += segLen;
    }

    // At the end
    const last = this.ports[this.ports.length - 1];
    return this._toPixel(last.nx, last.ny);
  }

  /* Return the index of the next upcoming port (or -1 if voyage complete) */
  getNextPortIndex(progress) {
    const clamped = Math.max(0, Math.min(1, progress));
    const targetDist = clamped * this.totalDistance;

    let accumulated = 0;
    for (let i = 1; i < this.ports.length; i++) {
      const segLen = Math.hypot(
        this.ports[i].nx - this.ports[i - 1].nx,
        this.ports[i].ny - this.ports[i - 1].ny,
      );
      accumulated += segLen;
      if (accumulated > targetDist) return i;
    }
    return -1;
  }

  /* Main render — call every frame/tick */
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

    // --- Route line (dashed) ---
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

    // --- Traveled portion (solid bright line) ---
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

    // --- Port markers ---
    for (let i = 0; i < this.ports.length; i++) {
      const port = this.ports[i];
      const p = this._toPixel(port.nx, port.ny);
      const isVisited = this._isPortVisited(i, progress);

      // Outer ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = isVisited ? "#4fc3f7" : "rgba(79,195,247,0.2)";
      ctx.fill();
      ctx.strokeStyle = "#4fc3f7";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isVisited ? "#ffffff" : "#4fc3f7";
      ctx.fill();

      // Label
      ctx.fillStyle = "#d4dce8";
      ctx.font = "12px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(port.name, p.x, p.y - 16);
    }

    // --- Ship icon ---
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

  /* Simple animated wave lines for atmosphere */
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

  /* Draw a simple triangle ship */
  _drawShip(x, y, progress) {
    const { ctx } = this;
    const size = 12;

    // Determine direction from last segment
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

    // Glow
    ctx.shadowColor = "#4fc3f7";
    ctx.shadowBlur = 12;

    // Hull
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, -size * 0.6);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size * 0.7, size * 0.6);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Sail
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
