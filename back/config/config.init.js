const
    util        = require('@fua/core.util'),
    http        = require('http'),
    express     = require('express'),
    ABOUT_PATHS = ['/', '/about', '/meta'],
    INIT_PATHS  = ['/init', '/initialize', '/config', '/configure'],
    PORT        = Number(process.env.SERVER_PORT || 8099);

module.exports = async function RCConnectorConfig() {
    const server = http.createServer();
    try {
        return await waitForConfig(server);
    } finally {
        await closeServer(server);
    }
};

function waitForConfig(server) {
    return new Promise((resolve, reject) => {
        const app = express();
        server.on('request', app);
        app.get(ABOUT_PATHS, aboutRoute);
        app.post(INIT_PATHS, express.json());
        app.post(INIT_PATHS, express.urlencoded({extended: false}));
        app.post(INIT_PATHS, initRoute);
        server.listen(PORT).on('error', reject);

        function aboutRoute(request, response) {
            const about = getAbout(request);
            response.type('json').send(JSON.stringify(about));
        }

        function initRoute(request, response) {
            try {
                const config = getConfig(request);
                util.assert(validateConfig(config), 'invalid config');
                response.status(202).end();
                resolve(config);
            } catch (err) {
                console.error(err);
                response.status(400).end();
            }
        }
    });
}

function closeServer(server) {
    return new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
}

function getAbout(request) {
    return {
        initialized:   false,
        init_endpoint: request.protocol + '://' + (request.headers.host || request.hostname) + INIT_PATHS[0]
    };
}

function getConfig(request) {
    return request.body && request.body.config ? parseBase64JSON(request.body.config) : request.body;
}

function validateConfig(config) {
    return util.isObject(config)
        && util.isObject(config.server)
        && util.isObject(config.connector)
        && util.isObject(config.daps);
}

function parseBase64JSON(base64Str) {
    const jsonStr = Buffer.from(base64Str, 'base64url').toString('utf-8');
    return JSON.parse(jsonStr);
}
