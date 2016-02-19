if (typeof window.MyApp === 'undefined') {
  window.MyApp = {};
}

function mvcRender(template){
  $('#main')[0].innerHTML = template;
}

function addCard(template) {
  $('#main').append($(template));
}

function addLoadingCard() {
  mvc.addCard(MyApp.templates.cards.common.loading());

  setTimeout(function(){
    componentHandler.upgradeElement(document.getElementById('cardLoadingProgress'));
    $('#close_loading_card').on('click', function(){
      $('#loading_card').animate(
        { width: 0, opacity: 0, height: 0},
        500,
        function() {
          $('#loading_card').remove();
      });
    });
  }, 100);
}

function setLoadingMessage(message) {
  $('#loadingMessage')[0].innerHTML = message;
}

function renderError(message, template) {
  template = template || 'message';
  mvcRender(MyApp.templates.errors[template]({'message':message}));
}

function renderLoadingScreen() {
  mvcRender(MyApp.templates.loading());
}

function loadingProgress(progress) {
  progress = progress | 1;
  $('#loadingProgress')[0].value = progress;
}

function navigateTo(route) {
  document.location.hash = (route == '/' ? '' : route);
}
var mvc = {
  render : mvcRender,
  addCard : addCard,
  addLoadingCard : addLoadingCard,
  setLoadingMessage : setLoadingMessage,
  renderError : renderError,
  renderLoadingScreen : renderLoadingScreen,
  loadingProgress : loadingProgress,
  navigateTo : navigateTo,
  newController : function(customMethods) {
    var template = {
      render : mvc.render
    };

    return $.extend({}, template, customMethods);
  }
}

window.MyApp.mvc = mvc;

HandlebarsIntl.registerWith(Handlebars);

Handlebars.registerHelper ('truncate', function (str, len) {
    if (str && str.length > len && str.length > 0) {
        var new_str = str + " ";
        new_str = str.substr (0, len);
        new_str = str.substr (0, new_str.lastIndexOf(" "));
        new_str = (new_str.length > 0) ? new_str : str.substr (0, len);

        return new Handlebars.SafeString ( new_str +'...' ); 
    }
    return str;
});


module.exports = mvc;
