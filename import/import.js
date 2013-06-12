#!/usr/local/bin/node
process.env.NODE_ENV="dataload";

var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    project = require( '../' ),
    consts = require('native-dns/lib/consts'),
    db = project.db,
    argv = require('optimist')
        .usage('Dataload Script', {
            s   :   {
                description :   'Source',
                default     :   path.resolve(__dirname, './data.json'),
                alias       :   'source'
            }
        }).argv,
    loadQueue = async.queue(function(loader, callback) {
        loader(callback);
    },0);

if (argv.h) {
    console.__unset;
    require('optimist').showHelp();
    process.exit();
}

function importData(callback) {
    try {
        var data = require(argv.s);
        for(var i in data) {
            var record = data[i];
            console.warn(record.type, consts.NAME_TO_QTYPE[record.type]);
            record.type = consts.NAME_TO_QTYPE[record.type];
        }
        project.db.dns.records.save(data, callback);
    } catch(error) {console.error(error);callback()}
    finally {}
}

if (argv.s) {
    loadQueue.push(importData);
}

process.on('bootstrap::complete', function() {
    db = project.db;
    loadQueue.concurrency = 1;
    loadQueue.push(function() {
        console.log('Dataload Complete!');
        process.exit(0);
    });
});
