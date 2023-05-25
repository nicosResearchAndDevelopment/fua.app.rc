const
    util    = require('@nrd/fua.core.util'),
    fetch   = require('node-fetch'),
    express = require('express');

module.exports = async function RCConnectorApp(
    {
        'config': config,
        'agent':  agent
    }
) {

    util.assert(agent.app, 'expected agent to have app defined');
    util.assert(agent.io, 'expected agent to have io defined');

    agent.app.use(express.json());
    agent.app.use(express.urlencoded({extended: false}));

    agent.app.post('/inbox', (request, response, next) => {
        util.logObject(request.body);
        response.end();
    });

    agent.app.get('/', (request, response, next) => {
        const payload = `${config.name} : ${util.utcDateTime()}`;
        response.send(payload);
    });

    agent.app.get('/about', (request, response, next) => {
        agent.emit('GET.SelfDescription', request);
        const
            param           = request.body,
            selfDescription = agent.createSelfDescription(param),
            payload         = JSON.stringify(selfDescription);
        response.type('json').send(payload);
    });

    agent.io.on('connection', (socket) => {

        // IDEA use IPC channel alternatively

        socket.on('refreshDAT', async (param, callback) => {
            try {
                const result = await agent.getDAT({...param, refresh: true});
                callback(null, result)
            } catch (err) {
                callback(err);
            }
        });

        socket.on('getSelfDescriptionFromRC', async (param, callback) => {
            try {
                const result = agent.createSelfDescription(param);
                callback(null, result);
            } catch (err) {
                callback(err);
            }
        });

        socket.on('waitForApplicantsSelfDescriptionRequest', async (param, callback) => {
            try {
                const result = null;
                await new Promise((resolve, reject) => {
                    let onSelfDescription, cancelTimeout;
                    agent.on('GET.SelfDescription', onSelfDescription = (request) => {
                        if (request.ip === param.requester) {
                            agent.off('GET.SelfDescription', onSelfDescription);
                            clearTimeout(cancelTimeout);
                            resolve();
                        }
                    });
                    cancelTimeout = setTimeout(() => {
                        agent.off('GET.SelfDescription', onSelfDescription);
                        reject('timeout reached');
                    }, 1000 * (param.timeout || 1));
                });
                callback(null, result);
            } catch (err) {
                callback(err);
            }
        });

        socket.on('fetchApplicantResource', async (param, callback) => {
            try {
                const response    = await agent.fetch(param.url, param);
                const contentType = response.headers.get('content-type') || '';
                const result      = /application\/(?:\w+\+)?json/.test(contentType)
                    ? await response.json() : await response.text();
                callback(null, result);
            } catch (err) {
                callback(err);
            }
        });

    });

    await agent.listen();
    util.logText(`rc-connector app is listening at <${agent.url}>`);
    agent.once('closed', () => util.logText('rc-connector app has closed'));

}; // RCConnectorApp
