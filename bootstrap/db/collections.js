var project = require('project');

project.collections = {
    'dns.soa':{
        type:'object',
        properties:{
            _id:{type:'objectid'},
            primary:{type:'string'},
            admin:{type:'string'},
            serial:{type:'number', default:function () {
                var d = new Date(),
                    tdn = function(n) {return n < 10 ? '0'+n : n+''};
                return d.getFullYear() + tdn(d.getMonth()+1) + tdn(d.getDate()) + "00";
            }},
            refresh:{type:'number', default:300},
            retry:{type:'number', default:600},
            expiration:{type:'number', default:3600000},
            minimum:{type:'number', default:3600}
        }
    },
    'dns.records':{
        type:'object',
        properties:{
            _id:{type:'objectid'},
            key:{type:'string'},
            type:{type:'number'},
            class: {type: 'number', default: 1},
            properties:{
                type:'object'
            }
        }
    }
};