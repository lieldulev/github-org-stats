var mvc = require('../utils/mvc.js');

var members = mvc.newController({

  show: function(params) {
    console.log(params);
  }
});

module.exports = members;

