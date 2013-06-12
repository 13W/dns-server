var project = require('project'),
    mmdb = require('mmdb'),
    db = mmdb.connect(project.config.mongodb.connect, project.config.mongodb.options);

project.db = db;

function init(callback) {
    for(var name in project.collections) {
        var model = project.collections[name];
        db.bind(name);
        db.appendModel(name, model);
    }
    callback();
}



exports.setup = init;