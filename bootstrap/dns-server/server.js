var project = require('project'),
    dns = require('native-dns'),
    dnsConsts = require('native-dns/lib/consts'),
    Cache = require('smart-cache'),
    cache = new Cache(500),
    dnsServer = dns.createServer();

project.dnsConsts = dnsConsts;
project.dns = {
    server: dnsServer
};

function nsLookup(server, question, callback) {
    var options = {
            question: question,
            server: { address: server, port: 53},
            timeout: 1000
        },
        request = dns.Request(options);

    request.on('timeout', function() {
        callback(new Error('Request timeout'))
    });
    request.on('message', function(error, response) {
        callback(error, response);
    });
    request.on('error', function(error) {
        console.error(error);
    });
    request.send();
}

dnsServer.on('request', function (request, response) {
    console.inspect(request.question[0]);
    var cacheKey = request.question[0].name + '_' + request.question[0].type + '_' + request.question[0].class,
        cacheResponse = cache.get(cacheKey);
    if (cacheResponse) {
        response.answer = cacheResponse;
        return response.send();
    }
    if (/cetku\.net$/.test(request.question[0].name)) {
        return project.db.dns.records.find(request.question[0]).toArray(function(error, records) {
            records.forEach(function(record) {
                for(var k in record.properties) {
                    record[k] = record.properties[k];
                }
                delete record.properties;
            });
            cache.set(cacheKey, records);
            console.inspect(error, records);
            response.answer = records;
            response.send();
        })
    }
    nsLookup('192.168.111.1', dns.Question(request.question[0]), function(error, a) {
        if (error) {
            return console.error(request.question[0], error);
        }
        response.answer = a.answer;
        console.inspect(response.answer);
        response.send();
    });
//    response.answer.push(dns.A({
//        name: request.question[0].name,
//        address: '127.0.0.1',
//        ttl: 600
//    }));
//    response.answer.push(dns.A({
//        name: request.question[0].name,
//        address: '127.0.0.2',
//        ttl: 600
//    }));
//    response.additional.push(dns.A({
//        name: 'hostA.example.org',
//        address: '127.0.0.3',
//        ttl: 600
//    }));
//    response.send();
});

dnsServer.on('error', function (err, buff, req, res) {
    console.log(err.stack);
});

dnsServer.on('socketError', function (err, buff, req, res) {
    console.log('Server socket error', arguments);
});

dnsServer.on('close', function (err, buff, req, res) {
    console.log('Server close');
});

dnsServer.serve(53);

setInterval(function() {
    console.log('Watch Dog, gav-gav!');
}, 60000);

