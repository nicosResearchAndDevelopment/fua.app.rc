const
    util                         = require('@fua/core.util'),
    {assert, isString, isObject} = util,
    isServerSchema               = util.StringValidator(/^https?$/),
    isServerHostname             = util.StringValidator(/^[\w\-]+(?:\.[\w\-]+)*$/),
    isServerPort                 = (value) => util.isInteger(value) && value >= 1024 && value <= 49151,
    isConnectorUri               = util.StringValidator(/^https?:\/\/[\w\-]+(?:\.[\w\-]+)*(?::\d+)?\/$/),
    isConnectorId                = util.StringValidator(/^(?:[0-9A-F]{2}:){20}keyid(?::[0-9A-F]{2}){20}$/),
    path                         = require('path'),
    fs                           = require('fs/promises'),
    __project                    = path.join(__dirname, '../..'),
    __var                        = '/var/opt/gbx',
    baseConfig                   = require('./config.rc.js');

module.exports = async function RCConnectorConfig() {
    const config = await readConfig('data/config.json');
    assertCorrectConfig(config);
    return config;
};

async function readConfig(configPath) {
    const projectConfig = await readJSON(path.join(__project, configPath));
    const varConfig     = await readJSON(path.join(__var, configPath));
    return util.extendObject({}, baseConfig, projectConfig || {}, varConfig || {});
}

async function readJSON(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }
}

function assertCorrectConfig(config) {
    assert(isObject(config), 'expected config to be an object');
    // assert(isString(config.id), 'expected config-id to be a string');

    assert(isObject(config.server), 'expected server-config to be an object');
    assert(isServerSchema(config.server.schema), 'invalid server schema');
    assert(isServerHostname(config.server.hostname), 'invalid server hostname');
    assert(isServerPort(config.server.port), 'invalid server port');
    assert(isObject(config.server.options), 'invalid server options');
    if (config.server.schema === 'https') assert(config.server.options.key && config.server.options.cert, 'missing https server key and cert');

    assert(isObject(config.connector), 'expected connector-config to be an object');
    assert(isConnectorUri(config.connector.uri), 'invalid connector uri');
    assert(isConnectorId(config.connector.id), 'invalid connector id');
    assert(isString(config.connector.key), 'invalid connector key');
    assert(isString(config.connector.pub), 'invalid connector pub');

    assert(isObject(config.daps), 'expected daps-config to be an object');
    let dapsCount = 0;
    for (let [dapsKey, dapsParam] of Object.entries(config.daps)) {
        dapsCount++;
        assert(isString(dapsKey), 'invalid daps key');
        assert(isString(dapsParam) || isObject(dapsParam), 'invalid daps param');
    }
    assert(dapsCount > 0, 'expected daps-config to contain at least one item');
}
