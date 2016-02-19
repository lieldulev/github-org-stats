var mvc = window.MyApp.mvc = require('./scripts/utils/mvc.js');

// First thing we do is indicate some progress;
mvc.loadingProgress(3);
mvc.setLoadingMessage("Checking comptaibility...");

if (!store.enabled) {
  return mvc.renderError('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade to a modern browser.', 'browser');
}

mvc.loadingProgress(6);
mvc.setLoadingMessage("Loading routes and controllers.");

var go = window.MyApp.go = require('./scripts/utils/github-orgs.js');
var router = window.MyApp.router = require('./scripts/utils/router.js');

// TODO: change / to try to load 
// (and maybe sign_in should ask if continue as user / switch instead of automatic redirect)
// Load controllers and define routes
router.controllers({
  errors  : require('./scripts/controllers/errors.js'),
  auth    : require('./scripts/controllers/auth.js'),
  members : require('./scripts/controllers/members.js'),
  orgs    : require('./scripts/controllers/orgs.js')
}).routes({
  '/' : 'auth.signIn',
  'errors/{template}' : 'errors.show',
  'sign_in' : 'auth.signIn',
  'sign_out' : 'auth.signOut',
  'orgs_pick' : 'auth.orgsPick',
  'orgs/{orgName}' : {action: 'orgs.dashboard', requires: go.isAuthenticated, or: 'sign_in'},
  'orgs/{orgName}/members/{member}' : 'members.show'
}).register();

mvc.loadingProgress(12);
mvc.setLoadingMessage("Starting...");

// Wait a bit, give some time for the authentication test
if (go.connectionTesting) {
  mvc.setLoadingMessage("Signing in...");
  go.on('tokenTested', function(err,data) {
    router.start();
  });
} else {
  router.start();
}

