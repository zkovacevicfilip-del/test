'use strict';
// Fyzika pro čísla ve videích. Stejný model jako tools/physics.py a kalkulačka v aplikaci (aero.js):
// výkon na pedálech = (odpor vzduchu + valivý odpor + stoupání) · rychlost / účinnost převodů.
// Navíc umí vítr, sklon, teplotu, nadmořskou výšku, tlak a vlhkost, dojezd bez šlapání a rychlost při sjezdu.
// Základní předpoklady (když není řečeno jinak): 84 kg s kolem, Crr 0,004, účinnost 97,5 %, 20 °C, 0 m n. m., rovina, bezvětří.
const G = 9.80665, BASE = { m: 84, crr: 0.004, eff: 0.975, cda: 0.25, wind: 0, grade: 0, temp: 20, alt: 0 };

// hustota vzduchu [kg/m³]: tlak z barometrické rovnice (nebo zadaný v hPa), vlhkost 0 až 1
function rho(o = {}) {
  const temp = o.temp == null ? 20 : o.temp, alt = o.alt || 0, T = temp + 273.15;
  const p = o.hpa ? o.hpa * 100 : 101325 * Math.pow(1 - 2.25577e-5 * alt, 5.25588);
  const pv = (o.rh || 0) * 610.94 * Math.exp(17.625 * temp / (temp + 243.04));
  return (p - pv) / (287.058 * T) + pv / (461.495 * T);
}
function opts(o) { const q = Object.assign({}, BASE, o || {}); if (q.rho == null) q.rho = rho(q); return q; }
// síly proti pohybu při rychlosti v [m/s]; wind > 0 je protivítr [m/s], grade je sklon (0,06 = 6 %)
function force(v, o) {
  const q = opts(o), air = v + q.wind, th = Math.atan(q.grade);
  return 0.5 * q.rho * q.cda * air * Math.abs(air) + q.crr * q.m * G * Math.cos(th) + q.m * G * Math.sin(th);
}
// výkon na pedálech [W] při rychlosti v [m/s]
function power(v, o) { return force(v, o) * v / opts(o).eff; }
// ustálená rychlost [m/s] při výkonu watts (0 W = jízda bez šlapání z kopce)
function speed(watts, o) {
  const q = opts(o); let lo = 0, hi = 150;
  for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (force(mid, q) * mid > watts * q.eff + (watts === 0 ? 1e-9 : 0)) hi = mid; else lo = mid; }
  return (lo + hi) / 2;
}
const kmh = (watts, o) => speed(watts, o) * 3.6;
const watts = (v_kmh, o) => power(v_kmh / 3.6, o);
// čas [s] na vzdálenost km při stálém výkonu
const time = (watts_, km, o) => km * 1000 / speed(watts_, o);
// podíl odporu vzduchu na celkovém odporu při rychlosti v_kmh
function airShare(v_kmh, o) { const q = opts(o), v = v_kmh / 3.6, a = 0.5 * q.rho * q.cda * v * v; return a / force(v, q); }
// dojezd bez šlapání z rychlosti v0 na v1 [km/h]: vrací dráhu v metrech
function coast(v0, v1, o) {
  const q = opts(o); let v = v0 / 3.6, x = 0; const dt = 0.01;
  while (v > v1 / 3.6) { v -= force(v, q) / q.m * dt; x += v * dt; }
  return x;
}
const clock = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
module.exports = { G, BASE, rho, force, power, speed, kmh, watts, time, airShare, coast, clock };
