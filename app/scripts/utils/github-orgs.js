var common = require('./common.js');
var dataPipe = require('./data-pipe.js');
var __keyPrefix = '_gos';
var __tokenKey = __keyPrefix+'_atoken';
var __orgsKeysKey = __keyPrefix+'orgs_keys';
var __token = store.get(__tokenKey);
var __callbacks = {}
var __lastError = null;
var __rlRemaining = null;
var __rlReset = 0;
var __rlLimit = 0;

var priorityLabels = ['priority-high','priority-medium','priority-low'];
var priorityLabelsColors = ['f7c6c7','fad8c7','fef2c0'];
var typeLabels = ['bug','enhancement','question','new feature','task'];
var typeLabelsColors = ['fc2929','84b6eb','cc317c','bfe5bf','bfdadc'];
var statusLabels = ['duplicate','invalid','wontfix','ready','in progress','in review','testing'];
var statusLabelsColors = ['cccccc','e6e6e6','ffffff','bfd4f2','207de5','5319e7','006b75'];

function updateLimits(xhr){
  __rlRemaining = xhr.getResponseHeader('X-RateLimit-Remaining');
  __rlReset = xhr.getResponseHeader('X-RateLimit-Reset');
  __rlLimit = __rlLimit || xhr.getResponseHeader('X-RateLimit-Limit');
}

function getRequest(path, cb){
  Github._request('GET', path, null, function(err, data, xhr) {
    if (err) {
      return cb(err);
    }
    updateLimits(xhr);
    cb(err,data);
  });
}

function getRequestAll(path, cb){
  var results = [];

  (function iterate() {
    Github._request('GET', path, null, function (err, res, xhr) {
      if (err) {
        return cb(err);
      }

      updateLimits(xhr);

      if (!(res instanceof Array)) {
        res = [res];
      }

      results.push.apply(results, res);

      var links = (xhr.getResponseHeader('link') || '').split(/\s*,\s*/g);
      var next = null;

      links.forEach(function (link) {
        next = /rel="next"/.test(link) ? link : next;
      });

      if (next) {
        next = (/<(.*)>/.exec(next) || [])[1];
      }

      if (!next) {
        cb(err, results);
      } else {
        path = next;
        iterate();
      }
    });
  })();
}

function authGithub(aToken) {
  return new Github({
    token: aToken || __token, 
    auth: "oauth"
  });
}

function githubUser(aToken) {
  var github = this.authGithub(aToken || this.token());
  return github.getUser();
}

function isATokenValid(aToken, callback) {
  var u = this.githubUser(aToken);
  u.show('', callback);
}

function saveToken(newToken) {
  store.set(__tokenKey, newToken);
  __token = newToken;
  return token();
}

function deleteToken() {
  store.remove(__tokenKey);
  __token = null;
}

function token(newToken) {
  if (newToken) {
    this.saveToken(newToken);
  }
  return __token;
}

function hasToken() {
  return (!!token())
}

function save(key, data) {
  try { 
    return store.set(__keyPrefix+'_'+key, data);
  } catch (err) {
    console.log(err);
    return false;
  }
}

function load(key, data) {
  return store.get(__keyPrefix+'_'+key);
}

function orgSave(org, key, data) {
  return this.save('org_'+org+'_'+key, data);
}

function orgLoad(org, key) {
  return this.load('org_'+org+'_'+key)
}

// Emits issuesListUpdated and prsListUpdated
function fetchOrgIssuesPrs(orgName) {
  var self = this;
  getRequestAll('/orgs/' + orgName + '/issues?filter=all&page_num=1000&sort=updated&direction=desc', function(err, issues) {
    if(issues) {
      var actualIssues = [];
      var openPRs = [];
      for (currIssue in issues) {
        if (issues[currIssue].pull_request) {
          openPRs.push(issues[currIssue]);
        } else {
          actualIssues.push(issues[currIssue]);
        }
      }

      for (iss in actualIssues) {
        actualIssues[iss].labels_simple = actualIssues[iss].labels.map(function(el){return el.name.toLowerCase()});
        actualIssues[iss].priority_labels = MyApp.utils.intersectArrays(actualIssues[iss].labels_simple, priorityLabels);
        actualIssues[iss].type_labels = MyApp.utils.intersectArrays(actualIssues[iss].labels_simple, typeLabels);
        actualIssues[iss].status_labels = MyApp.utils.intersectArrays(actualIssues[iss].labels_simple, statusLabels);
      }

      try { 
        //self.orgSave(orgName, 'issues', actualIssues);
        self.orgSave(orgName, 'pull_requests', openPRs);
      } catch (err) {
        console.log(err);
      } finally {
        dataPipe.emit('issuesListUpdated', actualIssues);
        dataPipe.emit('prsListUpdated', openPRs);
      }
    } else {
      console.log(err);
    }
  });
}

function fetchOrgRepos(orgName) {
  var self = this;
  getRequestAll('/orgs/' + orgName + '/repos?type=all&page_num=1000&sort=updated&direction=desc', function(err, repos) {
    if(repos) {
      var reposList = repos.reduce(function(map, el) {
        map[el.name] = {
          name: el.name,
          labels: null,
          owner: orgName, 
          open_issues_count: el.open_issues_count
        };
        return map;
      }, {});
      self.orgSave(orgName, 'repos', reposList);
      for (repo in reposList) {
        self.fetchRepoLabels(orgName, repo, function(err, storedRepos){
          if (err) {
            console.log(err);
          } else {
            var finished = true;
            for (repo in storedRepos) { 
              if (storedRepos[repo].labels == null) {
                finished = false
              }
            }
            if (finished){
              dataPipe.emit('reposLabelsUpdated', storedRepos);
            }
          }
        });
      }
      dataPipe.emit('repoFetched', repos);
    }
  });
}

function fetchRepoLabels(orgName, repoName, cb) {
  var self = this;
  getRequest('/repos/'+orgName+'/'+repoName+'/labels', function(err, data){
    if (err) {
      cb(err); 
    } else {
      var storedRepos =  self.orgLoad(orgName, 'repos');
      storedRepos[repoName].labels = data.map(function(el){return el.name});
      self.orgSave(orgName, 'repos', storedRepos);
      cb(null, storedRepos);
    }
  });
}

function orgDetails(orgName, cb) {
  var self = this;
  var storedDetails = self.orgLoad(orgName, 'details');
  // Already have the details, return them
  if (storedDetails) {
    cb(null, storedDetails);
  }
  // Now go refresh
  getRequest('/orgs/' + orgName, function(err, data) {
    if (err) {
      cb(err); 
    } else {
      getRequestAll('/orgs/' + orgName + '/members?type=all&&page_num=1000&sort=updated&direction=desc', function(err, members) {
        if (err) {
          cb(err)
        } else {
          var details = $.extend({}, data, {members: members, membersCount: members.length});
          if (!storedDetails) {
            cb(null, details);
          }

          if (JSON.stringify(details) != JSON.stringify(storedDetails)) {
            console.log('not equal', details, storedDetails);
            self.orgSave(orgName, 'details', details);
            dataPipe.emit('orgUpdated', details)
          }


          // enqueue loading repos
          self.fetchOrgRepos(orgName);

          // enqueue loading issues and open PRs
          self.fetchOrgIssuesPrs(orgName);
        }
      });
    }
  });
}

function testToken(token, cb) {
  this.connectionTesting = true;
  var self = this;
  var bubbledErr, bubbledData = null;
  this.isATokenValid(token, function(err,data){
    try {
      self.connectionTested = true;
      if (data) {
        self.authenticated = true;
        self.login = data['login'];
        self.saveToken(token);
        store.set('__gos_user_'+data['login'], data);
        bubbledData = data;
      } else {
        __lastError = err;
        bubbledErr = err;
      }
    } catch (err) {
      bubbledErr = err;
    } finally {
      self.connectionTesting = false;
      if (typeof cb === 'function') { cb(bubbledErr,bubbledData); }
      self.emit('tokenTested', bubbledErr, bubbledData);
    }
  });
}

function resetAll() {
  this.deleteToken();
  this.connectionTested = false;
  this.connectionTesting = false;
  this.authenticated = false;
  this.login = null;
  __lastError = null;
}

var go = $.extend({
  connectionTested : false,
  connectionTesting : false,
  authenticated : false,
  isAuthenticated : function() { return go.authenticated},
  lastError : function() { return __lastError; },
  login : null,
  token : token,
  rateLimit : function () { return {remaining: __rlRemaining, limit: __rlLimit, reset: __rlReset}; },
  saveToken : saveToken,
  deleteToken : deleteToken,
  resetAll : resetAll,
  save: save,
  load: load,
  orgSave : orgSave,
  orgLoad : orgLoad,
  hasToken : hasToken,
  authGithub : authGithub,
  orgDetails : orgDetails,
  fetchOrgIssuesPrs: fetchOrgIssuesPrs,
  fetchOrgRepos : fetchOrgRepos,
  fetchRepoLabels: fetchRepoLabels,
  githubUser: githubUser,
  isATokenValid: isATokenValid,
  testToken: testToken,
  labels : {
    priorityLabels: priorityLabels,
    typeLabels: typeLabels,
    statusLabels: statusLabels
  }
}, common.eventEmitter());

window.MyApp.go = go;

if (window.MyApp.go.hasToken()) {
  window.MyApp.go.testToken(window.MyApp.go.token());
}

module.exports = go;
