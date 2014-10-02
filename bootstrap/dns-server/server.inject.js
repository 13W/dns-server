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
            if (!error && answer) {
                callback(null, {answer: answer, additional: [], authority: []});
                return;
            }
            async.detect(self.forwarders, function (server, callback) {
                var parsed = server.split(':'),
                    host = parsed[0],
                    port = parseInt(parsed[1], 10) || 53,
                    options = {
                        question: question,
                        server: { address: host, port: port},
                        timeout: 1000
                    },
                    request = dns.Request(options);

                request.on('timeout', function() {
                    callback(false);
                });
                request.on('message', function(error, res) {
                    if (!error && res) {
                        response = res;
                    }
                    callback(response);
                });
                request.on('error', function(error) {
                    logger.error({error: error, server: server}, 'DNS Lookup error');
                    callback(false);
                });
                request.send();
            }, function (ok) {
                var error = !ok && dns.consts.NAME_TO_RCODE.NOTFOUND;
                callback(error || 0, ok && response);
            });
        });
    };

    DNSServer.prototype.request = function (request, response) {
        logger.debug({question: request.question}, 'new request');
        this.lookup(request.question[0], function (error, lookupResponse) {
            logger.debug({error: dns.consts.RCODE_TO_NAME[error], response: lookupResponse}, 'lookup.response');
            if (error) {
                response.header.rcode = error;
            }
            
            if (lookupResponse && lookupResponse.answer.length) {
                response.answer = lookupResponse.answer;
                response.authority = lookupResponse.authority || [];
                response.additional = lookupResponse.additional || [];

            }

            logger.debug({response: response}, 'Response');
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