'use strict';

exports.init = function exec(config, logger, dns) {
    logger.info('Loaded!');
    dns.listen(config.port, config.host);
};

/*
require( 'lo' );
var fs = require( 'fs' ),
    cli = require( 'cli-color' ),
    path = require( 'path' ),
    util = require( 'util' ),
    async = require( 'async' ),
    Module = require( 'module' ),
    domain = require( 'domain' ),
    _require = Module.prototype.require,
    Log = process.env.NOISE && process.env.NOISE === 'false' ? false: true,
    errors = [],
    project = {
        isProduction: process.env.NODE_ENV === 'production',
        utils   :   {},
        usage   :   {
            h       :   {
                description     :   "Show This Help",
                alias           :   'help'
            },
            'd'    :   {
                description     :   "MongoDB Connection String",
                alias           :   'mongodb-connect'
            },
            'n'   :   {
                description     :   "MongoDB Native Parser",
                alias           :   'no-native-parser',
                default         :   false
            }
        },
        config  :   require('./initMode/default.json')
    },
    argv = require('optimist').usage('Usage : $0', project.usage).argv,
    initConfig = process.env.NODE_ENV && path.resolve(__dirname, 'initMode', process.env.NODE_ENV);

if (!Log) {
    util.print = function() {};
}

var merge = project.utils.merge = function merge(source) {
    var data = Array.prototype.slice.call(arguments,1);
    for (var i in data) {
        var z = data[i];
        for (var i in z) {
            var d = z[i];
            if ((Object.prototype.toString.call(d) === '[object Object]' || Array.isArray(d)) && source[i] && typeof source[i] === typeof d) {
                merge(source[i], d);
            } else {
                if (Array.isArray(source) && !~source.indexOf(d)) {
                    source.push(d);
                } else {
                    source[i] = d;
                }
            }
        }
    }
};

var bindAll = project.utils.bindAll = function bindAll(source) {
    var result = {};
    for (var name in source) {
        if (typeof source[name] === 'function') result[name] = source[name].bind(source);
    }
    return result;
};

if (process.env.NODE_ENV) {
    try {
        var config = require(initConfig);
        merge(project.config, config);
    } catch(error) {
//        console.error(error);
//        process.exit(1);
    }
}

project.argv = argv;
var interceptor = project.interceptor = domain.create();

interceptor.on('error', console.error);
interceptor.on('uncaughtException', console.fatal);

cli.clear = function() {
    util.print('\u001B[2J\u001B[0;0f');
};

Module.prototype.require = function( path ) {
    if ( path === 'project' && root === global ) return project;
    return _require.apply( this, arguments );
};

function pushError(error, str) {
    str = (str&&str+'\n' + '   ') || '';
    if (error instanceof Error)
        errors.push( ' ' +( errors.length + 1) + '. ' + str + cli.red(error.stack ) );
}

function beautifullRequire( _path ) {
    var str = cli.blue('loading... ' + cli.bold(_path.slice( process.cwd().length+1 ) ) ) + ': ';
    util.print( cli.yellow('  ◦ ') + str );

    try {
        var module = require( _path );
    } catch( error ) {
        pushError(error, str);
        util.print( cli.bold.red('×')+'\n' );
        return;
    }
    util.print( cli.bold.green('✓')+'\n' );

    return module;
}

function ignore( rules ) {
    if ( ! ( rules && Array.isArray( rules ) ) ) return true;
    var result = true;
    rules.forEach( function( rule ) {
        if ( !result ) return;

        var prefix = /[\+\-\!]/.test( rule.substr( 0,1 ) ) ? rule.substr( 0,1 ) : null,
            env = prefix ? rule.slice( 1 ) : rule,
            currentEnv = process.env['NODE_ENV'] || 'production';
        if ( prefix  === '!' && env === currentEnv ) result = false;
        if ( !prefix && env === currentEnv ) return true;
        if ( env ) result =  false;
    });

    return result;
}

function readDir( dir, collector ) {
    var files = fs.readdirSync( dir );

//    var index = files.indexOf( 'index.js' );
//    if( dir === __dirname && ~index ) {
//        delete files[ index ];
//    }

    index = files.indexOf( '.bssequence' );
    if ( ~index ) {
        delete files[ index ];

        var bsSequence = fs.readFileSync( path.resolve( dir, '.bssequence' ), 'utf-8' ),
            sequence = bsSequence.split(/\n/g);

        if( Array.isArray( sequence ) ) {
            var seq = 0;
            for( var i in sequence ) {
                var index = files.indexOf( sequence[ i ] );
                if ( ~index ) {
                    files[ index ] = seq+++'____'+files[ index ];
                } else {
                    files.push( seq+++'____'+sequence[ i ] );
                }
            }
            files = files.sort().map( function( file ) {
                var prefix = /^\d+____(.*)/.exec( file );
                if ( prefix ) return prefix[1];
                return file;
            });
        }
    }

    index = files.indexOf( '.bsignore' );
    if ( ~index ) {
        delete files[ index ];

        var bsIgnore = fs.readFileSync( path.resolve( dir, '.bsignore' ), 'utf-8' ),
            ignoreRules = bsIgnore.split(/\n/g);

        if( Array.isArray( ignoreRules ) ) {
            for( var i in ignoreRules ) {
                var params = ignoreRules[ i ].split(/\s/),
                    file = params.splice(0,1)[0],
                    index = files.indexOf( file );

                if ( file === '*' && ignore( params ) ) {
                    files = [];
                }

                if ( ~index && ignore( params ) ) {
                    delete files[ index ];
                }
            }
        }
    }

    for( var i in files ) {
        if ( !files[ i ] ) continue;

        var _path = path.resolve( dir, files[ i ] ),
            stat = fs.lstatSync( _path );

        if ( stat.isDirectory() ) {
            readDir( _path, collector );
            continue;
        }
        var _init = beautifullRequire( _path );
        _init && collector.push(_init);
    }
}

cli.clear();

util.print( cli.magenta( '  Starting bootstrap: ' ) + cli.blue('"' +(process.env.NODE_ENV||'default').toLowerCase() + '"') +cli.magenta(' configuration\n') );
util.print( ' ---------------------------------------\n' );

console.logLevel(console.level.LL_ALL);
//Error.stackTraceLimit = Infinity;
var requires = [],
    queue = async.queue(function(_init, callback) {
        try {
            if ( typeof _init === 'object' && _init.hasOwnProperty( 'setup' ) && typeof _init.setup === 'function' ) {
                _init.setup( callback );
            } else {
                callback(null);
            }
        } catch(error) {
            callback(error);
        }
    }, 1);
readDir( __dirname, requires );
//requires.forEach(function(filename) {queue.push(filename)});
queue.push(requires, pushError);
queue.drain = function() {
    process.nextTick(function() {
        //noinspection BadExpressionStatementJS
        console.__unset;
        if ( errors.length ) {
            util.print( ' ---------------------------------------\n' );
            util.print( cli.magenta('\n  Errors:\n') );
            util.print( ' ---------------------------------------\n' );
            util.print( errors.join( '\n\n' ) + '\n' );

        }
        util.print( ' ---------------------------------------\n' );
        if (errors.length) {
            util.print( cli.red.bold( '  Loading failed' ) + '\n\n' );
            process.exit(1);
        } else {
            util.print( cli.magenta.bold( '  Loading complete' ) + '\n\n' );
        }
        //noinspection BadExpressionStatementJS
        console.__set;
        console.logLevel(console.level.LL_ALL);
        process.emit('bootstrap::complete');
    })
};


module.exports = project;
if (argv.help && require.main.filename === __filename) {
    //noinspection BadExpressionStatementJS
    console.__unset;
    require('optimist').showHelp();
    process.exit();
}

var _exit = process.exit.bind(process);
process.exit = function() {
    console.error('Get EXIT');
    _exit.apply(this, arguments);
};

process.on('SIGKILL', function() {
    console.warn(arguments);
})
*/
