var cache = require('lru-cache');
var dns = require('native-dns');
var consts = require('native-dns/node_modules/native-dns-packet/consts.js');
var async = require('async');

exports.dns = function inject(logger, config, db) {
    function DNSServer() {
        this.server = dns.createServer();
        this.forwarders = config.forwarders;
    }

    DNSServer.prototype.listen = function (port, host) {
        this.server.serve(port, host);
    };

    DNSServer.prototype.lookupInternal = function (question, callback) {
        db.find(question, callback);
    };

    DNSServer.prototype.lookup = function (question, callback) {
        var self = this,
            response = null;
        self.lookupInternal(question, function (error, answer) {
            console.log(error, answer);
            if (!error && answer) {
                callback(null, answer);
                return;
            }
            async.some(self.forwarders, function (server, callback) {
                logger.info({server: server}, 'Lookup');
                var options = {
                        question: question,
                        server: { address: server, port: 53},
                        timeout: 1000
                    },
                    request = dns.Request(options);

                request.on('timeout', function() {
                    callback(false);
                });
                request.on('message', function(error, res) {
                    response = !error && res;
                    callback(response);
                });
                request.on('error', function(error) {
                    logger.error({error: error, server: server}, 'DNS Lookup error');
                    callback(error);
                });
                request.send();
            }, function (ok) {
                var error = !ok && dns.NOTFOUND;
                callback(error, ok && response && response.answer);
            });
        });
    };
/*
 /spool/Projects/Infinity/dns-server/node_modules/native-dns/node_modules/native-dns-packet/packet.js:470
 throw e;
 ^
 AssertionError: Resource must be defined
 at writeResource (/spool/Projects/Infinity/dns-server/node_modules/native-dns/node_modules/native-dns-packet/packet.js:233:3)
 at Function.Packet.write (/spool/Projects/Infinity/dns-server/node_modules/native-dns/node_modules/native-dns-packet/packet.js:425:19)
 at Packet.send (/spool/Projects/Infinity/dns-server/node_modules/native-dns/lib/packet.js:43:16)
 at /spool/Projects/Infinity/dns-server/bootstrap/dns-server/server.inject.js:62:22
 at /spool/Projects/Infinity/dns-server/bootstrap/dns-server/server.inject.js:52:17
 at /spool/Projects/Infinity/dns-server/node_modules/async/lib/async.js:371:13
 at done (/spool/Projects/Infinity/dns-server/node_modules/async/lib/async.js:135:19)
 at /spool/Projects/Infinity/dns-server/node_modules/async/lib/async.js:32:16
 at /spool/Projects/Infinity/dns-server/node_modules/async/lib/async.js:368:17
 at null.<anonymous> (/spool/Projects/Infinity/dns-server/bootstrap/dns-server/server.inject.js:39:21)

 */
    DNSServer.prototype.request = function (request, response) {
        logger.info({question: request.question}, 'new request');
        this.lookup(request.question[0], function (error, answer) {
            logger.info({error: error, response: answer}, 'lookup.response');
            response.answer = answer;
            response.send();
        });
    };

    DNSServer.prototype.error = function (error) {
        logger.error({error: error}, 'DNS Server error');
    };

    DNSServer.prototype.close = function () {
        logger.info('DNS Server close connections');
    };

    DNSServer.prototype.on = function () {
        this.server.on.apply(this.server, arguments);
    };

    var dnsServer = new DNSServer();
    dnsServer.on('request', dnsServer.request.bind(dnsServer));
    dnsServer.on('error', dnsServer.error.bind(dnsServer));
    dnsServer.on('socketError', dnsServer.error.bind(dnsServer));
    dnsServer.on('close', dnsServer.close.bind(dnsServer));
    
    return dnsServer;
};