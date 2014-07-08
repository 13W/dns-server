/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: dns-server
 * Date: 20.06.14 13:49
 */
var bunyan = require('bunyan'),
    config = require('easy-config'),
    logger = bunyan.createLogger({
        name: 'dns-server',
        level: config.log.level
    }),
    Loader = require('sl').Loader('dns-server', {
        log: logger
    });

Loader.registerWrapper(function config() {
    return require('easy-config');
});

Loader.load('./bootstrap');
