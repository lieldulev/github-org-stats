var mvc = require('../utils/mvc.js');
var common = require('../utils/common.js');

var loadhighPriorityCard = function loadhighPriorityCard(highPriority) {
  if (highPriority.length) {
    mvc.setLoadingMessage('Found high priority issues...');
    highPriority.sort(function(a,b){return (a.created_at > b.created_at ? 1 : (a.created_at < b.created_at ? -1 : 0)) });
    var featuredHP = highPriority.slice(0, 2);
    for(hp in featuredHP) {
      featuredHP[hp].featured_labels =  featuredHP[hp].type_labels;
    }
    mvc.addCard(MyApp.templates.cards.orgs.issues({title: highPriority.length+' High Priority Issues', description: 'Require immediate attention:', action: 'All High priority', action_url: '#', issues: featuredHP}));
  }
}

window.MyApp.mvc.cards.loadhighPriorityCard = loadhighPriorityCard;

module.exports = window.MyApp.mvc.cards.loadhighPriorityCard;
