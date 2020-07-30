'use strict';

const mock = require('egg-mock');

describe('test/hik-operatelog.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/hik-operatelog-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, hikOperatelog')
      .expect(200);
  });
});
