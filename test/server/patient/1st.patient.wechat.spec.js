/**
 * This should the first running describe of patient cases. Since other cases depends on registered data.
 *
 * This test depends on real openid exists on wechat server.
 * TODO: mock wechat server to remove the dependence.
 * Created by Ting on 2015/7/22.
 */
var should = require('should');
var test = require('../testUtils');

describe('Test wechat messages for patient.', function () {

  var Patient = test.app.models.Patient;

  it('Test patient subscribe', function (done) {
    var message = '<xml>';
    message += '  <ToUserName><![CDATA[gh_6a821daa4090]]></ToUserName>';
    message += '  <FromUserName><![CDATA[' + test.conf.patientOpenId + ']]></FromUserName>';
    message += '  <CreateTime>1437558227</CreateTime>';
    message += '  <MsgType><![CDATA[event]]></MsgType>';
    message += '  <Event><![CDATA[subscribe]]></Event>';
    message += '</xml>';

    test.req.xml('post', test.conf.patientWxProxyUrl)
      .send(message)
      .expect(200)
      .end(function (err, res) {
        Patient.findOne({'wechat.openid': test.conf.patientOpenId}, function (err, patient) {
          if (err) return done(err);
          should(patient.wechat.subscribe).equal(1);
          should(patient.number).be.a.Number();
          should(patient).have.property('level');
          done();
        });
      });
  });

  it('Test patient unsubscribe', function (done) {
    var message = '<xml>';
    message += '  <ToUserName><![CDATA[gh_6a821daa4090]]></ToUserName>';
    message += '  <FromUserName><![CDATA[' + test.conf.patientOpenId + ']]></FromUserName>';
    message += '  <CreateTime>1437558227</CreateTime>';
    message += '  <MsgType><![CDATA[event]]></MsgType>';
    message += '  <Event><![CDATA[unsubscribe]]></Event>';
    message += '</xml>';

    test.req.xml('post', test.conf.patientWxProxyUrl)
      .send(message)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        Patient.findOne({'wechat.openid': test.conf.patientOpenId}, function (err, patient) {
          if (err) return done(err);
          should(patient.wechat.subscribe).equal(0);
          done();
        });
      });
  });
});
