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
