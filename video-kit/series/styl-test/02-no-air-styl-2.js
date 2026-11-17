// Zkouška stylu na videu what-if-no-air (stejný text a hlas, jiný obraz). Styl 2: letištní tabule, psaní po písmenech a tečkové pole (Kokonut UI), pomalý pohyb kamery (GSAP).
const base = require('../what-if/01-no-air.js');
module.exports = Object.assign({}, base, {
  title: 'what-if-no-air-styl-2',
  about: base.about + ' Styl 2: letištní tabule, psaní po písmenech a tečkové pole (Kokonut UI), pomalý pohyb kamery (GSAP).',
  style: { camera: 'drift', text: 'flap', sub: 'typing', bg: 'dots' }
});
