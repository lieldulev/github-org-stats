if (typeof window.MyApp === 'undefined') {
  window.MyApp = {};
}

var eventEmitter = function() {
  return { 
    _listeners : {},

    on : function(event, listener) {
      if (typeof listener !== 'function') { throw 'cb must be a function' };
      this._listeners[event] = this._listeners[event] || [];
      return this._listeners[event].push({listener: listener});
    },
    emit : function(event) {
      this._listeners[event] = this._listeners[event] || [];
      args = Array.prototype.slice.call(arguments, 1);
      for (listener in this._listeners[event]) {
        this._listeners[event][listener].listener.apply(this, args)
      }
    }
  }
}


window.MyApp.utils = window.MyApp.utils || {};

window.MyApp.utils.eventEmitter = eventEmitter;

module.exports = window.MyApp.utils;
