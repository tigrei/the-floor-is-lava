class WeatherSystem {
  constructor() {
    this.scenario = null;
    this.label = "—";
  }

  async load() {
    const names = [
      'typhoon', 'typhoon_small', 'twin_typhoons', 'typhoon_squall',
      'squall_line', 'scattered_cells', 'borneo_vortex',
      'itcz_trough', 'triple_typhoon', 'hectic'
    ];
    const name = names[Math.floor(Math.random() * names.length)];
    const res = await fetch(`data_master/jsonsweather/${name}.json`);
    this.scenario = await res.json();
    this.label = this.scenario.label;
    return this.label;
  }

  _getFrame(day) {
    if (!this.scenario) return null;
    const frameIndex = Math.min(17, Math.floor((day - 1) * 18 / 60));
    return this.scenario.frames[String(frameIndex * 10)];
  }

  getResistanceAt(nx, ny, day) {
    const frame = this._getFrame(day);
    if (!frame) return 0;
    const col = Math.max(0, Math.min(49, Math.round(nx * 49)));
    const row = Math.max(0, Math.min(49, Math.round((1 - ny) * 49)));
    return frame.matrix[row][col];
  }

  // Maps a raw resistance value (0..1) to a human sea-state label + css class.
  seaState(resistance) {
    if (resistance >= 0.9)  return { label: "Impassable", cls: "sea-impassable" };
    if (resistance >= 0.6)  return { label: "Rough",      cls: "sea-rough" };
    if (resistance >= 0.3)  return { label: "Choppy",     cls: "sea-choppy" };
    if (resistance >= 0.1)  return { label: "Light chop", cls: "sea-light" };
    return { label: "Calm", cls: "sea-calm" };
  }

  isRouteBlocked(portA, portB, day) {
    // Sample resistance at several points along the route; block if any
    // point on the path is impassable, not just the midpoint.
    const SAMPLES = 11;
    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const nx = portA.nx + t * (portB.nx - portA.nx);
      const ny = portA.ny + t * (portB.ny - portA.ny);
      if (this.getResistanceAt(nx, ny, day) >= 0.9) return true;
    }
    return false;
  }
}
