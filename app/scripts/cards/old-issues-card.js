var mvc = require('../utils/mvc.js');
var common = require('../utils/common.js');

var loadOldIssuesCard = function loadOldIssuesCard(oldIssues, totalIssuesCount) {
  if (oldIssues.length) {
    mvc.setLoadingMessage('Found old issues...');
    oldIssues.sort(function(a,b){return (a.created_at > b.created_at ? 1 : (a.created_at < b.created_at ? -1 : 0)) });
    var featuredOI = oldIssues.slice(0, 2);
    for(hp in featuredOI) {
      featuredOI[hp].featured_labels =  featuredOI[hp].type_labels;
    }
    mvc.addCard(MyApp.templates.cards.orgs.issues({title: Math.round((oldIssues.length / totalIssuesCount * 100))+'% of issues are collecting dust.', description: oldIssues.length+' issues were created more than 4 months ago, go over them now to see what is no longer relevant.', action: 'Review old issues', action_url: '#', issues: featuredOI}));
  }
}

window.MyApp.mvc.cards.loadOldIssuesCard = loadOldIssuesCard;

module.exports = window.MyApp.mvc.cards.loadOldIssuesCard;
