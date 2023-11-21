#!/usr/bin/env node

const
    App = require('@nrd/fua.agent.app'),
    RC  = require('./app/rc.js');

App.launch({
    app:    require('./app/app.js'),
    config: {
        rc: {
            connector: {/* must be filled in by the external config */},
            daps:      {
                'default': {
                    dapsUrl:       'https://daps.tb.nicos-rd.com/',
                    dapsTokenPath: '/token',
                    dapsJwksPath:  '/jwks.json'
                }
            }
        }
    },
    async initialize(config) {
        await RC.initialize(config.rc);
        return {rc: RC};
    },
    space:  {
        context: {
            'ids':  'https://w3id.org/idsa/core/',
            'idsc': 'https://w3id.org/idsa/code/',
            'fua':  'https://www.nicos-rd.com/fua#',
            'dom':  'https://www.nicos-rd.com/fua/domain#',
            'ecm':  'https://www.nicos-rd.com/fua/ecosystem#',
            'daps': 'https://www.nicos-rd.com/fua/daps#'
        }
    },
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
