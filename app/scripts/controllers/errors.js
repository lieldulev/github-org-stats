var mvc = require('../utils/mvc.js');

var errors = mvc.newController({

  show: function(params) {
    mvc.renderError('', params['template']);
  }
});

module.exports = errors;



