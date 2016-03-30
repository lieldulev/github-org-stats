var mvc = require('../utils/mvc.js');

var loadReposCard = function loadReposCard(repos) {
  mvc.setLoadingMessage('Loading repositories...');
  repos.sort(function(a,b){return b.open_issues_count - a.open_issues_count});
  mvc.addCard(MyApp.templates.cards.orgs.repos({reposCount: repos.length, repos: repos.slice(0, 5)}));
}

window.MyApp.mvc.cards.loadReposCard = loadReposCard;

module.exports = window.MyApp.mvc.cards.loadReposCard;
