#!/usr/bin/env node

// TODO when used, also add '@nrd/fua.core.app' to the dependencies
require('@nrd/fua.core.app').launch({
    defaultConfig: require('./config/config.rc.js'),
    configMapper:  (config) => ({
        schema:    config.server.schema,
        hostname:  config.server.hostname,
        port:      config.server.port,
        server:    config.server.options,
        app:       true,
        io:        true,
        scheduler: true,
        connector: {
            keyId: config.connector.id,
            key:   config.connector.key,
            pub:   config.connector.pub
        },
        daps:      config.daps
    }),
    agentClass:    require('@nrd/fua.ids.agent.connector'),
    appLauncher:   require('./app.rc.js'),
    labLauncher:   require('./lab.rc.js')
});
