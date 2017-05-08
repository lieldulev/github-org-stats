var mvc = require('../utils/mvc.js');
var go = require('../utils/github-orgs.js');

// Attach events on document (since elements do not exist yet)
$(document).on('keyup', "#auth_signin_atoken", function (e) {
    if (e.keyCode == 13) {
      $('#sign_in_submit').click();
    }
    return false;
});


function registerRefreshSignIn() {
  MyApp.go.on('tokenTested', function(err, data) {
    if (MyApp.go.authenticated) {
      mvc.navigateTo("orgs_pick");
    } else { 
      var errorMessage = 'Can not access Github APIs (no internet?)';
      if(err.error == 401) {
        errorMessage = 'Token was rejected (Bad credentials)';
      }
      $('#sign_in_box').removeClass('slideInLeft');
      $('#sign_in_box').animateCss('shake');
      $('#sign_in_error')[0].innerText = errorMessage;
      $('#sign_in_submit')[0].disabled = false;
      $('#sign_in_submit')[0].innerText = 'Sign In';
      $('#auth_signin_atoken').focus();
    }
  });
}


var auth = mvc.newController({
  signIn : function(){
    mvc.setTitle('Sign In');
    if (MyApp.go.authenticated) { // All good, move along
      mvc.navigateTo("orgs_pick");
    } else if (MyApp.go.connectionTesting) { // Testing, wait for callback
      mvc.render(MyApp.templates.auth.sign_in({waiting: true}));
      registerRefreshSignIn();
    } else if (MyApp.go.hasToken() && MyApp.go.connectionTested && !MyApp.go.authenticated) { // Has Token and failed
        var errorMessage = 'Can not access Github APIs (no internet?)';
        if(MyApp.go.lastError().error == 401) {
          errorMessage = 'Token was rejected (Bad credentials)';
        }
        mvc.render(MyApp.templates.auth.sign_in({waiting: false, errorMessage: errorMessage}));
        registerRefreshSignIn();
    } else if (MyApp.go.hasToken() && !MyApp.go.connectionTested) {
      mvc.render(MyApp.templates.auth.sign_in({waiting: true}));
      registerRefreshSignIn();
      MyApp.go.testToken();
    } else { // First sign in
      mvc.render(MyApp.templates.auth.sign_in());
    }
  },

  signOut : function() {
    MyApp.go.resetAll();
    mvc.navigateTo('/');
  },

  testToken : function() {
    if ($('#auth_signin_atoken')[0].value) {
      $('#sign_in_submit')[0].disabled = true;
      $('#sign_in_submit')[0].innerText = 'Checking';
      $('#sign_in_error')[0].innerText = '';
      MyApp.go.testToken($('#auth_signin_atoken')[0].value);
    }
  },

  orgsPick : function() {
    var user = go.githubUser();
    var templateData = {"organizations" : []};
    user.orgs(function(err, orgs){
      if (err) {

        mvc.navigateTo("sign_in");

      } else {

        for(org in orgs) {
          templateData['organizations'].push({
            'login' : orgs[org].login,
            'avatar' : orgs[org].avatar_url
          });
        }

        if ( templateData['organizations'].length == 0) {
          mvc.render(MyApp.templates.auth.no_orgs({'username' : go.login}));
          mvc.setTitle('No Organizations');
        } else if ( templateData['organizations'].length == 1) {
          mvc.navigateTo("orgs/"+templateData['organizations']['login']);
        } else {
          templateData['organizations'].sort(function(a,b){return a.login > b.login});
          mvc.render(MyApp.templates.auth.orgs_pick(templateData));
          mvc.setTitle('Choose Organization');
        }
      }
    });
  }
});

module.exports = auth;
