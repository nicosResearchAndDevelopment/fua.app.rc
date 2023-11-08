#!/usr/bin/env node

const
    App  = require('@nrd/fua.agent.app'),
    RC   = require('./code/rc.js');

App.launch({
    app:    require('./app.js'),
    config: require('./config.json'),
    async initialize(config) {
        await RC.initialize(config.rc);
        return {rc: RC};
    },
    server: true
});
