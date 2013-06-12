"use strict";
var project = require('project'),
    async = require('async'),
    Cache = require('smart-cache'),
    dns = project.dns,
    db = project.db;



var nsServers = ['192.168.111.1', '192.168.7.254', '192.168.1.1', '8.8.8.8'],
    nsCache = new Cache(nsServers.length),
    validNSServers = [];

function validateServers() {

    var servers = [];

    function validator(server) {
        return function(callback) {
            lookup('google.com', {server: {address: server, port: 53}}, function(error, response) {
                nsCache.set(server, true);
                servers.push(server);
                callback()
            });
        }
    }

    var validators = nsServers.map(validator);

    async.parallel(validators);
}

setTimeout(validateServers, 60000);

function getNSServer() {

}

function lookup(name, opts, callback) {
    if (typeof opts === 'function') {
        callback = opts;
        opts = {};
    }
    var question = dns.Question(typeof name === 'string' ? {name: name, type: 1} : name),
        options = {
            question: question,
            server: { address: validNSServers[i], port: 53},
            timeout: 1000
        };
    for (var key in opts) options[key] = opts[key];
    var request = dns.Request(options);

    request.on('message', callback);
    request.send();
}

function Response() {

}