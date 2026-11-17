// Zkouška stylu na videu what-if-no-air (stejný text a hlas, jiný obraz). Styl 1: kinetická slova a švih kamery mezi akty (GSAP).
const base = require('../what-if/01-no-air.js');
module.exports = Object.assign({}, base, {
  title: 'what-if-no-air-styl-1',
  about: base.about + ' Styl 1: kinetická slova a švih kamery mezi akty (GSAP).',
  style: { camera: 'whip', text: 'words' }
});
