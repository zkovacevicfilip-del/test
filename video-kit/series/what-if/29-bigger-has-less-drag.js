module.exports = {
  title: 'what-if-bigger-has-less-drag',
  about: 'Proudnicový tvar desetkrát tlustší než kulatá tyč má přibližně stejný odpor: nerozhoduje velikost, ale tvar.',
  acts: [['hook', 'hook'], ['wire', 'wire'], ['drop', 'drop', 'same'], ['why', 'why', 'tip']],
  lines: {
    hook: { say: 'What if a shape ten times bigger had the same drag?', captions: false,
      chunks: ['What if', 'a shape', ['10 times bigger', 'TEN'], 'had the same drag?'] },
    wire: { say: 'Take a thin round bar. Air breaks off behind it and leaves a wide, messy wake.',
      chunks: ['Take a thin', 'round bar.', 'Air breaks off', 'behind it', 'and leaves a wide,', 'messy wake.'] },
    drop: { say: 'Now take a teardrop shape, ten times as thick. The air stays attached and closes smoothly behind it.',
      chunks: ['Now take', 'a teardrop shape,', ['10 times as thick.', 'TEN'], 'The air', 'stays attached', 'and closes smoothly', 'behind it.'] },
    same: { say: 'Both have about the same drag!',
      chunks: ['Both have', 'about the same drag!'] },
    why: { say: "Because drag isn't about how big you are. It's about how much you disturb the air.",
      chunks: ['Because drag', "isn't about", 'how big you are.', ["It's about how much", "IT'S|ITS"], 'you disturb the air.'] },
    tip: { say: 'So on the bike, think smooth: flat back, tucked head, nothing sticking out.',
      chunks: ['So on the bike,', 'think smooth:', 'flat back,', 'tucked head,', 'nothing sticking out.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'a shape', i: 1 }, { t: '10× bigger', i: 2, big: true, size: 150 }, { t: 'had the same drag?', i: 3 }] },
    wire: { type: 'flow', amb: 0.22, panels: [{ flow: 'cyl', cy: 940, h: 441, label: 'ROUND BAR' }],
      heads: [{ at: 'wire:0', title: 'Thin round bar', sub: 'wide, messy wake', subAt: 'wire:4' }] },
    drop: { type: 'none', amb: 0.26,
      heads: [{ at: 'drop:1', title: 'Teardrop', big: '10× thicker', bigAt: 'drop:2' }, { at: 'same:0', big: 'Same drag', sub: 'about equal · a textbook result', subAt: 'same:1' }],
      draw: function (t, a, dy) {
        // kulatá tyč o průměru 20 px a kapka (profil NACA 0025) tlustá 200 px: přesně 10×
        const t1 = TR('drop:0'), t2 = TR('drop:1'), k2 = tw(t, t2, 0.9), cy1 = 700 + dy, cy2 = 1050 + dy, p1 = popS(t, t1, null);
        ctx.save(); ctx.globalAlpha *= p1.a; ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(250, cy1, 10, 0, 7); ctx.fill(); ctx.restore();
        txt('round bar · 1×', 290, cy1 + 14, { size: 40, w: 700, align: 'left', a: p1.a, c: C.muted });
        if (k2 > 0.001) {
          const c = 800, x0 = 140, s = lerp(0.6, 1, k2), up = [], dn = [];
          for (let i = 0; i <= 60; i++) { const xs = (1 - Math.cos(Math.PI * i / 60)) / 2, yt = 5 * 0.25 * c * (0.2969 * Math.sqrt(xs) - 0.1260 * xs - 0.3516 * xs * xs + 0.2843 * xs * xs * xs - 0.1036 * xs * xs * xs * xs); up.push([x0 + xs * c, cy2 - yt]); dn.push([x0 + xs * c, cy2 + yt]); }
          ctx.save(); ctx.globalAlpha *= clamp((t - t2) / 0.2); ctx.translate(540, cy2); ctx.scale(s, s); ctx.translate(-540, -cy2);
          ctx.beginPath(); up.forEach((p, i) => { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); dn.reverse().forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath();
          ctx.fillStyle = C.bg; ctx.fill(); ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.strokeStyle = C.pu; ctx.stroke(); ctx.restore();
          txt('teardrop · 10×', 480, cy2 + 14, { size: 44, w: 800, a: clamp((t - t2 - 0.3) / 0.2) });
        }
        const pe = popS(t, TR('same:0'), null); txt('=', 250, 880 + dy, { size: 120, w: 800, f: F.U, c: C.pu, a: pe.a, s: pe.s });
      } },
    why: { type: 'rider', amb: 0.16, pose: { back: 'tip:2', head: 'tip:3', elbows: 'tip:4' },
      heads: [{ at: 'why:0', title: 'Not how big', big: 'how smooth', bigAt: 'why:3' }, { at: 'tip:0', title: 'On the bike', big: 'think smooth', bigAt: 'tip:1' }] }
  },
  facts: P => [],
  sources: 'Učebnicový výsledek: kruhový válec má Cd asi 1,2 a proudnicový profil asi 0,12 (vztaženo k čelní ploše, Re kolem 10^5), profil 10× tlustší má tedy přibližně stejný odpor (Hoerner, Fluid-Dynamic Drag; White, Fluid Mechanics).'
};
