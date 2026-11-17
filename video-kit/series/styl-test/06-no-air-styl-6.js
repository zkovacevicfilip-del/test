// Zkouška stylu na videu what-if-no-air (stejný text a hlas, jiný obraz). Styl 6: slova se odkrývají zpod linky, fialové stírání mezi akty, plující čáry v pozadí (Kokonut Background Paths).
const base = require('../what-if/01-no-air.js');
module.exports = Object.assign({}, base, {
  title: 'what-if-no-air-styl-6',
  about: base.about + ' Styl 6: slova se odkrývají zpod linky, fialové stírání mezi akty, plující čáry v pozadí (Kokonut Background Paths).',
  style: { camera: 'drift', text: 'reveal', overlay: 'wipe', bg: 'paths' }
});
