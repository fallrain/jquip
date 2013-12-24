jquip['plug']("events", function(jquip){
  var doc = document, handlers = {}, _jquid = 1;
  function jquid(el){
    return el._jquid || (el._jquid = _jquid++);
  }
  function bind(o, type, fn){
    if (o.addEventListener)
      o.addEventListener(type, fn, false);
    else {
      o['e' + type + fn] = fn;
      o[type + fn] = function(){
        o['e' + type + fn](window.event);
      };
      o.attachEvent('on' + type, o[type + fn]);
    }
  } jquip['bind'] = bind;
  function unbind(o, type, fn){
    if (o.removeEventListener)
      o.removeEventListener(type, fn, false);
    else {
      o.detachEvent('on' + type, o[type + fn]);
      o[type + fn] = null;
    }
  } jquip['unbind'] = unbind;
  function parseEvt(evt){
    var parts = ('' + evt).split('.');
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')};
  }
  function matcherFor(ns){
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |jquip)');
  }
  function findHdls(el, evt, fn, sel){
    evt = parseEvt(evt);
    if (evt.ns) var m = matcherFor(evt.ns);
    return jquip['_filter'](handlers[jquid(el)] || [], function(hdl){
      return hdl
        && (!evt.e  || hdl.e == evt.e)
        && (!evt.ns || m.test(hdl.ns))
        && (!fn     || hdl.fn == fn)
        && (!sel    || hdl.sel == sel);
    });
  }
  function addEvt(el, evts, fn, sel, delegate){
    var id = jquid(el), set = (handlers[id] || (handlers[id] = []));
    jquip['_each'](evts.split(/\s/), function(evt){
      var handler = jquip['extend'](parseEvt(evt), {fn: fn, sel: sel, del: delegate, i: set.length});
      set.push(handler);
      bind(el, handler.e, delegate || fn);
    });
    el = null;
  }
  function remEvt(el, evts, fn, sel){
    var id = jquid(el);
    jquip['_each']((evts || '').split(/\s/), function(evt){
      jquip['_each'](findHdls(el, evt, fn, sel), function(hdl){
        delete handlers[id][hdl.i];
        unbind(el, hdl.e, hdl.del || hdl.fn);
      });
    });
  }
  var evtMethods = ['preventDefault', 'stopImmediatePropagation', 'stopPropagation'];
  function createProxy(evt){
    var proxy = jquip['extend']({originalEvent: evt}, evt);
    jquip['_each'](evtMethods, function(key){
      if(evt[key]){
        proxy[key] = function(){
          return evt[key].apply(evt, arguments);
        };
      }
    });
    return proxy;
  }
  var p = jquip['fn'];
  jquip['_each'](("blur focus focusin focusout load resize scroll unload click dblclick " +
    "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
    "change select submit keydown keypress keyup error").split(" "),
    function(name){
      p[name] = function(fn, data){
        return arguments.length > 0 ? this['bind'](name, fn, data) : this['trigger'](name);
      };
    }
  );
  p['bind'] = function(type, cb){
    return this['each'](function(){
      addEvt(this, type, cb);
    });
  };
  p['unbind'] = function(type, cb){
    return this['each'](function(){
       remEvt(this, type, cb);
    });
  };
  p['one'] = function(evt, cb){
    return this['each'](function(){
      var self = this;
      addEvt(this, evt, function wrapper(){
        cb.apply(self, arguments);
        remEvt(self, evt, arguments.callee);
      });
    });
  };
  p['delegate'] = function(sel, evt, cb){
    return this['each'](function(i, el){
      addEvt(el, evt, cb, sel, function(e){
        var target = e.target||e.srcElement, nodes = jquip['$$'](sel, el);
        while (target && jquip['_indexOf'](nodes, target) < 0)
          target = target.parentNode;
        if (target && !(target === el) && !(target === document)){
          cb.call(target, jquip['extend'](createProxy(e||window.event), {
            currentTarget: target, liveFired: el
          }));
        }
      });
    });
  };
  p['undelegate'] = function(sel, evt, cb){
    return this['each'](function(){
       remEvt(this, evt, cb, sel);
    });
  };
  p['live'] = function(evt, cb){
    jquip(doc.body)['delegate'](this['selector'], evt, cb);
    return this;
  };
  p['die'] = function(evt, cb){
    jquip(doc.body)['undelegate'](this['selector'], evt, cb);
    return this;
  };

  p['on'] = function(evt, sel, cb){
    return typeof sel === 'function' ? this.bind(evt, sel) : this.delegate(sel, evt, cb);
  };

  p['off'] = function(evt, sel, cb){
    return typeof sel === 'string' ? this.undelegate(sel, evt, cb) : this.unbind(evt, cb);
  };
    p['trigger'] = function (evt) {
        return this['each'](function () {
            if ((evt == "click" || evt == "blur" || evt == "focus") && this[evt])
                return this[evt]();
            if (doc.createEvent) {
                var e = doc.createEvent('Events');
                this.dispatchEvent(e, e.initEvent(evt, true, true));
            } else if (this.fireEvent)
                try {
                    if (evt !== "ready") {
                        this.fireEvent("on" + evt);
                    }
                } catch (e) { }
        });
    };
  if (!jquip['init']) jquip(window)['bind']("load",jquip['onload']);
});
