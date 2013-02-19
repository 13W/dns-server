var project = require('project'),
    dns = require('native-dns'),
    cache = require('smart-cache'),
    dnsServer = dns.createServer();

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
    nsLookup('192.168.111.1', dns.Question(request.question[0]), function(error, a) {
        if (error) {
            return console.error(request.question[0], error);
        }
        response.answer = a.answer;
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


dnsServer.serve(53);