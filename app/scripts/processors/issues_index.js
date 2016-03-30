var dataPipe = require('../utils/data-pipe.js');

var issuesIndexer = function issuesIndexer(issues) {
  var bugs = [];
  var highPriority = [];
  var oldIssues = [];
  var d = new Date();
  d.setDate(d.getDate() - 122);
  var createdBefore = d.toISOString();

  for (iss in issues) {
    if (issues[iss].labels_simple.includes('bug')) {
      bugs.push(issues[iss]);
    }

    if (issues[iss].priority_labels.includes('priority-high')) {
      highPriority.push(issues[iss]);
    }

    if (issues[iss].created_at < createdBefore) {
      oldIssues.push(issues[iss]);
    }
  }
  //this.emit('issuesIndexed', {bugs: bugs, highPriority: highPriority, oldIssues: oldIssues});
  window.MyApp.dataPipe.emit('bugsListUpdated', bugs);
  window.MyApp.dataPipe.emit('highPriorityListUpdated', highPriority);
  window.MyApp.dataPipe.emit('oldIssuesListUpdated', oldIssues, issues.length);
}

window.MyApp.dataPipe.processors.issuesIndexer = issuesIndexer;

module.exports = window.MyApp.dataPipe.processors.issuesIndexer;
