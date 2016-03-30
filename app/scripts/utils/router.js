var mvc = require('./mvc.js');
var dataPipe = require('./data-pipe.js');

var Router = {
  _routes : {},
  _controllers : {}
};

Router.routes = function(routesObj) {
  var transformedRoutes = {}
  for (route in routesObj) {
    if (typeof routesObj[route] === "string") {
      transformedRoutes[route] = {action: routesObj[route]}
    } else {
      transformedRoutes[route] = routesObj[route]
    }
  }
  Router._routes = transformedRoutes;
  return Router;
}

Router.controllers = function(controllersObj) {
  Router._controllers = controllersObj;
  return Router;
}

Router.register = function(eventHandler) {
  window.onhashchange = Router.listener;
  return Router;
}

Router.start = function () {
  console.log('starting');
  Router.listener(); // Simulate a hash change.
}

Router.listener = function() {
  var clientSidePath = document.location.hash.toString().trim();

  // #path or go to /
  if (clientSidePath.indexOf('#') == 0) {
    clientSidePath = clientSidePath.substr(1);
  } else {
    clientSidePath = '/';
  }

  // ignore trailing / (#path/to/ => #path/to), single / is okay.
  if (clientSidePath.length > 1 && clientSidePath.lastIndexOf('/') == (clientSidePath.length -1)) {
    clientSidePath = clientSidePath.substr(0, (clientSidePath.length -1));
  }


  mvc.renderLoadingScreen();

  // Simple route (no path params)
  if (Router._routes[clientSidePath]){
    eval('Router._controllers.'+Router._routes[clientSidePath].action+'();');
  } else {
    // try to see if match fuzzy routrs
    var found = false;
    for(route in Router._routes) {
      if (route.indexOf('{') != -1) {
        var routeParts = route.split('/');
        var clientParts = clientSidePath.split('/');
        if (routeParts.length == clientParts.length) {
          var allMatched = true;
          var collectedParams = {};
          for (var i =0; i < routeParts.length; i++) {
            if (routeParts[i].indexOf('{') == 0 && clientParts[i]) {
              var paramName = routeParts[i].substr(1, routeParts[i].length -2);
              // accept only a-Z and _ in param names
              if(paramName.match(/^[A-Z][A-Z0-9_]*[A-Z0-9]+$/i)) {
                collectedParams[paramName] = clientParts[i];
              } else {
                //allMatched = false;
                return mvc.renderError('Routing error: Illegal path parameter name ("'+paramName+'" in "'+Router._routes[route].action+'")');
              }
            } else if (routeParts[i] != clientParts[i]) {
              allMatched = false;
            }
          }
          if (allMatched) {
            found = true;
            if (typeof Router._routes[route].requires === 'function') {
              if (Router._routes[route].requires()) { 
                eval('Router._controllers.'+Router._routes[route].action+'(collectedParams);');
              } else {
                mvc.navigateTo(Router._routes[route].or);
              }
            } else if (typeof Router._routes[route].requires === 'boolean') {
              if (Router._routes[route].requires) { 
                eval('Router._controllers.'+Router._routes[route].action+'(collectedParams);');
              } else {
                mvc.navigateTo(Router._routes[route].or);
              }
            } else {
              eval('Router._controllers.'+Router._routes[route].action+'(collectedParams);');
            }
          }
        }
      }
    }

    if (!found) { 
      mvc.renderError('', '404')
      console.log('404 - '+clientSidePath);
    }
  }
}

module.exports = Router;


