const
    assert = require('@fua/core.assert'),
    is     = require('@fua/core.is'),
    tty    = require('@fua/core.tty'),
    ts     = require('@fua/core.ts'),
    errors = require('@fua/core.errors');

module.exports = async function ({server: {app, io}, connector, ...config}) {

    app.use(function (request, response, next) {
        tty.log.request(request);
        next();
    });

    app.post('/inbox', (request, response, next) => {
        tty.log(request.body);
        response.end();
    });

    app.get('/', (request, response, next) => {
        const payload = `${config.name} : ${ts.dateTime.utc()}`;
        response.send(payload);
    });

    app.get('/about', (request, response, next) => {
        connector.emit('GET.SelfDescription', request);
        const
            param           = request.body,
            selfDescription = connector.createSelfDescription(param),
            payload         = JSON.stringify(selfDescription);
        response.type('json').send(payload);
    });

    io.on('connection', (socket) => {

        socket.on('refreshDAT', async (param, callback) => {
            try {
                const result = await connector.getDAT({...param, refresh: true});
                callback(null, result)
            } catch (err) {
                callback(errors.toJSON(err));
            }
        });

        socket.on('getSelfDescriptionFromRC', async (param, callback) => {
            try {
                const result = connector.createSelfDescription(param);
                callback(null, result);
            } catch (err) {
                callback(errors.toJSON(err));
            }
        });

        socket.on('waitForApplicantsSelfDescriptionRequest', async (param, callback) => {
            try {
                const result = null;
                await new Promise((resolve, reject) => {
                    let onSelfDescription, cancelTimeout;
                    connector.on('GET.SelfDescription', onSelfDescription = (request) => {
                        if (request.ip === param.requester) {
                            connector.off('GET.SelfDescription', onSelfDescription);
                            clearTimeout(cancelTimeout);
                            resolve();
                        }
                    });
                    cancelTimeout = setTimeout(() => {
                        connector.off('GET.SelfDescription', onSelfDescription);
                        reject('timeout reached');
                    }, 1000 * (param.timeout || 1));
                });
                callback(null, result);
            } catch (err) {
                callback(errors.toJSON(err));
            }
        });

        socket.on('fetchApplicantResource', async (param, callback) => {
            try {
                const response    = await connector.fetch(param.url, param);
                const contentType = response.headers.get('content-type') || '';
                const result      = /application\/(?:\w+\+)?json/.test(contentType)
                    ? await response.json() : await response.text();
                callback(null, result);
            } catch (err) {
                callback(errors.toJSON(err));
            }
        });

    });

};
