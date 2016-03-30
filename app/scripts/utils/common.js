if (typeof window.MyApp === 'undefined') {
  window.MyApp = {};
}

var eventEmitter = function() {
  return { 
    _listeners : {},
    _addListenerUnique : function(event, listener, options) {
      var objListener = {
        listener : listener,
        options : options || {once: false}
      };
      if (typeof this._listeners[event] === 'undefined') {
        this._listeners[event] = []
        return this._listeners[event].push(objListener);
      } else {
        var found = false;
        for(currListener in this._listeners[event]) {
          console.log(this._listeners[event][currListener].listener, listener, (this._listeners[event][currListener].listener == listener));
          if (this._listeners[event][currListener].listener == listener) {
            // update options?
            found = true;
          }
        }
        if (!found) {
          return this._listeners[event].push(objListener);
        }
      }
    },
    on : function(event, options, listener) {
      // check event name
      if (typeof event !== 'string') {
        throw 'event must be a string.';
      }

      // passed event, listener
      if (options && !listener && (typeof options === 'function')) {
        return this._addListenerUnique(event, options);
      } else if (typeof listener !== 'function') { 
        throw 'listener must be a function.';
      } else {
        return this._addListenerUnique(event, listener, options);
      }
    },
    emit : function(event) {
      console.log(event);
      this._listeners[event] = this._listeners[event] || [];
      args = Array.prototype.slice.call(arguments, 1);
      for (listener in this._listeners[event]) {
        this._listeners[event][listener].listener.apply(this, args)
      }
    }
  }
}

var intersectArrays = function (a, b)
{
  var ai=0, bi=0;
  var result = new Array();

  while( ai < a.length && bi < b.length )
  {
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else /* they're equal */
     {
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }

  return result;
}


window.MyApp.utils = window.MyApp.utils || {};

window.MyApp.utils.eventEmitter = eventEmitter;
window.MyApp.utils.intersectArrays = intersectArrays;

module.exports = window.MyApp.utils;
