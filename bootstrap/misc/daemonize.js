"use strict";

var project = require('project'),
    fs      = require('fs'),
    sys     = require('sys'),
    async   = require('async'),
    daemon  = require('daemon'),
    dCfg    = project.config.daemon;

if (!dCfg || !dCfg.enable) return;
project.daemon = daemon;

function startDaemon(pipes) {
    daemon.daemonize(pipes, dCfg.pid, function(error, pid) {
        sys.puts('Started with pid '+pid);
        daemon.lock(process.cwd()+'/.pid');
    });

    if (dCfg.uid) daemon.setreuid(dCfg.uid);
}

process.on('bootstrap::complete', function(error) {
    console.warn('Daemonize process');
    startDaemon({
        stdout: dCfg.main_log,
        stderr: dCfg.error_log || dCfg.main_log
    });
});