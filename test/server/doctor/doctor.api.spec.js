/**
 * Created by Ting on 2015/7/17.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');

describe('Test doctor APIs.', function () {
  var ts = new Date().getTime();
  var mockMobile = mockOpenid = 'test-' + ts;
  var doctorId;
  var mockDoctor = {
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

  it('Test create doctor.', function (done) {
    util.req.json('post', '/api/doctors')
      .send(mockDoctor)
      .expect(201)
      .end(function (err, res) {
        if (err) done(err);
        var data = res.body.data;
        should(data).have.property('_id');
        should(data).have.property('created');
        should(data).have.property('lastModified');
        should(data).have.property('number').which.is.a.Number();
        should(data).not.have.property('password');
        doctorId = data._id;
        done();
      });
  });

  it('Test create doctor with exists mobile phone number should fail', function (done) {
    util.req.json('post', '/api/doctors')
      .send(mockDoctor)
      .expect(409, done);
  });

  it('Test find doctors with filter: openid', function (done) {
    util.req.json('get', '/api/doctors')
      .query({filter: JSON.stringify({'wechat.openid': mockOpenid})})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).equal(1);
        done();
      });
  });

  it('Test find doctors without filter', function (done) {
    util.req.json('get', '/api/doctors')
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).greaterThan(1);
        done();
      });
  });

  it('Test find doctors with filter: wildcard', function (done) {
    util.req.json('get', '/api/doctors')
      .query({filter: JSON.stringify({'mobile': '*-' + ts})})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).equal(1);
        should(res.body.data[0]._id).equal(doctorId);
        done();
      });
  });

  it('Test update doctor', function (done) {
    var newIntro = 'test introduction ' + Date.now();
    util.req.json('put', '/api/doctors/' + doctorId)
      .send({'introduction': newIntro})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        var data = res.body.data;
        should(data.introduction).equal(newIntro);
        should(data).not.have.property('password');
        done();
      });
  });

  it('Test create doctor service', function (done) {
    // step 1, create a new service.
    var service = {type: 'jiahao', price: 10};
    util.req.json('put', '/api/doctors/' + doctorId)
      .send({services: service})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        var data = res.body.data;
        should(data.services.length).equal(1);
        should(data.services[0].type).equal(service.type);
        should(data.services[0].price).equal(service.price);
        should(data.services[0]).have.property('_id');
        var serviceId = data.services[0]._id;

        // step 2, update existing service, and create another new one.
        var serviceArr = [
          {type: 'jiahao', price: 20, _id: serviceId},
          {type: 'suizhen', price: 100}
        ];
        util.req.json('put', '/api/doctors/' + doctorId)
          .send({services: serviceArr})
          .expect(200)
          .end(function (err, res) {
            if (err) done(err);
            var data = res.body.data;
            should(data.services.length).equal(2);
            should(data.services[0].type).equal(serviceArr[0].type);
            should(data.services[0].price).equal(serviceArr[0].price);
            should(data.services[0]._id).equal(serviceArr[0]._id);
            should(data.services[1].type).equal(serviceArr[1].type);
            should(data.services[1].price).equal(serviceArr[1].price);
            should(data.services[1]).have.property('_id');
            done();
          });
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
