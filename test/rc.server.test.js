const
  { describe, test, before } = require('mocha'),
  expect = require('expect');

describe.skip('fua.app.rc.server', function () {

  test('alice.tb.nicos-rd.com', async function () {
    const response = await fetch('https://alice.tb.nicos-rd.com/about');
    expect(response.ok).toBeTruthy();
    const result = await response.json();
    expect(result).toMatchObject({
      issuer: 'https://alice.tb.nicos-rd.com/'
    });
  });

  test('bob.tb.nicos-rd.com', async function () {
    const response = await fetch('https://bob.tb.nicos-rd.com/about');
    expect(response.ok).toBeTruthy();
    const result = await response.json();
    expect(result).toMatchObject({
      issuer: 'https://bob.tb.nicos-rd.com/'
    });
  });

});
