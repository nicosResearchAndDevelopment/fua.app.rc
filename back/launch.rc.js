#!/usr/bin/env node

require('@fua/core.app').launch({
    config: {
        default: require('./config/config.rc.js'),
        // load:    'C:\\Users\\spetrac\\Fua\\fua-js\\app\\rc-connector\\data\\config.json'
    },
    agent:  {
        class:  require('@fua/ids.agent.connector'),
        param:  {
            app:       true,
            io:        true,
            scheduler: true
        },
        mapper: (config) => ({
            schema:    config.server.schema,
            hostname:  config.server.hostname,
            port:      config.server.port,
            server:    config.server.options,
            connector: {
                keyId: config.connector.id,
                key:   config.connector.key,
                pub:   config.connector.pub
            },
            daps:      config.daps
        })
    },
    app:    {
        launch:  require('./app.rc.js'),
        develop: require('./lab.rc.js')
    }
});
