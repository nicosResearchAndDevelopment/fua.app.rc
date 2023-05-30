#!/usr/bin/env node

const
    https          = require('https'),
    fetch          = require('node-fetch'),
    SERVER_HOST    = String(process.env.SERVER_HOST || 'localhost'),
    SERVER_PORT    = Number(process.env.SERVER_PORT || 8099),
    aboutURL       = `https://${SERVER_HOST}:${SERVER_PORT}/about`,
    requestOptions = {
        method:  'GET',
        headers: {
            'Accept': 'application/ld+json'
        },
        agent:   new https.Agent({
            rejectUnauthorized: false
        })
    };

(async function healthcheck() {
    const response = await fetch(aboutURL, requestOptions);
    if (!response.ok) throw new Error(`[${response.status}] ${response.statusText}`);
    const about = await response.json();
    if (!about.issuer) throw new Error(`no issuer specified`);
})().then(function healthy() {
    console.log('healthcheck passed');
    process.exit(0);
}).catch(function unhealthy(err) {
    console.error(err?.stack ?? err);
    process.exit(1);
});
