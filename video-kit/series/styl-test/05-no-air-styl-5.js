// Zkouška stylu na videu what-if-no-air (stejný text a hlas, jiný obraz). Styl 5: čísla jako počítadlo (Kokonut Dynamic Text), kinetické nadpisy, nový akt se otočí jako karta (GSAP).
const base = require('../what-if/01-no-air.js');
module.exports = Object.assign({}, base, {
  title: 'what-if-no-air-styl-5',
  about: base.about + ' Styl 5: čísla jako počítadlo (Kokonut Dynamic Text), kinetické nadpisy, nový akt se otočí jako karta (GSAP).',
  style: { camera: 'flip', text: 'slot' }
});
