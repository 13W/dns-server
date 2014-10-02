/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: dns-server
 * Date: 29.06.14 0:34
 */
var defaultTTL = 300;
var data = [
    {
        "_id": "1",
        "name": "ccxx.cc",
        "type": "SOA",
        "class": "IN",
        "ttl": 7200,
        "primary": "ns1.ccxx.cc",
        "admin": "ccxx.cc",
        "serial": 2014062601,
        "refresh": 900,
        "retry": 600,
        "expiration": 2592000,
        "minimum": 900
    },
    {
        "_id": "2",
        "name": "13w.me",
        "type": "SOA",
        "class": "IN",
        "ttl": 7200,
        "primary": "ns1.13w.me",
        "admin": "13w.me",
        "serial": 2014062601,
        "refresh": 900,
        "retry": 600,
        "expiration": 2592000,
        "minimum": 900
    },
    {
        "name": "*.13w.me",
        "ttl": defaultTTL,
        "type": "A",
        "class": "IN",
        "address": "127.0.0.1"
    },
    {
        "name": "test.13w.me",
        "ttl": defaultTTL,
        "type": "A",
        "class": "IN",
        "address": "127.0.0.1"
    },
    {
        "name": "ccxx.cc",
        "ttl": defaultTTL,
        "type": "A",
        "class": "IN",
        "address": "127.0.0.1"
    },
    {
        "name": "test.ccxx.cc",
        "ttl": defaultTTL,
        "type": "A",
        "class": "IN",
        "address": "127.0.0.2"
    },
    {
        "name": "*.ccxx.cc",
        "ttl": defaultTTL,
        "type": "A",
        "class": "IN",
        "address": "127.0.0.3"
    }
];
var async = require('async');
var consts = require('native-dns/node_modules/native-dns-packet/consts.js');

exports.db = function async(config, logger, done) {

    function DB () {
        this.db = null;
        this.data = []; //data;
        this.assets = {};
        this.loadAssets();
        logger.info({assets: this.assets}, 'Assets loaded');
    }

    DB.prototype.find = function (query, callback) {
        var self = this,
            domain = query.name.split('.'),
            dn, ptr = self.assets,
            result = null;
        while(dn = domain.pop()) {
            if (!ptr) {
                break;
            }
            if (!ptr[dn] && ptr['*']) {
                ptr = ptr['*'];
                break;
            }
            ptr = ptr[dn];
        }
        if (ptr && ptr.__records) {
            result = (ptr.__records || [])
                .filter(function (record) {
                    return record.type === query.type && record.class === record.class;
                })
                .map(function (record) {
                    record.name = query.name;
                    return record;
                });
        }
        logger.debug({result: result, ptr: ptr}, 'Local result');
        callback(null, result);
    };

    DB.prototype.loadAssets = function () {
        var self = this;
        self.data.forEach(function (record) {
            var domain = record.name.split('.'),
                dn, ptr = self.assets;
            while(dn = domain.pop()) {
                ptr = ptr[dn] = ptr[dn] || {};
            }
            ptr.__records = ptr.__records || [];
            ptr.__records.push(record);
            record.type = consts.NAME_TO_QTYPE[record.type] || record.type;
            record.class = consts.NAME_TO_QCLASS[record.class] || record.class;
        });
    };
    done(null, new DB());
};