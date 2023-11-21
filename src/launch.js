#!/usr/bin/env node

const
    App       = require('@nrd/fua.agent.app'),
    Connector = require('./app/connector.js');

App.launch({
    app:        require('./app/app.js'),
    initialize: async (config) => ({
        connector: await Connector.initialize(config.connector)
    }),
    // config:     '../lab/alice.json',
    // config:     '../lab/bob.json',
    server: {
        port: 3000,
        app:  {
            parse: {
                json:       true,
                urlencoded: true
            }
        },
        io:   true
    }
});
