const
    assert = require('@nrd/fua.core.assert'),
    is     = require('@nrd/fua.core.is'),
    tty    = require('@nrd/fua.core.tty'),
    ts     = require('@nrd/fua.core.ts'),
    util   = require('@nrd/fua.core.util');

module.exports = async function ({server: {app, io}, rc, ...config}) {

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
        rc.emit('GET.SelfDescription', request);
        const
            param           = request.body,
            selfDescription = rc.createSelfDescription(param),
            payload         = JSON.stringify(selfDescription);
        response.type('json').send(payload);
    });

    io.on('connection', (socket) => {

        socket.on('refreshDAT', async (param, callback) => {
            try {
                const result = await rc.getDAT({...param, refresh: true});
                callback(null, result)
            } catch (err) {
                callback(util.errorToJSON(err));
            }
        });

        socket.on('getSelfDescriptionFromRC', async (param, callback) => {
            try {
                const result = rc.createSelfDescription(param);
                callback(null, result);
            } catch (err) {
                callback(util.errorToJSON(err));
            }
        });

        socket.on('waitForApplicantsSelfDescriptionRequest', async (param, callback) => {
            try {
                const result = null;
                await new Promise((resolve, reject) => {
                    let onSelfDescription, cancelTimeout;
                    rc.on('GET.SelfDescription', onSelfDescription = (request) => {
                        if (request.ip === param.requester) {
                            rc.off('GET.SelfDescription', onSelfDescription);
                            clearTimeout(cancelTimeout);
                            resolve();
                        }
                    });
                    cancelTimeout = setTimeout(() => {
                        rc.off('GET.SelfDescription', onSelfDescription);
                        reject('timeout reached');
                    }, 1000 * (param.timeout || 1));
                });
                callback(null, result);
            } catch (err) {
                callback(util.errorToJSON(err));
            }
        });

        socket.on('fetchApplicantResource', async (param, callback) => {
            try {
                const response    = await rc.fetch(param.url, param);
                const contentType = response.headers.get('content-type') || '';
                const result      = /application\/(?:\w+\+)?json/.test(contentType)
                    ? await response.json() : await response.text();
                callback(null, result);
            } catch (err) {
                callback(util.errorToJSON(err));
            }
        });

    });

};
