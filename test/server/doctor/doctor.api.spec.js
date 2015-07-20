/**
 * Created by Ting on 2015/7/17.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');

describe('Test doctor APIs.', function () {
  var mockMobile = mockOpenid = 'test-' + new Date().getTime();

  //beforeAll(function(){
  //  // TODO: delete test data for user. Get mongoose from util.
  //});
  beforeEach(function () {
  });

  it('Test create doctor.', function (done) {
    util.req.json('post', '/api/doctors')
      .send({'mobile': mockMobile, 'wechat.openid': mockMobile})
      .expect(201)
      .end(function (err, res) {
        var data = res.body.data;
        should(data).have.property('_id');
        should(data).have.property('created');
        should(data).have.property('lastModified');
        should(data).have.property('number').which.is.a.Number();
        should(data).not.have.property('password');
        done();
      });
  });

  it('Test create doctor with exists mobile phone number should fail', function (done) {
    util.req.json('post', '/api/doctors')
      .send({'mobile': mockMobile, 'wechat.openid': mockOpenid})
      .expect(409, done);
  });

  it('Test find doctor by openid', function (done) {
    util.req.json('get', '/api/doctors')
      .query({filter: JSON.stringify({'wechat.openid': mockOpenid})})
      .expect(200)
      .end(function (err, res) {
        should(res.body.count).equal(1);
        done();
      });
  });

  it('Test find doctors', function (done) {
    util.req.json('get', '/api/doctors')
      .expect(200)
      .end(function (err, res) {
        should(res.body.count).greaterThan(1);
        done();
      });
  });

  it.skip('Test login success', function (done) {
    var user = {mobile: mockMobile, password: 'pass'};
    reqOption.url += '/login';
    reqOption.body = user;
    request.post(reqOption, function (error, response, body) {
      done();
      expect(response.statusCode).toEqual(200);
      expect(body.data._id).toBeDefined();
    });
  });

  it.skip('Test login failed', function (done) {
    var user = {mobile: mockMobile, password: 'wrong pass'};
    reqOption.url += '/login';
    reqOption.body = user;
    request.post(reqOption, function (error, response, body) {
      done();
      expect(response.statusCode).toEqual(401);
      expect(body.error).toBeDefined();
    });
  });


})
;
