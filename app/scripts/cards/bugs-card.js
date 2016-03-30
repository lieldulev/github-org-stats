var mvc = require('../utils/mvc.js');

var loadBugsCard = function loadBugsCard(bugs) {
  if (bugs.length) { 
    mvc.setLoadingMessage('Found bugs...');
    bugs.sort(function(a,b){
      if ((a.priority_labels.includes('priority-high') && b.priority_labels.includes('priority-high')) ||
          (a.priority_labels.includes('priority-medium') && b.priority_labels.includes('priority-medium')) ||
          (a.priority_labels.includes('priority-low') && b.priority_labels.includes('priority-low'))) {
        return 0;
      } else if (a.priority_labels.includes('priority-high')) {
        return -1;
      } else if (b.priority_labels.includes('priority-high')) {
        return 1;
      } else if (a.priority_labels.includes('priority-medium')) {
        return -1;
      } else if (b.priority_labels.includes('priority-medium')) {
        return 1;
      } else {
        return 0;
      }
    });
    var featuredBugs = bugs.slice(0, 2);
    for(fb in featuredBugs) {
      featuredBugs[fb].featured_labels = featuredBugs[fb].priority_labels;
    }
    mvc.addCard(MyApp.templates.cards.orgs.issues({title: bugs.length+' Bugs on the wall', description: 'Maybe you can crash them?', action: 'All bugs', action_url: '#', issues: featuredBugs}));
  }
};

window.MyApp.mvc.cards.loadBugsCard = loadBugsCard;

module.exports = window.MyApp.mvc.cards.loadBugsCard;
