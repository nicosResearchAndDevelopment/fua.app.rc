const
  Connector = exports,
  identifier = '@fua/app.rc',
  assert = require('@fua/core.assert');

assert(!global[identifier], 'unable to load a second uncached version of the singleton ' + identifier);
Object.defineProperty(global, identifier, { value: Connector, configurable: false, writable: false, enumerable: false });

const
  _Connector = Object.create(null),
  is = require('@fua/core.is'),
  errors = require('@fua/core.errors'),
  DAPSClient = require('@fua/client.daps'),
  crypto = require('crypto'),
  EventEmitter = require('events'),
  http = require('http'),
  https = require('https'),
  fetch = require('node-fetch'),
  isKeyId = is.validator.string(/^(?:[0-9A-F]{2}:){20}keyid(?::[0-9A-F]{2}){20}$/),
  isKeyObject = (value) => value instanceof crypto.KeyObject,
  isPrivateKey = (value) => isKeyObject(value) && value.type === 'private',
  isPublicKey = (value) => isKeyObject(value) && value.type === 'public',
  InitializeOptions = {
    uri: is.validator(is.string),
    id: is.validator.optional(is.string),
    keyId: is.validator.optional(is.string),
    key: is.validator.optional(is.string),
    pub: is.validator.optional(is.string),
    privateKey: is.validator.optional(isPrivateKey),
    publicKey: is.validator.optional(isPublicKey),
    client: is.validator.optional(is.object),
    daps: is.validator.optional(is.object)
  };

_Connector.emitter = new EventEmitter();
_Connector.dapsClients = new Map();

Object.defineProperties(Connector, {
  keyId: { get: () => _Connector.connector.keyId || null, enumerable: true },
  publicKey: { get: () => _Connector.connector.publicKey || null, enumerable: true },
  on: { value: (event, listener) => _Connector.emitter.on(event, listener) && Connector, enumerable: true },
  once: { value: (event, listener) => _Connector.emitter.once(event, listener) && Connector, enumerable: true },
  off: { value: (event, listener) => _Connector.emitter.off(event, listener) && Connector, enumerable: true },
  emit: { value: (event, ...args) => _Connector.emitter.emit(event, ...args) && Connector, enumerable: true }
});

Connector.initialize = async function (options = {}) {
  assert.object(options, InitializeOptions);
  assert(!_Connector.initialized, 'already initialized');
  _Connector.initialized = true;

  const
    uri = options.uri,
    keyId = options.keyId || options.id,
    privateKey = options.privateKey || crypto.createPrivateKey(options.key),
    publicKey = options.publicKey || crypto.createPublicKey(options.pub);

  assert(is.string(uri), 'expected uri to be be a string');
  assert(isKeyId(keyId), 'expected keyId to be be a SKI:AKI key identifier');
  assert(isPrivateKey(privateKey), 'expected privateKey to be a private KeyObject');
  assert(isPublicKey(publicKey), 'expected publicKey to be a public KeyObject');

  _Connector.uri = uri;
  _Connector.keyId = keyId;
  _Connector.privateKey = privateKey;
  _Connector.publicKey = publicKey;

  if (options.client) {
    _Connector.httpAgent = ('key' in options.client)
      ? new https.Agent(options.client)
      : new http.Agent(options.client);
  }

  if (options.daps) {
    const fixedOptions = { SKIAKI: _Connector.keyId, privateKey: _Connector.privateKey };
    if (_Connector.httpAgent) fixedOptions.requestAgent = _Connector.httpAgent;
    for (let [clientId, clientOptions] of Object.entries(options.daps)) {
      if (is.string(clientOptions)) clientOptions = { dapsUrl: clientOptions };
      assert(is.string(clientOptions.dapsUrl), 'expected dapsUrl to be a string');
      const dapsClient = _Connector.dapsClients.get(clientId)
        || _Connector.dapsClients.get(clientOptions.dapsUrl)
        || new DAPSClient({ ...clientOptions, ...fixedOptions });
      _Connector.dapsClients.set(clientId, dapsClient);
      _Connector.dapsClients.set(clientOptions.dapsUrl, dapsClient);
    }
    assert(_Connector.dapsClients.has('default'), 'expected DAPS default to be configured');
  }

  return Connector;
};

Connector.createJWK = function () {
  assert(_Connector.initialized, 'not initialized');
  return Object.assign(
    _Connector.publicKey.export({ format: 'jwk' }),
    { kid: _Connector.keyId }
  );
};

Connector.createSelfDescription = function () {
  assert(_Connector.initialized, 'not initialized');
  return {
    issuer: _Connector.uri
    // TODO
  };
};

Connector.getDAPSClient = function (clientId = 'default') {
  assert(_Connector.initialized, 'not initialized');
  assert(_Connector.dapsClients.has(clientId), 'expected DAPS ' + clientId + ' to be preconfigured');
  return _Connector.dapsClients.get(clientId);
};

Connector.getDAT = async function ({ daps = 'default', tweak_dat = false, refresh = false }) {
  assert(_Connector.initialized, 'not initialized');
  const
    client = this.getDAPSClient(daps),
    options = { tweak_dat },
    dat = refresh
      ? await client.fetchDat(options)
      : await client.getDat(options)
  return dat;
};

Connector.fetch = async function (url, { ...options } = {}) {
  assert(_Connector.initialized, 'not initialized');
  const access_token = await this.getDAT(options);
  // SEE https://github.com/International-Data-Spaces-Association/IDS-G-pre/tree/main/Communication/protocols/ids-rest/header
  options.headers = {
    ...options.headers,
    // 'Authorization':     'Bearer ' + access_token,
    'ids-securityToken': access_token
  };
  if (_Connector.httpAgent) options.agent = _Connector.httpAgent;
  const response = await fetch(url, options);
  if (!response.ok) throw new errors.http.ResponseError(response);
  return response;
};

Object.freeze(Connector);
module.exports = Connector;
