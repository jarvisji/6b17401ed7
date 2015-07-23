/**
 * Created by Ting on 2015/7/17.
 */
var should = require('should');
var util = require('../testUtils');
var conf = require('../testConfig');

describe('Test wxproxy functions.', function () {

  it('Wechat server request verification.', function (done) {
    util.req.json('get', conf.doctorWxProxyUrl)
      .expect(200)
      .expect(conf.echostr, done);
  });
});
