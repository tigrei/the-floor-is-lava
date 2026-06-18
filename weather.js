// Weather reader for L.A.V.A. — single source of truth for sea conditions.
// On load it picks ONE of the 10 scenarios in data_master/jsonsweather/ at random,
// then answers "how rough is the sea here/now?" — used for storm route-blocking,
// the sidebar sea-state readout, and the wait-vs-rush event advisory.
//
// Data format (frame-matrix): frames["<elapsed_seconds>"].matrix[row][col], one
//   50x50 grid per frame. resistance 0.0 = free sailing, 1.0 = impassable.
//   col = x (0..49 west→east), row = y (0..49 north→south).
//   n_frames frames are stretched across the 60-day game.
class WeatherSystem {
  static SCENARIOS = [
    "typhoon", "typhoon_small", "twin_typhoons", "typhoon_squall",
    "squall_line", "scattered_cells", "borneo_vortex",
    "itcz_trough", "triple_typhoon", "hectic",
  ];

  static CALM_DURATION_DAYS = 8;  // how long the storm stays broken after it's waited out
  static CALM_CAP = 0.25;         // resistance is capped to this during the calm (Light chop)

  constructor() {
    this.data = null;
    this.scenario = null; // alias of data; also used as the "loaded yet?" flag
    this.label = "—";
    this.calmUntilDay = 0; // through this day, seas are forced calm (storm broken by waiting)
  }

  async load() {
    const name = WeatherSystem.SCENARIOS[Math.floor(Math.random() * WeatherSystem.SCENARIOS.length)];
    const res = await fetch(`data_master/jsonsweather/${name}.json`);
    this.data = await res.json();
    this.scenario = this.data;
    this.label = this.data.label || name;
    return this.label;
  }

  _frameIndex(day) {
    const n = this.data.n_frames;
    return Math.max(0, Math.min(n - 1, Math.floor((day - 1) * n / 60)));
  }

  _frame(day) {
    if (!this.data) return null;
    const dt = this.data.dt_seconds || 10;
    return this.data.frames[String(this._frameIndex(day) * dt)];
  }

  // Path to the SVG vector-field frame for the current scenario + day (for the map overlay).
  currentSvgPath(day) {
    if (!this.data) return null;
    const seconds = this._frameIndex(day) * (this.data.dt_seconds || 10);
    return `svgs/${this.data.scenario}_${String(seconds).padStart(3, "0")}s.svg`;
  }

  // Force the storm to break: seas stay calm through CALM_DURATION_DAYS from now.
  calm(currentDay) {
    this.calmUntilDay = currentDay + WeatherSystem.CALM_DURATION_DAYS;
  }

  // True while the storm is "broken" by waiting — used to fade the map overlay.
  isCalmed(day) {
    return this.data != null && day <= this.calmUntilDay;
  }

  // 0 right when the storm breaks, ramping to 1 as the calm window expires —
  // drives the overlay slowly returning from faded to full after a hold.
  calmRecovery(day) {
    if (!this.isCalmed(day)) return 1;
    const start = this.calmUntilDay - WeatherSystem.CALM_DURATION_DAYS;
    return Math.max(0, Math.min(1, (day - start) / WeatherSystem.CALM_DURATION_DAYS));
  }

  // Resistance (0..1) at a normalized canvas position on a given day.
  getResistanceAt(nx, ny, day) {
    const frame = this._frame(day);
    if (!frame) return 0;
    const g = this.data.grid_size;
    const col = Math.max(0, Math.min(g - 1, Math.round(nx * (g - 1))));
    const row = Math.max(0, Math.min(g - 1, Math.round((1 - ny) * (g - 1))));
    const raw = frame.matrix[row][col];
    // While the storm is "broken" by waiting, cap resistance so nothing reads impassable.
    return day <= this.calmUntilDay ? Math.min(raw, WeatherSystem.CALM_CAP) : raw;
  }

  // Worst resistance encountered along a route (sampled end-to-end), on a day.
  routeResistance(portA, portB, day) {
    let max = 0;
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const r = this.getResistanceAt(
        portA.nx + t * (portB.nx - portA.nx),
        portA.ny + t * (portB.ny - portA.ny),
        day
      );
      if (r > max) max = r;
    }
    return max;
  }

  // A route is blocked if any point along it is impassable.
  isRouteBlocked(portA, portB, day) {
    return this.routeResistance(portA, portB, day) >= 0.9;
  }

  // Maps a raw resistance value (0..1) to a human label, a css class (sidebar),
  // and a `rough` flag (event advisory: rough favors caution).
  seaState(resistance) {
    if (resistance >= 0.9) return { label: "Impassable", cls: "sea-impassable", rough: true };
    if (resistance >= 0.6) return { label: "Rough",      cls: "sea-rough",      rough: true };
    if (resistance >= 0.3) return { label: "Choppy",     cls: "sea-choppy",     rough: true };
    if (resistance >= 0.1) return { label: "Light chop", cls: "sea-light",      rough: false };
    return { label: "Calm", cls: "sea-calm", rough: false };
  }
}
