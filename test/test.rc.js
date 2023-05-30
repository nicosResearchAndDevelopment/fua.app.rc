const
    {describe, test} = require('mocha'),
    expect           = require('expect'),
    https            = require('https'),
    fetch            = require('node-fetch'),
    aliceCerts       = require('./data/alice/cert/index.js'),
    bobCerts         = require('./data/alice/cert/index.js'),
    bobRequestAgent  = new https.Agent({
        ...bobCerts.server,
        rejectUnauthorized: false
    });

describe('rc', function () {

    this.timeout('10s');

    test('develop', async function () {
        require('../src/launch.rc.js');
        const about_endpoint = 'http://localhost:8099/';
        const aboutResponse  = await fetch(about_endpoint);
        expect(aboutResponse.ok).toBeTruthy();
        const about = await aboutResponse.json();
        console.log('about:', about);
        expect(about).toMatchObject({initialized: false});
        const init_endpoint = about.init_endpoint;
        expect(typeof init_endpoint).toBe('string');
        expect(init_endpoint).toMatch(about_endpoint);
        const config       = {
            id:        'urn:tb:ec:ids:rc:alice',
            server:    {
                schema:   'https',
                hostname: 'localhost',
                port:     8099,
                options:  {
                    key:  aliceCerts.server.key.toString(),
                    cert: aliceCerts.server.cert.toString(),
                    ca:   aliceCerts.server.ca.toString()
                }
            },
            connector: {
                uri: 'https://alice.nicos-rd.com/',
                id:  aliceCerts.connector.meta.SKIAKI,
                key: aliceCerts.connector.key.toString(),
                pub: aliceCerts.connector.pub.toString()
            },
            daps:      {
                default: {
                    dapsUrl:       'https://daps.tb.nicos-rd.com/',
                    dapsTokenPath: '/token',
                    dapsJwksPath:  '/jwks.json'
                }
            }
        };
        const initResponse = await fetch(init_endpoint, {
            method:  'POST',
            headers: {'Content-Type': 'application/json'},
            body:    JSON.stringify(config)
            // body: JSON.stringify({config: Buffer.from(JSON.stringify(config)).toString('base64url')})
        });
        expect(initResponse.ok).toBeTruthy();
        const new_about_endpoint = config.server.schema + '://' + config.server.hostname + ':' + config.server.port + '/about';
        const newAboutResponse   = await fetch(new_about_endpoint, {agent: bobRequestAgent});
        expect(newAboutResponse.ok).toBeTruthy();
        const newAbout = await newAboutResponse.json();
        console.log('new about:', newAbout);
        expect(typeof newAbout?.issuer).toBe('string');
    });

});
