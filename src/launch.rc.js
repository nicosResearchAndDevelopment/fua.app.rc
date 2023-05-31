const
    util              = require('@nrd/fua.core.util'),
    ConnectorAgent    = require('@nrd/fua.ids.agent.connector'),
    // RCConnectorConfig = require('./config/config.init.js'),
    RCConnectorConfig = require('./config/config.read.js'),
    RCConnectorApp    = require('./app.rc.js'),
    RCConnectorLab    = require('./lab.rc.js');

(async function LaunchRCConnector() {

    /* 1. Initialize the config for the agent: */

    util.logText('initialize config');
    const config = await RCConnectorConfig();

    /* 2. Construct a server agent for your setup: */

    util.logText('creating rc-connector agent');

    const connectorAgent = await ConnectorAgent.create({
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
    });

    /* 3. Use additional methods to configure the setup: */

    /* 4. Launch the main app: */

    util.logText('starting application');

    await RCConnectorApp({
        'config': config,
        'agent':  connectorAgent
    });

    /* 5. Launch the testing lab: */

    await RCConnectorLab({
        'config': config,
        'agent':  connectorAgent
    });

})().catch((err) => {

    util.logError(err);
    debugger;
    process.exit(1);

}); // LaunchRCConnector
