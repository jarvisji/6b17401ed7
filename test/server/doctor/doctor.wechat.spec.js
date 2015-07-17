/**
 * Created by Ting on 2015/7/17.
 */
var should = require('should');
var util = require('../testUtils');
var conf = require('../testConfig');

describe('Test wechat messages for doctor.', function () {

  it('Test doctor subscribe', function (done) {
    var message = '<xml>';
    message += '  <ToUserName><![CDATA[gh_6a821daa4090]]></ToUserName>';
    message += '  <FromUserName><![CDATA[oWTqJs8SEbDON98vMor20rnXh9UQ]]></FromUserName>';
    message += '  <CreateTime>1436444304</CreateTime>';
    message += '  <MsgType><![CDATA[event]]></MsgType>';
    message += '  <Event><![CDATA[subscribe]]></Event>';
    message += '</xml>';

    util.req.xml('post', conf.wxProxyUrl)
      .send(message)
      .expect(200)
      .end(function (err, res) {
        done();
      });
  });
});
