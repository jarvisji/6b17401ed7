/**
 * * This should the first running describe of doctor cases. Since other cases depends on registered data.
 * Created by Ting on 2015/7/17.
 */
var should = require('should');
var test = require('../testUtils');

describe('Test wechat messages for doctor.', function () {
  var Doctor;
  before(function () {
    Doctor = test.app.models.Doctor;
  });

  it('Test doctor subscribe', function (done) {
    var message = '<xml>';
    message += '  <ToUserName><![CDATA[gh_6a821daa4090]]></ToUserName>';
    message += '  <FromUserName><![CDATA[' + test.conf.doctorOpenId + ']]></FromUserName>';
    message += '  <CreateTime>1436444304</CreateTime>';
    message += '  <MsgType><![CDATA[event]]></MsgType>';
    message += '  <Event><![CDATA[subscribe]]></Event>';
    message += '</xml>';

    test.req.xml('post', test.conf.doctorWxProxyUrl)
      .send(message)
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        Doctor.findOne({'wechat.openid': test.conf.doctorOpenId}, function (err, doctor) {
          if (err) return done(err);
          should(doctor.wechat.subscribe).equal(1);
          should(doctor.number).be.a.Number();
          should(doctor.number).greaterThan(10000);
          should(doctor).have.property('level');
          done();
        });
      });
  });
});
