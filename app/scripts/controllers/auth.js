var mvc = require('../utils/mvc.js');
var go = require('../utils/github-orgs.js');

// Attach events on document (since elements do not exist yet)
$(document).on('keyup', "#auth_signin_atoken", function (e) {
    if (e.keyCode == 13) {
      $('#sign_in_submit').click();
    }
    return false;
});

var auth = mvc.newController({
  signIn : function(){
    // If not connected load sign-in screen
    if (!MyApp.go.hasToken()) {
      // If sign in page is not visible
      if ($('#auth_signin_atoken').length == 0) {
        mvc.render(MyApp.templates.auth.sign_in());
      // if input box has value - check it 
      } else if ($('#auth_signin_atoken')[0].value) {
        $('#sign_in_submit')[0].disabled = true;
        $('#sign_in_submit')[0].innerText = 'Checking';
        var token = $('#auth_signin_atoken')[0].value;
        go.isATokenValid(token, function(err, data) {
          if (err) {
            $('#sign_in_error')[0].class = 'mdl-color-text--red-A700';
            $('#sign_in_box').removeClass('slideInLeft');
            $('#sign_in_box').animateCss('shake');
            if (err.error == 401) {
              $('#sign_in_error')[0].innerText = 'Bad credentials';
            } else {
              $('#sign_in_error')[0].innerText = 'Unknown error.';
              console.log(err);
            }
            $('#sign_in_submit')[0].innerText = 'Continue';
            $('#sign_in_submit')[0].disabled = false;
            return false;
          } else { // All good, save and move along.
            $('#sign_in_error')[0].className = 'mdl-color-text--green-A700';
            $('#sign_in_error')[0].innerText = 'Welcome '+data.login;
            MyApp.go.saveToken(token);
            MyApp.go.authenticated = true;
            mvc.navigateTo("orgs_pick");
          }
        });
        return false;
      } else { // Wait for input
        $('#auth_signin_atoken').focus();
      }
    } else if (MyApp.go.connectionTesting) { // There is an access token, check it
        MyApp.go.on('tokenTested', function(err, data) {
          if (!MyApp.go.authenticated) {
              mvc.render(MyApp.templates.auth.sign_in());
              $('#sign_in_error')[0].class = 'mdl-color-text--red-A700';
              $('#sign_in_error')[0].innerHTML = 'Stored access token was rejected. <br/><code style="font-size:x-small">Token: '+store.get('_gos_atoken')+'</code>';
              $('#auth_signin_atoken').focus();
              store.remove('_gos_atoken');
          } else { // All good, move along.
              mvc.navigateTo("orgs_pick");
          }
        });
    } else {
      if (!MyApp.go.authenticated) {
          mvc.render(MyApp.templates.auth.sign_in());
          $('#sign_in_error')[0].class = 'mdl-color-text--red-A700';
          $('#sign_in_error')[0].innerHTML = 'Stored access token was rejected. <br/><code style="font-size:x-small">Token: '+store.get('_gos_atoken')+'</code>';
          $('#auth_signin_atoken').focus();
          store.remove('_gos_atoken');
      } else { // All good, move along.
          mvc.navigateTo("orgs_pick");
      }
    }
  },

  orgsPick : function() {
    var user = go.githubUser(store.get('_gos_atoken'));
    var templateData = {"organizations" : []};
    user.orgs(function(err, orgs){
      if (err) {
        mvc.navigateTo("sign_in");
      } else {
        for(org in orgs) {
          templateData['organizations'].push({'login' : orgs[org].login, 'avatar' : orgs[org].avatar_url});
        }
        if ( templateData['organizations'].length == 0) {
          mvc.render(MyApp.templates.auth.no_orgs({'username' : go.login}));
        } else if ( templateData['organizations'].length == 1) {
          mvc.navigateTo("orgs/"+templateData['organizations']['login']);
        } else {
          templateData['organizations'].sort();
          mvc.render(MyApp.templates.auth.orgs_pick(templateData));
        }
      }
    });
  }
});

module.exports = auth;
