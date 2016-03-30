var common = require('./common.js');

if (typeof window.MyApp === 'undefined') {
  window.MyApp = {};
}

var dataPipe = $.extend({
  processors : {},
  connectors : {}
}, common.eventEmitter());


window.MyApp.dataPipe = dataPipe;

module.exports = window.MyApp.dataPipe;
