/**
 * Test patient APIs.
 * Created by Ting on 2015/7/23.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');

describe('Test patient APIs.', function () {
  var ts = new Date().getTime();
  var mockMobile = 'test-' + ts;
  var mockOpenid = util.conf.patientOpenId;
  var patientId;
  var mockPatient = {
    'mobile': mockMobile,
    'name': mockMobile,
    'wechat.openid': mockOpenid,
    'wechat.headimgurl': '/assets/image/avatar-64.jpg'
  };

  //beforeAll(function(){
  //  // TODO: delete test data for user. Get mongoose from util.
  //});
  beforeEach(function () {
  });

  it('Test find patients with filter: openid', function (done) {
    util.req.json('get', '/api/patients')
      .query({filter: JSON.stringify({'wechat.openid': mockOpenid})})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).equal(1);
        patientId = res.body.data[0]._id;
        done();
      });
  });

  it('Test find patients without filter', function (done) {
    util.req.json('get', '/api/patients')
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).greaterThan(0);
        done();
      });
  });

  it('Test update patient', function (done) {
    util.req.json('put', '/api/patients/' + patientId)
      .send({mobile: mockMobile})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        var data = res.body.data;
        should(data.mobile).equal(mockMobile);
        done();
      });
  });

  it('Test find patients with filter: wildcard', function (done) {
    util.req.json('get', '/api/patients')
      .query({filter: JSON.stringify({'mobile': '*-' + ts})})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).equal(1);
        should(res.body.data[0]._id).equal(patientId);
        done();
      });
  });
});
