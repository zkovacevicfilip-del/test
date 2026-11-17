// Zkouška stylu na videu what-if-no-air (stejný text a hlas, jiný obraz). Styl 3: glitch, psaní po písmenech a polotónové pozadí (Kokonut UI), úder kamery na velkých číslech (GSAP).
const base = require('../what-if/01-no-air.js');
module.exports = Object.assign({}, base, {
  title: 'what-if-no-air-styl-3',
  about: base.about + ' Styl 3: glitch, psaní po písmenech a polotónové pozadí (Kokonut UI), úder kamery na velkých číslech (GSAP).',
  style: { camera: 'punch', text: 'glitch', sub: 'typing', bg: 'halftone' }
});
