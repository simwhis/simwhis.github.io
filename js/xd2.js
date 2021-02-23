// XD functions from http://www.onlineaspect.com/2010/01/15/backwards-compatible-postmessage/
var XD = function() {

    var interval_id,
    last_hash,
    cache_bust = 1,
    attached_callback,
    window = this,
    //isMSIE = ((navigator.appName == 'Microsoft Internet Explorer') || ((navigator.appName == 'Netscape')
    //            && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null)));
    isMSIE = false;  //no longer need to communicate cross window/ tab, so allow use of IE postMessage only

    return {
        postMessage : function(message, target_url, target) {
            if (!target_url) {
                return;
            }
            target = target || parent;  // default to parent
            // IE doesn't support postMessage between windows, only between frames.
            // So on IE we send both types, because either one or the other will work!
            if (window['postMessage']) {
                // the browser supports window.postMessage, so call it with a targetOrigin
                // set appropriately, based on the target_url parameter.
                try {
                    target['postMessage'](message, target_url.replace( /([^:]+:\/\/[^\/]+).*/, '$1'));
                } catch (err) {
                    // IE9 will fail here, as it has window['postMessage'] but it's not supported.
                }
            }
            if (isMSIE && target_url) {
                // Use the window.location.hash fragment hack
                var hash = (+new Date()) + (cache_bust++) + '&' + message;
                if (target_url == "*") {
                    // This does not work cross-domain! It's just a fallback for packages generated before the IE7 fix.
                    // For cross-domain communiation with hash changes, a proper target_url is necessary.
                    target.location.hash = hash;
                } else {
                    target.location = target_url.replace(/#.*$/, '') + '#' + hash;
                }
            }
        },
        receiveMessage : function(callback, source_origin) {
            if (window['postMessage']) {
                // bind the callback to the actual event associated with window.postMessage
                if (callback) {
                    attached_callback = function(e) {
                        if ((typeof source_origin === 'string' && e.origin !== source_origin)
                        || (Object.prototype.toString.call(source_origin) === "[object Function]" && source_origin(e.origin) === !1)) {
                             return !1;
                         }
                         callback(e);
                     };
                 }
                 if (window['addEventListener']) {
                     window[callback ? 'addEventListener' : 'removeEventListener']('message', attached_callback, !1);
                 } else if (attached_callback) {
                     window[callback ? 'attachEvent' : 'detachEvent']('onmessage', attached_callback);
                 }
             }
             // on IE, which supports post-message between frames only, listen for both message events and location hash changes
             if (isMSIE || !window['postMessage']) {
                 // a polling loop is started & callback is called whenever the location.hash changes
                 interval_id && clearInterval(interval_id);
                 interval_id = null;
                 if (callback) {
                     interval_id = setInterval(function() {
                         var hash = document.location.hash,
                         re = /^#?\d+&/;
                         if (hash !== last_hash && re.test(hash)) {
                             last_hash = hash;
                             callback({data: hash.replace(re, '')});
                         }
                     }, 100);
                 }
             }
         }
    };
}();

