// Zkouška stylu na videu what-if-no-air (stejný text a hlas, jiný obraz). Styl 4: kinetická slova a fialový zvýrazňovač pod velkými čísly (Kokonut Marker Text), švih kamery (GSAP).
const base = require('../what-if/01-no-air.js');
module.exports = Object.assign({}, base, {
  title: 'what-if-no-air-styl-4',
  about: base.about + ' Styl 4: kinetická slova a fialový zvýrazňovač pod velkými čísly (Kokonut Marker Text), švih kamery (GSAP).',
  style: { camera: 'whip', text: 'marker' }
});
