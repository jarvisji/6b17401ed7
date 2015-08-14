/**
 * Created by Ting on 2015/7/17.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');

describe('Test doctor APIs.', function () {
  var ts, testData, doctorId, doctorId2, serviceId, openid, mockDoctor, mockDoctor2, friendRequestId;

  before(function () {
    ts = new Date().getTime();
    testData = JSON.parse(process.env.testData);
    doctorId = testData.doctor1.id;
    doctorId2 = testData.doctor2.id;
    openid = testData.doctor1.openid;
    mockDoctor = util.conf.testData.unitDoctors[0];
    mockDoctor2 = util.conf.testData.unitDoctors[1];
  });

  after(function (done) {
    // clean generated service stock data.
    var ServiceStock = util.app.models.ServiceStock;
    ServiceStock.remove({doctorId: testData.doctor4.id}, function (err) {
      if (err) return done(err);
      done();
    });
  });

  it.skip('Test create doctor.', function (done) {
    util.req.json('post', '/api/doctors', openid, 'patient')
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

  it.skip('Test create doctor with exists mobile phone number should fail', function (done) {
    util.req.json('post', '/api/doctors', openid, 'patient')
      .send(mockDoctor)
      .expect(409, done);
  });

  it('Test find doctors with filter: openid', function (done) {
    util.req.json('get', '/api/doctors', openid, 'patient')
      .query({filter: JSON.stringify({'wechat.openid': testData.doctor1.openid})})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).equal(1);
        should(res.body.data[0]._id).equal(testData.doctor1.id);
        done();
      });
  });

  it('Test find doctors with filter: wildcard', function (done) {
    util.req.json('get', '/api/doctors', openid, 'patient')
      .query({filter: JSON.stringify({'name': 'unit*'})})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).equal(util.conf.testData.unitDoctors.length);
        done();
      });
  });

  it('Test find doctors without filter', function (done) {
    util.req.json('get', '/api/doctors', openid, 'patient')
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.count).greaterThan(1);
        done();
      });
  });

  it('Test update doctor', function (done) {
    var newIntro = 'test introduction ' + Date.now();
    util.req.json('put', '/api/doctors/' + doctorId, openid, 'patient')
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

  it('Test get service stock of doctor4', function (done) {
    util.req.json('get', '/api/doctors/' + testData.doctor4.id + '/serviceStock', openid, 'patient')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        console.log('vv this is first time getting service stock.');
        console.log('>> verify generated service stock should have 2 weeks data, each week has 5 days.');
        console.log('>> verify stock number of first day of this week should equals to value of d1 of service setting.');
        var data = res.body.data;
        should(data.jiahao.thisWeek.length).equal(5);
        should(data.jiahao.nextWeek.length).equal(5);
        should(data.jiahao.thisWeek[0].stock).equal(util.conf.testData.doctorService[0].weekQuantity.d1);
        serviceId = data.jiahao.thisWeek[0].serviceId;
        done();
      });
  });

  it('Test update doctor4 service settings.', function (done) {
    var newServiceData = util.conf.testData.doctorService.concat();
    newServiceData[0].weekQuantity.d1 = 10;
    newServiceData[0]._id = serviceId;
    util.req.json('put', '/api/doctors/' + testData.doctor4.id, openid, 'patient')
      .send({services: newServiceData})
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        var data = res.body.data;
        should(data.services.length).equal(3);
        should(data.services[0].type).equal(newServiceData[0].type);
        should(data.services[0].price).equal(newServiceData[0].price);
        should(data.services[0]).have.property('_id');
        console.log('vv update service setting, set available stock of d1 to 10');
        done();
      });
  });

  it('Test generated service stock updated.', function (done) {
    util.req.json('get', '/api/doctors/' + testData.doctor4.id + '/serviceStock', openid, 'patient')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        console.log('vv service stock is pre-generated, when user updated service setting, we should update generated stock at mean time.');
        console.log('>> verify after upon case, d1 service stock changed to 10.');
        var data = res.body.data;
        should(data.jiahao.thisWeek.length).equal(5);
        should(data.jiahao.nextWeek.length).equal(5);
        should(data.jiahao.thisWeek[0].stock).equal(10);
        done();
      });
  });

  // create a request from doctor to doctor2.
  it('Test create doctor friend request', function (done) {
    // two doctor ids were retrieved by upon cases;
    var data = {toDoctorId: doctorId2, message: 'hi'};
    util.req.json('post', '/api/doctors/' + doctorId + '/friends/requests', openid, 'patient')
      .send(data)
      .expect(201)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.from).equal(doctorId);
        should(data.fromName).equal(mockDoctor.name);
        should(data.fromOpenid).equal(mockDoctor.wechat.openid);
        should(data.to).equal(doctorId2);
        should(data.status).equal('requested');
        done();
      });
  });

  it('Test create doctor friend fail without data', function (done) {
    // two doctor ids were retrieved by upon cases;
    util.req.json('post', '/api/doctors/' + doctorId + '/friends/requests', openid, 'patient')
      .send({})
      .expect(400, done);
  });

  it('Test create existing doctor friend request', function (done) {
    var data = {toDoctorId: doctorId2, message: 'hi'};
    util.req.json('post', '/api/doctors/' + doctorId + '/friends/requests', openid, 'patient')
      .send(data)
      .expect(409, done);
  });

  // get created request by doctor2.
  it('Test get doctor friend requests', function (done) {
    util.req.json('get', '/api/doctors/' + doctorId2 + '/friends/requests', openid, 'patient')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(1);
        should(data[0].from).equal(doctorId);
        should(data[0].fromName).equal(mockDoctor.name);
        should(data[0].status).equal('requested');
        friendRequestId = data[0]._id;
        done();
      });
  });

  it('Test get request between two doctors', function (done) {
    util.req.json('get', '/api/doctors/friends/' + doctorId + '/' + doctorId2, openid, 'patient')
      .expect(200, done);
  });
  it('Test get request between two doctors reverse', function (done) {
    util.req.json('get', '/api/doctors/friends/' + doctorId2 + '/' + doctorId, openid, 'patient')
      .expect(200, done);
  });

  // doctor2 accept the request.
  it('Test accept doctor friend request', function (done) {
    util.req.json('put', '/api/doctors/friends/requests/' + friendRequestId + '/acceptance', openid, 'patient')
      .expect(200, done);
  });

  it('Test get doctor friends', function (done) {
    util.req.json('get', '/api/doctors/' + doctorId + '/friends', openid, 'patient')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var friends = res.body.data;
        should(friends.length).equal(1);
        should(friends[0]._id).equal(doctorId2);
        done();
      })
  });

  it('Test get doctor2 friends', function (done) {
    util.req.json('get', '/api/doctors/' + doctorId2 + '/friends', openid, 'patient')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var friends = res.body.data;
        should(friends.length).equal(1);
        should(friends[0]._id).equal(doctorId);
        done();
      })
  });

  it('Test delete friends', function (done) {
    util.req.json('delete', '/api/doctors/friends/requests/' + friendRequestId, openid, 'patient')
      .expect(200)
      .end(function (err, res) {
        util.req.json('get', '/api/doctors/' + doctorId + '/friends', openid, 'patient')
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            var friends = res.body.data;
            should(friends.length).equal(0);
            done();
          })
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
});
