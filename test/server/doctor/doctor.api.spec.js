/**
 * Created by Ting on 2015/7/17.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');

describe.skip('Test doctor APIs.', function () {
  var mockMobile = 'test-' + new Date().getTime();

  //beforeAll(function(){
  //  // TODO: delete test data for user. Get mongoose from util.
  //});
  beforeEach(function () {
  });

  it.skip('Test create doctor.', function (done) {
    util.req.json('post', '/doctors')
      .expect(201)
      .expect(function (res) {
        var data = res.body.data;
        should(data).have.property('_id');
        should(data).have.property('created');
        should(data).have.property('lastModified');
        should(data).have.property('number').which.is.a.Number();
        should(data).not.have.property('password');
      });
  });

  it('Test register user with exists mobile phone number should fail', function (done) {
    reqOption.url += '/users';
    reqOption.body = newDoctor;
    request.post(reqOption, function (error, response, body) {
      done();
      expect(response.statusCode).toEqual(409);
      expect(body.error).toBeDefined();
    })
  });

  it('Test login success', function (done) {
    var user = {mobile: mockMobile, password: 'pass'};
    reqOption.url += '/login';
    reqOption.body = user;
    request.post(reqOption, function (error, response, body) {
      done();
      expect(response.statusCode).toEqual(200);
      expect(body.data._id).toBeDefined();
    });
  });

  it('Test login failed', function (done) {
    var user = {mobile: mockMobile, password: 'wrong pass'};
    reqOption.url += '/login';
    reqOption.body = user;
    request.post(reqOption, function (error, response, body) {
      done();
      expect(response.statusCode).toEqual(401);
      expect(body.error).toBeDefined();
    });
  });
});
