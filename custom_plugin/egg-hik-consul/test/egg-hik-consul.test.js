'use strict';

const mock = require('egg-mock');

describe('test/egg-hik-consul.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/egg-hik-consul-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, consul')
      .expect(200);
  });
});
