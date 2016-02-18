var common = require('./common.js');
var __tokenKey = '_gos_atoken';
var __token = store.get(__tokenKey);
var __callbacks = {}

function authGithub(aToken) {
  return new Github({
    token: aToken || __token, 
    auth: "oauth"
  });
}

function githubUser(aToken) {
  var github = this.authGithub(aToken);
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

function orgDetails(orgName, cb) {
  var self = this;
  var storedDetails = store.get('__gos_org_'+orgName);
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
          if (details != storedDetails) {
            store.set('__gos_org_'+orgName, details);
            self.emit('orgUpdated', details)
          }
        }
      });
    }
  });
}

function testToken(cb) {
  this.connectionTesting = true;
  var self = this;
  this.isATokenValid(null, function(err,data){
    self.connectionTested = true;
    if (data) {
      self.authenticated = true;
      self.login = data['login'];
    }
    self.connectionTesting = false;
    if (typeof cb === 'function') { cb(err,data); }
    self.emit('tokenTested', err, data);
  });
}

var go = $.extend({
  connectionTested : false,
  connectionTesting : false,
  authenticated : false,
  isAuthenticated : function() { return go.authenticated},
  login : null,
  token : token,
  saveToken : saveToken,
  deleteToken : deleteToken,
  hasToken : hasToken,
  authGithub : authGithub,
  orgDetails : orgDetails,
  githubUser: githubUser,
  isATokenValid: isATokenValid,
  testToken: testToken
}, common.eventEmitter());

window.MyApp.go = go;

if (window.MyApp.go.hasToken()) {
  window.MyApp.go.testToken();
}

module.exports = go;
