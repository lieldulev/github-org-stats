var mvc = require('../utils/mvc.js');

var orgs = mvc.newController({

  dashboard : function(params) {
    console.log(this);
    var self = this;
    MyApp.go.orgDetails(params['orgName'], function(err, data) {
      if (err) {
        return mvc.renderError('Organization was not found.', '404');
      } else {
        // MyApp.go.fetchChanges
        console.log(self);
        self.render(MyApp.templates.orgs.dashboard(data));
        mvc.addCard(MyApp.templates.cards.orgs.members(data));
        mvc.addLoadingCard();
      }
    });
  }
});

module.exports = orgs;


