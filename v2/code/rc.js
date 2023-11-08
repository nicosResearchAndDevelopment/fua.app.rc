const
    RC         = exports,
    identifier = '@nrd/fua.app.rc',
    assert     = require('@nrd/fua.core.assert');

assert(!global[identifier], 'unable to load a second uncached version of the singleton ' + identifier);
Object.defineProperty(global, identifier, {value: RC, configurable: false, writable: false, enumerable: false});

const
    _RC       = Object.create(null),
    Connector = require('@nrd/fua.ids.agent.connector'),
    is        = require('@nrd/fua.core.is');

Object.defineProperties(RC, {
    keyId:                 {get: () => _RC.connector.keyId || null, enumerable: true},
    publicKey:             {get: () => _RC.connector.publicKey || null, enumerable: true},
    createJWK:             {value: () => _RC.connector?.createJWK(), enumerable: true},
    createSelfDescription: {value: () => _RC.connector?.createSelfDescription(), enumerable: true},
    getDAPSClient:         {value: (clientId) => _RC.connector?.getDAPSClient(clientId), enumerable: true},
    getDAT:                {value: (options) => _RC.connector?.getDAT(options), enumerable: true},
    fetch:                 {value: (url, options) => _RC.connector?.fetch(url, options), enumerable: true},
    on:                    {value: (event, listener) => _RC.connector?.on(event, listener), enumerable: true},
    once:                  {value: (event, listener) => _RC.connector?.once(event, listener), enumerable: true},
    off:                   {value: (event, listener) => _RC.connector?.off(event, listener), enumerable: true},
    emit:                  {value: (event, ...args) => _RC.connector?.emit(event, ...args), enumerable: true}
});

RC.initialize = async function (options = {}) {
    assert.object(options);
    assert(!_RC.initialized, 'already initialized');
    _RC.initialized = true;

    _RC.connector = await Connector.create(options);

    return RC;
};

Object.freeze(RC);
module.exports = RC;
