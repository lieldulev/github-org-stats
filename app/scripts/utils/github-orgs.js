var common = require('./common.js');
var __keyPrefix = '_gos';
var __tokenKey = __keyPrefix+'_atoken';
var __orgsKeysKey = __keyPrefix+'orgs_keys';
var __token = store.get(__tokenKey);
var __callbacks = {}
var __lastError = null;

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
  return store.set(__keyPrefix+'_'+key, data);
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

function orgDetails(orgName, cb) {
  var self = this;
  var storedDetails = self.orgLoad(orgName, 'details');
  // Already have the details, return them
  if (storedDetails) {
    cb(null, storedDetails);
  }
  // Now go refresh
  Github._request('GET', '/orgs/' + orgName, null, function(err, data) {
    if (err) {
      cb(err); 
    } else {
      Github._requestAllPages('/orgs/' + orgName + '/members?type=all&&page_num=1000&sort=updated&direction=desc', function(err, members) {
        if (err) {
          cb(err)
        } else {
          var details = $.extend({}, data, {members: members, membersCount: members.length});
          if (!storedDetails) {
            cb(null, details);
          }
          if (JSON.stringify(details) != JSON.stringify(storedDetails)) {
            self.orgSave(orgName, 'details', details);
            self.emit('orgUpdated', details)
          }

          // enqueue loading repos
          Github._requestAllPages('/orgs/' + orgName + '/repos?type=all&page_num=1000&sort=updated&direction=desc', function(err, repos) {
            if(repos) {
              self.orgSave(orgName, 'repos', repos);
              self.emit('repoListUpdated', repos);
            }
          });

          // enqueue loading issues and open PRs
          Github._requestAllPages('/orgs/' + orgName + '/issues?filter=all&page_num=1000&sort=updated&direction=desc', function(err, issues) {
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

              var priorities = ['priority-high','priority-low','priority-medium'];
              for (iss in actualIssues) {
                actualIssues[iss].labels_simple = actualIssues[iss].labels.map(function(el){return el.name.toLowerCase()});
                actualIssues[iss].priority_labels = MyApp.utils.intersectArrays(actualIssues[iss].labels_simple, priorities);
                actualIssues[iss].is_bug = actualIssues[iss].labels_simple.includes('bug');
              }

              try { 
                self.orgSave(orgName, 'issues', actualIssues);
                self.orgSave(orgName, 'pull_requests', openPRs);
              } catch (err) {
                console.log(err);
              } finally {
                self.emit('issuesListUpdated', actualIssues);
                self.emit('prsListUpdated', openPRs);
              }
            } else {
              console.log(err);
            }
          });
          
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
  githubUser: githubUser,
  isATokenValid: isATokenValid,
  testToken: testToken
}, common.eventEmitter());

window.MyApp.go = go;

if (window.MyApp.go.hasToken()) {
  window.MyApp.go.testToken(window.MyApp.go.token());
}

module.exports = go;
