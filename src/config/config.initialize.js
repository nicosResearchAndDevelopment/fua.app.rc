const
    http     = require('http'),
    express  = require('express'),
    initPath = '/initialize',
    initPort = Number(process.env.SERVER_PORT || 8099);

async function initializeConfig() {
    const app    = express();
    const server = http.createServer(app);
    const config = await new Promise((resolve, reject) => {
        app.post(initPath, express.urlencoded({extended: false}));
        app.post(initPath, (request, response, next) => {
            if (!request.body) return next();
            const payload = Buffer.from(request.body.config, 'base64url').toString('utf-8');
            request.body  = JSON.parse(payload);
            next();
        });
        app.post(initPath, express.json());
        app.post(initPath, (request, response, next) => {
            if (!request.body) return next();
            response.sendStatus(202);
            resolve(request.body);
        });
        app.post(initPath, (request, response) => response.sendStatus(400));
        app.use((request, response) => response.sendStatus(418));
        server.listen(initPort).on('error', (err) => {
            server.close();
            reject(err);
        });
    });
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    return config;
}

module.exports = initializeConfig;
