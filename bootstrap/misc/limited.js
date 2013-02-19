"use strict";

var project = require('project'),
//    deepExtend = require('deep-extend'),
    vm = require('vm'),
    contextCreator = function contextCreator(func) {
        return vm.createScript('\
        var cb = sandbox.callback,\
            cf = (function() {try {return '+func+'} catch(error) {return cb(error);}})(),\
            ca = sandbox.arguments,\
            cr = sandbox.context || (function() {return this})();\
        if (!cf) return cb();\
        delete sb.sandbox;\
        delete sb.sb;\
        ca.push(cb);\
        try {\
            cf.apply(cr, ca)\
        } catch(error) {cb(error)}',
            func.name && func.name + ': running in limited zone' || 'Limited zone');
    };

project.limited = {
    runInNewContext     :   function(sandbox, func) {
        var sliceStep = 2;
        if (arguments.length === 3 && typeof sandbox === 'function') {
            sliceStep = 1;
            func = sandbox;
            sandbox = {};
        } else if (arguments.length < 3) throw Error('Wrong arguments number');

        var args = Array.prototype.slice.call(arguments, sliceStep),
            callback = args.pop(),
           sb = {
                require :   require,
                sandbox :   {
                    contextFunction :   func,
                    arguments       :   args,
                    callback        :   function() {
                        if (arguments[0]) {
                            var e = arguments[0],
                                err = e.stack.toString().split(/\n/)[1].replace(/.*:(\d+:\d+).*/g, '$1').split(':'),
                                errStr = parseInt(err[0])-1, errChr = parseInt(err[1]),
                                string = func.toString().split('\n')[errStr],
                                stringP= (function(string) {
                                    if (!string) return e.message;
                                    var length = string.length,
                                        errorPath = (errStr+1) + ':'+string + '\n';
                                    for (var i = 0; i < length; i++) {
                                        if (i < errChr+1) errorPath+=' ';
                                        else {
                                            i+=4;
                                            errorPath+='^^^^';
                                        }
                                    }
                                    return errorPath;
                                })(string),
                                error = new Error(e.message + '\n' + stringP);
                            error.stack = e.stack;
                            arguments[0] = error;
                        }
                        callback.apply(this, arguments);
                    }
                }
            },
            cc = contextCreator(func);
        project.utils.merge(sb, sandbox);
//        sb = deepExtend({},sb, sandbox);
//        for (var i in sandbox) {
//            sb[i] = sandbox[i];
//        }
        sb.sb = sb;
        cc.runInNewContext(sb);
    }
};