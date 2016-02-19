var mvc = require('../utils/mvc.js');

function registerDataListener() {
  MyApp.go.on('repoListUpdated', function(repos){
    repos.sort(function(a,b){return b.open_issues_count - a.open_issues_count});
    mvc.addCard(MyApp.templates.cards.orgs.repos({reposCount: repos.length, repos: repos.slice(0, 5)}));
    mvc.setLoadingMessage('Loading issues...');
  });

  MyApp.go.on('issuesListUpdated', function(issues){
    mvc.setLoadingMessage('Sorting issues...');
    var bugs = [];
    var highPriority = [];
    var oldIssues = [];
    var d = new Date();
    d.setDate(d.getDate() - 122);
    var createdBefore = d.toISOString();

    for (iss in issues) {
      if (issues[iss].is_bug) {
        bugs.push(issues[iss]);
      }

      if (issues[iss].priority_labels.includes('priority-high')) {
        highPriority.push(issues[iss]);
      }

      if (issues[iss].created_at < createdBefore) {
        oldIssues.push(issues[iss]);
      }
    }

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
      mvc.addCard(MyApp.templates.cards.orgs.issues({title: bugs.length+' Bugs on the wall', description: 'Maybe you can crash them?', issues: featuredBugs}));
    }

    if (highPriority.length) {
      mvc.setLoadingMessage('Found high priority issues...');
      highPriority.sort(function(a,b){return (a.created_at > b.created_at ? 1 : (a.created_at < b.created_at ? -1 : 0)) });
      var featuredHP = highPriority.slice(0, 2);
      for(hp in featuredHP) {
        featuredHP[hp].featured_labels =  MyApp.utils.intersectArrays(featuredHP[hp].labels_simple, ['bug','task','enchancement']);
      }
      mvc.addCard(MyApp.templates.cards.orgs.issues({title: highPriority.length+' High Priority Issues', description: 'Require immediate attention:', issues: featuredHP}));
    }

    if (oldIssues.length) {
      mvc.setLoadingMessage('Found old issues...');
      oldIssues.sort(function(a,b){return (a.created_at > b.created_at ? 1 : (a.created_at < b.created_at ? -1 : 0)) });
      var featuredOI = oldIssues.slice(0, 2);
      for(hp in featuredOI) {
        featuredOI[hp].featured_labels =  MyApp.utils.intersectArrays(featuredOI[hp].labels_simple, ['bug','task','enchancement']);
      }
      mvc.addCard(MyApp.templates.cards.orgs.issues({title: Math.round((oldIssues.length / issues.length * 100))+'% of issues are collecting dust.', description: oldIssues.length+' issues were created more than 4 months ago.', issues: featuredOI}));
    }

  });
}

var orgs = mvc.newController({

  dashboard : function(params) {
    //console.log(this);
    var self = this;
    MyApp.go.orgDetails(params['orgName'], function(err, data) {
      if (err) {
        return mvc.renderError('Organization was not found.', '404');
      } else {
        // MyApp.go.fetchChanges
        var templateParams = $.extend({org : data}, {user: store.get('__gos_user_'+MyApp.go.login)});
        //console.log(self);
        self.render(MyApp.templates.orgs.dashboard(templateParams));
        mvc.addCard(MyApp.templates.cards.orgs.members(templateParams));
        mvc.addLoadingCard();
        registerDataListener();
        mvc.setLoadingMessage('Loading repositories...');
      }
    });
  }
});

module.exports = orgs;


