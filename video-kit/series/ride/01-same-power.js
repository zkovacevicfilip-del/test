// Formát „ride“: souvislá jízda dvou jezdců, štítky s čísly, titulky nahoře. Náš hlas (Liamovi došly kredity).
const ride = function (t) {
  const T = r => TR(r), tPose = T('she:1'), tRace = T('speeds:0'), tGap = T('hour:0'), tCta = T('cta:0');
  const e = ease('power2.inOut'), k = e(clamp((t - tRace) / Math.max(1, tCta - tRace)));
  // jezdec B (fialový, vzadu) se po změně polohy začne vzdalovat, jezdec A (šedý, vpředu) zůstává
  const GB = 820, GA = 1300, SB = 0.82, xB = 520 + 230 * k, xA = 540 - 110 * k, poseB = tw(t, tPose, 1.1, E.io), dist = t * 430;
  const ctaK = tw(t, tCta, 0.8, E.quint);
  drawRoad(GB, 60, 1020, dist, 1 - ctaK * 0.3); drawRoad(GA, 60, 1020, dist * 1.1, 1);
  drawAir(xB, GB, SB, t, 620, lerp(1, 0.3, poseB), poseB, 0.95);
  drawRider(xB, GB, SB, { crank: t * 9.4, wheel: t * 7.6, pose: poseB, accent: true });
  drawAir(xA, GA, 1, t, 620, 1, 0, 0.95 * (1 - ctaK));
  drawRider(xA, GA, 1, { crank: t * 9.4 + 1.3, wheel: t * 7.4, pose: 0, a: 1 - ctaK * 0.75 });
  // štítky nad helmou (výška podle polohy, aby nikdy nezakryly hlavu): výkon, poloha, rychlost
  const yB = GB + SB * riderTop(poseB) - 52, yA = GA + riderTop(0) - 52;
  const tag = (s, x, y, at, out, c, size) => tagAt(s, x, y, { t, at, out, c, line: 44, size });
  tag('250 W', xB + 20, yB, T('hook:2'), T('he:0'), 'pu', 42); tag('250 W', xA + 20, yA, T('hook:2'), T('he:0'), null, 42);
  tag('CdA 0.32 · arms straight', xA + 20, yA, T('he:0'), T('speeds:0') - 0.1); tag('CdA 0.27 · elbows bent', xB + 20, yB, T('she:0'), T('speeds:0') - 0.1, 'pu');
  tag('37.0 km/h', xA + 20, yA, T('speeds:0'), T('cost:0') - 0.1, null, 46); tag('39.1 km/h', xB + 20, yB, T('speeds:2'), tCta - 0.1, 'pu', 46);
  tag('290 W to keep up', xA + 20, yA, T('cost:1'), tCta - 0.1, null, 42);
  statAt(t, T('he:0'), T('speeds:0') - 0.15, 'DRAG AREA (CdA)', '0.32 → 0.27', C.ink);
  statAt(t, tGap, T('cost:0') - 0.15, 'AFTER ONE HOUR', '+2 km');
  statAt(t, T('cost:1'), tCta - 0.15, 'EXTRA POWER, JUST FOR SITTING UP', '+40 W · 16%', C.ink);
  // konec: výzva ke sdílení (papírová vlaštovka) a sledování
  if (ctaK > 0) {
    const p = popS(t, tCta, null), q = popS(t, T('cta:3'), null);
    ctx.save(); ctx.globalAlpha *= p.a; ctx.translate(540, 1480); ctx.scale(p.s, p.s); ctx.fillStyle = C.pu; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(70, -50); ctx.lineTo(30, 60); ctx.lineTo(10, 18); ctx.closePath(); ctx.fill(); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(10, 18); ctx.lineTo(70, -50); ctx.lineTo(18, 34); ctx.closePath(); ctx.fill(); ctx.restore();
    if (q.a > 0) pill('Follow for more free speed', 540, 1610, { a: q.a, s: q.s, size: 40, ls: 0 });
  }
};
module.exports = {
  title: 'ride-same-power',
  about: 'Dva jezdci se stejnými 250 W: vzpřímený s nataženými pažemi a nízký s ohnutými lokty. Nízký ujíždí o 2 km/h rychleji, vzpřímený by na stejnou rychlost potřeboval o 40 W (16 %) víc.',
  style: { captions: 'top' },
  voice: 'ours',
  acts: [['hook', 'hook'], ['pose', 'he', 'she'], ['race', 'speeds', 'hour'], ['cost', 'cost'], ['cta', 'cta']],
  lines: {
    hook: { say: 'Same bike. Same two hundred fifty watts. So why does one rider just ride away?',
      chunks: ['Same bike.', 'Same', ['250 watts.', 'TWO'], 'So why does', 'one rider', 'just ride away?'] },
    he: { say: "He's sitting up, arms straight.",
      chunks: [["He's sitting up,", "HE'S|HES"], 'arms straight.'] },
    she: { say: 'She drops her back and bends her elbows.',
      chunks: [['She drops her back', 'DROPS'], 'and bends', 'her elbows.'] },
    speeds: { say: 'Thirty-seven versus thirty-nine kilometers per hour.',
      chunks: [['37', 'THIRTY'], 'versus', ['39 km/h.', 'THIRTY']] },
    hour: { say: "After one hour, she's two kilometers ahead.",
      chunks: ['After one hour,', ["she's 2 km ahead.", "SHE'S|SHES"]] },
    cost: { say: "To match her, he'd need forty extra watts. Sixteen percent more power, just for sitting up.",
      chunks: ['To match her,', ["he'd need", "HE'D|HED"], ['40 extra watts.', 'FORTY'], ['16% more power,', 'SIXTEEN'], 'just for sitting up.'] },
    cta: { say: 'Send this to the friend who rides with straight arms. And follow for more free speed.',
      chunks: ['Send this', 'to the friend who rides', 'with straight arms.', 'And follow', 'for more free speed.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, pose: { type: 'free', amb: 0.12, draw: ride }, race: { type: 'free', amb: 0.12, draw: ride }, cost: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['250 W, CdA 0,32 (na páčkách, natažené paže), km/h', P.kmh(250, { cda: 0.32 }), 37.0, 0.05],
    ['250 W, CdA 0,27 (ohnuté lokty, nižší záda), km/h', P.kmh(250, { cda: 0.27 }), 39.1, 0.05],
    ['náskok po hodině, km', P.kmh(250, { cda: 0.27 }) - P.kmh(250, { cda: 0.32 }), 2, 0.1],
    ['watty navíc pro CdA 0,32 při rychlosti 39,1 km/h', P.watts(P.kmh(250, { cda: 0.27 }), { cda: 0.32 }) - 250, 40, 1],
    ['o kolik procent víc výkonu', (P.watts(P.kmh(250, { cda: 0.27 }), { cda: 0.32 }) / 250 - 1) * 100, 16, 0.5],
    ['o kolik procent méně výkonu stačí nízko při 36 km/h (13 %)', (1 - P.watts(36, { cda: 0.27 }) / P.watts(36, { cda: 0.32 })) * 100, 13, 0.5]
  ],
  sources: 'CdA 0,32 a 0,27 leží v rozsahu silničních pozic z přehledu Crouch a kol. 2017. Vzorové video (Peakfy) uvádí podle větrného tunelu, že ruce na páčkách s ohnutými lokty a vodorovnými předloktími snižují potřebný výkon asi o 13 %, což tento model potvrzuje (13 % při stejné rychlosti).'
};
