/**
 * Test patient APIs.
 * Created by Ting on 2015/7/23.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');

describe('Test patient APIs.', function () {
  var ts, testData, mockMobile, mockOpenid, patientId, patientId2, friendRequestId, mockPatient, mockPatient2;
  before(function () {
    ts = new Date().getTime();
    testData = JSON.parse(process.env.testData);
    patientId = testData.patient1.id;
    patientId2 = testData.patient2.id;
    mockMobile = 'test-' + ts;
    mockOpenid = testData.patient1.openid;
    mockPatient = util.conf.testData.unitPatients[0];
    mockPatient2 = util.conf.testData.unitPatients[1];
  });

  it('Test find patients without filter', function (done) {
    util.req.json('get', '/api/patients', mockOpenid, 'patient')
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).greaterThan(1);
        done();
      });
  });

  it('Test find patients with filter: openid', function (done) {
    util.req.json('get', '/api/patients', mockOpenid, 'patient')
      .query({filter: JSON.stringify({'wechat.openid': mockPatient.wechat.openid})})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).equal(1);
        should(res.body.data[0]._id).equal(patientId);
        should(res.body.data[0]).not.have.property('password');
        done();
      });
  });

  it('Test update patient', function (done) {
    util.req.json('put', '/api/patients/' + patientId, mockOpenid, 'patient')
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
    util.req.json('get', '/api/patients', mockOpenid, 'patient')
      .query({filter: JSON.stringify({'mobile': '*-' + ts})})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).equal(1);
        should(res.body.data[0]._id).equal(patientId);
        done();
      });
  });

  // create a request from patient to patients.
  it('Test create patient friend request', function (done) {
    // two patient ids were retrieved by upon cases;
    var data = {toPatientId: patientId2, message: 'hi'};
    util.req.json('post', '/api/patients/' + patientId + '/friends/requests', mockOpenid, 'patient')
      .send(data)
      .expect(201)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.from).equal(patientId);
        should(data.fromName).equal(mockPatient.name);
        should(data.fromOpenid).equal(mockPatient.wechat.openid);
        should(data.to).equal(patientId2);
        should(data.status).equal('requested');
        done();
      });
  });

  it('Test create patient friend fail without data', function (done) {
    // two patient ids were retrieved by upon cases;
    util.req.json('post', '/api/patients/' + patientId + '/friends/requests', mockOpenid, 'patient')
      .send({})
      .expect(400, done);
  });

  it('Test create existing patient friend request', function (done) {
    var data = {toPatientId: patientId2, message: 'hi'};
    util.req.json('post', '/api/patients/' + patientId + '/friends/requests', mockOpenid, 'patient')
      .send(data)
      .expect(409, done);
  });

  // get created request by patient2.
  it('Test get patient friend requests', function (done) {
    util.req.json('get', '/api/patients/' + patientId2 + '/friends/requests', mockOpenid, 'patient')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(1);
        should(data[0].from).equal(patientId);
        should(data[0].fromName).equal(mockPatient.name);
        should(data[0].status).equal('requested');
        friendRequestId = data[0]._id;
        done();
      });
  });

  it('Test get request between two patients', function (done) {
    util.req.json('get', '/api/patients/friends/' + patientId + '/' + patientId2, mockOpenid, 'patient')
      .expect(200, done);
  });
  it('Test get request between two patients reverse', function (done) {
    util.req.json('get', '/api/patients/friends/' + patientId2 + '/' + patientId, mockOpenid, 'patient')
      .expect(200, done);
  });

  // patient2 accept the request.
  it('Test accept patient friend request', function (done) {
    util.req.json('put', '/api/patients/friends/requests/' + friendRequestId + '/acceptance', mockOpenid, 'patient')
      .expect(200, done);
  });

  it('Test get patient friends', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/friends', mockOpenid, 'patient')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var friends = res.body.data;
        should(friends.length).equal(1);
        should(friends[0]._id).equal(patientId2);
        done();
      })
  });

  it('Test get patient2 friends', function (done) {
    util.req.json('get', '/api/patients/' + patientId2 + '/friends', mockOpenid, 'patient')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var friends = res.body.data;
        should(friends.length).equal(1);
        should(friends[0]._id).equal(patientId);
        done();
      })
  });

  it('Test delete friends', function (done) {
    util.req.json('delete', '/api/patients/friends/requests/' + friendRequestId, mockOpenid, 'patient')
      .expect(200)
      .end(function (err, res) {
        util.req.json('get', '/api/patients/' + patientId + '/friends', mockOpenid, 'patient')
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            var friends = res.body.data;
            should(friends.length).equal(0);
            done();
          })
      });
  });
});
