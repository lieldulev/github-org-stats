var mvc = require('../utils/mvc.js');
var common = require('../utils/common.js');
var dataPiep = require('../utils/data-pipe.js');

function registerDataListeners() {
  window.MyApp.dataPipe.on('repoFetched', require('../cards/active-repos-card.js'));
  window.MyApp.dataPipe.on('bugsListUpdated', require('../cards/bugs-card.js'));
  window.MyApp.dataPipe.on('highPriorityListUpdated', require('../cards/high-priority-issues-card.js'));
  window.MyApp.dataPipe.on('oldIssuesListUpdated', require('../cards/old-issues-card.js'));
  window.MyApp.dataPipe.on('issuesListUpdated', require('../processors/issues_index.js'));
}

var orgs = mvc.newController({
  dashboard : function(params) {
    console.log('dashboard');
    var self = this;
    registerDataListeners();
    MyApp.go.orgDetails(params['orgName'], function(err, data) {
      console.log('back from orgDetails');
      if (err) {
        return mvc.renderError('Organization was not found.', '404');
      } else {
        var templateParams = $.extend({org : data}, {user: store.get('__gos_user_'+MyApp.go.login)});
        self.render(MyApp.templates.orgs.dashboard(templateParams));
        self.setTitle(params['orgName']+' Dashboard');
        mvc.addCard(MyApp.templates.cards.orgs.members(templateParams));
        mvc.addLoadingCard();
        mvc.setLoadingMessage('Loading cards...');
      }
    });
  },

  apply_labels : function(params) {
    var self = this;
    mvc.loadingProgress(5);
    mvc.setLoadingMessage("Loading organization details.");
    window.MyApp.dataPipe.on('orgUpdated', function() {
      mvc.loadingProgress(15);
      mvc.setLoadingMessage("Loading repositories.");
    });
    window.MyApp.dataPipe.on('repoFetched', function() {
      mvc.loadingProgress(35);
      mvc.setLoadingMessage("Analyzing labels...");
    });
    MyApp.go.orgDetailsOptions(params['orgName'], false, function(err, data) {
      if (err) {
        return mvc.renderError('Organization was not found.', '404');
      } else {
        window.MyApp.dataPipe.on('reposLabelsUpdated', function(data) {
          console.log(data);
          var badRepos = [];
          $.each(data, function(i, val) {
            if (val.missingLabels.length > 0) {
              badRepos.push($.extend({missingLabelsCount: val.missingLabels.length, missingLabels: val.missingLabels}, val));
            }
          });
          mvc.render(MyApp.templates.cards.issues.apply_labels({repoCount : Object.keys(badRepos).length, orgName: params['orgName'], repos : badRepos.slice(0, 10), reposDiff: (Object.keys(badRepos).length > 10 ? (Object.keys(badRepos).length - 10) : 0)}));
          self.setTitle('Upgrade Labels ('+params['orgName']+')');
        //mvc.addLoadingCard();
        //mvc.setLoadingMessage('Loading cards...');


          // Upgrade dynamically 
          //componentHandler.upgradeElement(document.getElementById('reposTT'), 'MaterialTooltip');
          //$('#reposTTAnchor').mouseenter(function(){
            //console.log("150px", ($("#reposTTAnchor").css("top")));
            //setTimeout(function(){$('#reposTT').css({"left" : "150px", "top" : ($("#reposTTAnchor").css("top"))}); }, 50);
          //});
        });
      }
    });
  }
});

module.exports = orgs;


