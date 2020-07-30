'use strict';

const mock = require('egg-mock');

describe('test/hik-tracer.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/hik-tracer-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, hikTracer')
      .expect(200);
  });
});
