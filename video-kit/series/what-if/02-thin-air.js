module.exports = {
  title: 'what-if-thin-air',
  about: 'Řídký vzduch ve výšce: stejný výkon, skoro o 4 km/h rychleji. Proto Merckx jel hodinovku v Mexiku.',
  acts: [['hook', 'hook'], ['city', 'where'], ['race', 'race', 'merckx'], ['tip', 'catch', 'tip']],
  lines: {
    hook: { say: 'What if you could ride almost four kilometers per hour faster, without pedaling any harder?', captions: false,
      chunks: ['What if', 'you could ride', ['almost 4 km/h', 'ALMOST'], 'faster,', 'without pedaling', 'any harder?'] },
    where: { say: 'Go to Mexico City. At two thousand three hundred meters, the air is a quarter thinner.',
      chunks: ['Go to Mexico City.', ['At 2,300 meters,', 'AT'], 'the air is', 'a quarter thinner.'] },
    race: { say: 'Same rider, same two hundred fifty watts. Forty kilometers: five minutes faster!',
      chunks: ['Same rider,', ['same 250 watts.', 'SAME'], ['40 kilometers:', 'FORTY'], ['5 minutes faster!', 'FIVE']] },
    merckx: { say: "That's why Eddy Merckx went there in nineteen seventy-two to break the hour record.",
      chunks: ["That's why", ['Eddy Merckx', 'EDDY|EDDIE'], 'went there', ['in 1972', 'IN'], 'to break', 'the hour record.'] },
    catch: { say: 'The catch? Thin air also means less oxygen, so your power drops too.',
      chunks: ['The catch?', 'Thin air also means', 'less oxygen,', 'so your power', 'drops too.'] },
    tip: { say: "You can't thin the air at home. But you can push less of it: get lower.",
      chunks: ["You can't thin", 'the air at home.', 'But you can', 'push less of it:', 'get lower.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you could ride', i: 1 }, { t: '+4 km/h', i: 2, big: true, size: 190 }, { t: 'without pedaling', i: 4 }, { t: 'any harder?', i: 5 }] },
    city: { type: 'rows', amb: 0.2,
      heads: [{ at: 'where:0', title: 'Mexico City', big: '2,300 m', bigAt: 'where:1' }],
      rows: [{ label: 'Sea level', value: 100, left: '100%', leftCap: 'AIR DENSITY', at: 'where:1', leftAt: 'where:2', c: 'ink' }, { label: 'Mexico City', value: 76, left: '#%', lc: [100, 76, 0], leftCap: 'AIR DENSITY', at: 'where:2', leftAt: 'where:3', c: 'pu', right: '−24%' }] },
    race: { type: 'race', amb: 0.13,
      heads: [{ at: 'race:1', big: '250 W', c: 'ink', sub: 'same rider · same power', subAt: 'race:0' }, { at: 'race:3', big: '5:03', sub: 'faster over 40 km' }, { at: 'merckx:1', title: 'Eddy Merckx, 1972', sub: 'hour record in Mexico City', subAt: 'merckx:4' }],
      lanes: [{ label: 'Sea level', v: 40.0, show: '# km/h', at: 'race:0', c: 'ink' }, { label: '2,300 m', v: 43.7, show: '# km/h', at: 'race:0+0.12', c: 'pu' }],
      start: 'race:2', end: 'race:3+0.3', finish: '40 km', gap: { text: '5:03 behind' } },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:4', elbows: 'tip:4+0.3', head: 'tip:4+0.15' }, fillAt: 'catch:0',
      heads: [{ at: 'catch:0', title: 'The catch', big: 'less oxygen', bigAt: 'catch:2' }, { at: 'tip:0', title: 'Push less air', big: 'Get lower', bigAt: 'tip:4' }] }
  },
  facts: P => [
    ['hustota vzduchu ve 2300 m proti hladině moře, %', P.rho({ alt: 2300 }) / P.rho() * 100, 76, 0.5],
    ['250 W ve 2300 m, km/h', P.kmh(250, { alt: 2300 }), 43.7, 0.05],
    ['o kolik km/h rychleji', P.kmh(250, { alt: 2300 }) - P.kmh(250), 3.7, 0.05],
    ['rozdíl času na 40 km, s', P.time(250, 40) - P.time(250, 40, { alt: 2300 }), 303, 1]
  ],
  sources: 'Eddy Merckx, hodinový rekord 49,431 km, Ciudad de México, 25. 10. 1972 (dráha asi 2 300 m n. m.). Výpočet předpokládá stejný výkon; ve výšce výkon jezdce ve skutečnosti klesá (méně kyslíku), video to říká.'
};
