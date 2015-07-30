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
  var patientId, patientId2, friendRequestId;
  var mockPatient = util.conf.testData.patients[0];
  var mockPatient2 = util.conf.testData.patients[1];

  it('Test find patients with filter: openid', function (done) {
    util.req.json('get', '/api/patients')
      .query({filter: JSON.stringify({'wechat.openid': mockPatient.wechat.openid})})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).equal(1);
        should(res.body.data[0]).not.have.property('password');
        patientId = res.body.data[0]._id;
        util.req.json('get', '/api/patients')
          .query({filter: JSON.stringify({'wechat.openid': mockPatient2.wechat.openid})})
          .expect(200)
          .end(function (err, res) {
            if (err) done(err);
            patientId2 = res.body.data[0]._id;
            done();
          });
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

  // create a request from patient to patients.
  it('Test create patient friend request', function (done) {
    // two patient ids were retrieved by upon cases;
    var data = {toPatientId: patientId2, message: 'hi'};
    util.req.json('post', '/api/patients/' + patientId + '/friends/requests')
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
    util.req.json('post', '/api/patients/' + patientId + '/friends/requests')
      .send({})
      .expect(400, done);
  });

  it('Test create existing patient friend request', function (done) {
    var data = {toPatientId: patientId2, message: 'hi'};
    util.req.json('post', '/api/patients/' + patientId + '/friends/requests')
      .send(data)
      .expect(409, done);
  });

  // get created request by patient2.
  it('Test get patient friend requests', function (done) {
    util.req.json('get', '/api/patients/' + patientId2 + '/friends/requests')
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
    util.req.json('get', '/api/patients/friends/' + patientId + '/' + patientId2)
      .expect(200, done);
  });
  it('Test get request between two patients reverse', function (done) {
    util.req.json('get', '/api/patients/friends/' + patientId2 + '/' + patientId)
      .expect(200, done);
  });

  // patient2 accept the request.
  it('Test accept patient friend request', function (done) {
    util.req.json('put', '/api/patients/friends/requests/' + friendRequestId + '/acceptance')
      .expect(200, done);
  });

  it('Test get patient friends', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/friends')
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
    util.req.json('get', '/api/patients/' + patientId2 + '/friends')
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
    util.req.json('delete', '/api/patients/friends/requests/' + friendRequestId)
      .expect(200)
      .end(function (err, res) {
        util.req.json('get', '/api/patients/' + patientId + '/friends')
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
