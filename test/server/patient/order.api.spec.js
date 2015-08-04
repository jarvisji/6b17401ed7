/**
 * Test order APIs. Also verify service stock changes.
 *
 * In this suite, we created 3 orders:
 * 1. to verify patient and doctor relationship:
 *    a) Updated 2 orders status to 'confirmed', so the doctorId should in patient' 'doctorInService'.
 *    b) Update one of 'confirmed' order status to 'finished', because there is another order is 'confirmed', so the 'doctorInService' and 'doctorPast' will not be changed.
 *    c) Update the other order status to 'finished', the doctorId should be moved from 'doctorInService' to 'doctorPast'.
 *
 * 2. To verify service stock:
 *    a) recode the service stock at test start.
 *    b) 3 orders created, the service stock should be drop 3.
 *    c) 1 order cancelled, the service stock will add back 1.
 *    d) At end of the tests, new service stock should be 2 less than before.
 * Created by Ting on 2015/8/4.
 */
var should = require('should');
var test = require('../testUtils');
var dateUtil = require('../../../server/utils/date-utils');
describe('Test order APIs. ', function () {
  var testPatient = test.conf.testData.patients[0];
  var testDoctor = test.conf.testData.doctors[0];
  var testPatient2 = test.conf.testData.patients[1];  // no relation to order
  var testDoctor2 = test.conf.testData.doctors[1];    // no relation to order
  var testPatientOpenid = testPatient.wechat.openid;
  var testDoctorOpenid = testDoctor.wechat.openid;
  var testPatient2Openid = testPatient2.wechat.openid;
  var testDoctor2Openid = testDoctor2.wechat.openid;
  var patientRole = test.app.consts.role.patient;
  var doctorRole = test.app.consts.role.doctor;

  var Doctor = test.app.models.Doctor;
  var Patient = test.app.models.Patient;
  var ServiceOrder = test.app.models.ServiceOrder;
  var ServiceStock = test.app.models.ServiceStock;

  var doctorId, patientId, previousServiceStock, servicePrice, orderId, orderId2, orderId3, doctorCommentId, patientCommentId, mockOrder;

  before(function (done) {
    // make sure doctor defined service quantity, and service stock generated.
    Doctor.findOne({'wechat.openid': testDoctorOpenid}).exec()
      .then(function (doctor) {
        doctorId = doctor.id;
        if (doctor.services.length == 0) {
          doctor.services = test.conf.testData.doctorService;
          return doctor.save();
        }
      }).then(function (savedDoctor) {
        return Patient.findOne({'wechat.openid': testPatientOpenid}).exec();
      }).then(function (patient) {
        patientId = patient.id;
        //clear 'doctorInService' and 'doctorPast' of patient, because the following cases assertion depends on it.
        patient.doctorInService = [];
        patient.doctorPast = [];
        return patient.save();
      }).then(function () {
        // get stock data.
        test.req.json('get', '/api/doctors/' + doctorId + '/serviceStock', testPatientOpenid, patientRole)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            var data = res.body.data;
            servicePrice = data.jiahao.price;
            should(data.jiahao.thisWeek.length).equal(5);
            should(data.jiahao.nextWeek.length).equal(5);
            previousServiceStock = getTodayStock(data);
            should(previousServiceStock.stock).is.Number();

            mockOrder = {
              serviceId: previousServiceStock.serviceId,
              doctorId: doctorId,
              patientId: patientId,
              price: servicePrice,
              quantity: 1
            };

            done();
          });
      }, function (err) {
        done(err);
      });
  });

  var getTodayStock = function (stockRespData) {
    var today = dateUtil.getTodayStartDate();
    var week = stockRespData.jiahao.thisWeek;
    for (var idx in week) {
      if (week[idx].date == today.toISOString()) {
        return week[idx];
      }
    }
  };

  it('Create order by testPatient success.', function (done) {
    test.req.json('post', '/api/orders', testPatientOpenid, patientRole)
      .send(mockOrder)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        orderId = res.body.data._id;
        done();
      });
  });

  it('Check service stock should decrease 1.', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId + '/serviceStock', testPatientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.jiahao.thisWeek.length).equal(5);
        var currentStock = getTodayStock(data);
        should(previousServiceStock.stock - currentStock.stock).equal(1);
        done();
      });
  });

  //it('Check testPatient doctorInService, should contains testDoctor', function (done) {
  //  test.req.json('get', '/api/patients', testPatientOpenid, patientRole)
  //    .query({filter: JSON.stringify({'wechat.openid': testPatientOpenid})})
  //    .expect(200)
  //    .end(function (err, res) {
  //      if (err) return done(err);
  //      console.log(res.body.data[0]);
  //      var patient = res.body.data[0];
  //      should(patient.doctorInService.indexOf(doctorId)).not.equal(-1);
  //      done();
  //    });
  //});

  it('Check my orders of testDoctor, the first should be the one just created.', function (done) {
    test.req.json('get', '/api/orders/my', testDoctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var orders = res.body.data;
        should(orders.length).greaterThan(0);
        should(orders[0]._id).equal(orderId);
        done();
      });
  });

  it('Check my orders of testPatient, the first should be the one just created.', function (done) {
    test.req.json('get', '/api/orders/my', testPatientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var orders = res.body.data;
        should(orders.length).greaterThan(0);
        should(orders[0]._id).equal(orderId);
        done();
      });
  });

  it('Get order detail by testPatient success.', function (done) {
    test.req.json('get', '/api/orders/' + orderId, testPatientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        should(res.body.data._id).equal(orderId);
        done();
      });
  });

  it('Get order detail by testDoctor success.', function (done) {
    test.req.json('get', '/api/orders/' + orderId, testDoctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        should(res.body.data._id).equal(orderId);
        done();
      });
  });

  it('Get order detail by testPatient2 should fail, because the order is created by testPatient.', function (done) {
    test.req.json('get', '/api/orders/' + orderId, testPatient2Openid, patientRole)
      .expect(403, done);
  });

  it('Get order detail by testDoctor2 should fail, because the order is created to testDoctor.', function (done) {
    test.req.json('get', '/api/orders/' + orderId, testDoctor2Openid, doctorRole)
      .expect(403, done);
  });

  it('Create comment by testDoctor success', function (done) {
    test.req.json('post', '/api/orders/' + orderId + '/comments', testDoctorOpenid, doctorRole)
      .send({comment: 'doctor comment'})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var comment = res.body.data.comments[0];
        should(comment.creator.id).equal(doctorId);
        should(comment.comment).equal('doctor comment');
        doctorCommentId = comment._id;
        //console.log('orderId: %s, doctorCommentId: %s, patientCommentId: %s', orderId, doctorCommentId, patientCommentId);
        done();
      });
  });

  it('Create comment by testPatient success', function (done) {
    test.req.json('post', '/api/orders/' + orderId + '/comments', testPatientOpenid, patientRole)
      .send({comment: 'patient comment'})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var comment = res.body.data.comments[1];
        should(comment.creator.id).equal(patientId);
        should(comment.comment).equal('patient comment');
        patientCommentId = comment._id;
        done();
      });
  });

  it('Create comment by testDoctor2 fail', function (done) {
    test.req.json('post', '/api/orders/' + orderId + '/comments', testDoctor2Openid, doctorRole)
      .send({comment: 'comment'})
      .expect(403, done);
  });

  it('Create comment by testPatient2 fail', function (done) {
    test.req.json('post', '/api/orders/' + orderId + '/comments', testPatient2Openid, patientRole)
      .send({comment: 'comment'})
      .expect(403, done)
  });

  it('Check order comments count should be 2.', function (done) {
    test.req.json('get', '/api/orders/' + orderId, testDoctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, resp) {
        if (err) return done(err);
        should(resp.body.data.comments.length).equal(2);
        done();
      });
  });

  it('Delete comment by testDoctor2 fail', function (done) {
    test.req.json('delete', '/api/orders/' + orderId + '/comments/' + doctorCommentId, testDoctor2Openid, doctorRole)
      .expect(403, done);
  });

  it('Delete comment by testPatient2 fail', function (done) {
    test.req.json('delete', '/api/orders/' + orderId + '/comments/' + patientCommentId, testPatient2Openid, patientRole)
      .expect(403, done)
  });

  it('Delete comment by testDoctor success', function (done) {
    test.req.json('delete', '/api/orders/' + orderId + '/comments/' + doctorCommentId, testDoctorOpenid, doctorRole)
      .expect(200, done);
  });

  it('Delete comment by testPatient success', function (done) {
    test.req.json('delete', '/api/orders/' + orderId + '/comments/' + patientCommentId, testPatientOpenid, patientRole)
      .expect(200, done)
  });

  it('Check order comments should be deleted.', function (done) {
    test.req.json('get', '/api/orders/' + orderId, testDoctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, resp) {
        if (err) return done(err);
        should(resp.body.data.comments.length).equal(0);
        done();
      });
  });

  it('Create order2 success.', function (done) {
    test.req.json('post', '/api/orders', testDoctorOpenid, doctorRole)
      .send(mockOrder)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        orderId2 = res.body.data._id;
        done();
      });
  });

  it('Check service stock should decrease 2.', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId + '/serviceStock', testPatientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.jiahao.thisWeek.length).equal(5);
        var currentStock = getTodayStock(data);
        should(previousServiceStock.stock - currentStock.stock).equal(2);
        done();
      });
  });

  it('Update order2 status to "confirmed" should success.', function (done) {
    test.req.json('put', '/api/orders/' + orderId2 + '/status/confirmed', testDoctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, resp) {
        if (err) return done(err);
        ServiceOrder.findById(orderId2, function (err, order) {
          if (err) return done(err);
          should(order.status).equal('confirmed');
          done();
        })
      });
  });

  it('Create order3 and set status to "confirmed"', function (done) {
    test.req.json('post', '/api/orders', testPatientOpenid, patientRole)
      .send(mockOrder)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        orderId3 = res.body.data._id;
        test.req.json('put', '/api/orders/' + orderId3 + '/status/confirmed', testDoctorOpenid, doctorRole)
          .expect(200)
          .end(function(err, resp){
            // after update status returns, server still need time to update relationship.
            setTimeout(done, 100);
          })
      });
  });

  it('Check "doctorInService" of testPatient, should contains testDoctor', function (done) {
    Patient.findById(patientId, function (err, patient) {
      if (err) return done(err);
      should(patient.doctorInService.indexOf(doctorId)).not.equal(-1);
      done();
    })
  });

  it('Update order2 status to "finish" should success.', function (done) {
    test.req.json('put', '/api/orders/' + orderId2 + '/status/finished', testDoctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, resp) {
        if (err) return done(err);
        ServiceOrder.findById(orderId2, function (err, order) {
          if (err) return done(err);
          should(order.status).equal('finished');
          setTimeout(done, 100);
        })
      });
  });


  it('Check "doctorPast" of testPatient not contains testDoctor, because there is another "confirmed" order "order3".', function (done) {
    Patient.findById(patientId, function (err, patient) {
      if (err) return done(err);
      should(patient.doctorInService.indexOf(doctorId)).not.equal(-1);
      should(patient.doctorPast.indexOf(doctorId)).equal(-1);
      done();
    })
  });

  it('Update status to "finish" of order3 success', function (done) {
    test.req.json('put', '/api/orders/' + orderId3 + '/status/finished', testDoctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, resp) {
        if (err) return done(err);
        ServiceOrder.findById(orderId3, function (err, order) {
          if (err) return done(err);
          should(order.status).equal('finished');
          setTimeout(done, 100);
        })
      });
  });

  it('Check "doctorPast" of testPatient contains testDoctor, "doctorInService" not', function (done) {
    Patient.findById(patientId, function (err, patient) {
      if (err) return done(err);
      should(patient.doctorInService.indexOf(doctorId)).equal(-1);
      should(patient.doctorPast.indexOf(doctorId)).not.equal(-1);
      done();
    })
  });

  it('Cancel order by testDoctor success', function (done) {
    test.req.json('put', '/api/orders/' + orderId + '/status/cancelled', testDoctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, resp) {
        if (err) return done(err);
        ServiceOrder.findById(orderId, function (err, order) {
          if (err) return done(err);
          should(order.status).equal('cancelled');
          done();
        })
      });
  });

  it('Cancel order by testPatient success', function (done) {
    test.req.json('put', '/api/orders/' + orderId + '/status/cancelled', testPatientOpenid, patientRole)
      .expect(200)
      .end(function (err, resp) {
        if (err) return done(err);
        ServiceOrder.findById(orderId, function (err, order) {
          if (err) return done(err);
          should(order.status).equal('cancelled');
          done();
        })
      });
  });

  it('Cancel order by testDoctor2 fail', function (done) {
    test.req.json('put', '/api/orders/' + orderId + '/status/cancelled', testDoctor2Openid, doctorRole)
      .expect(403, done);
  });

  it('Cancel order by testPatient2 fail', function (done) {
    test.req.json('put', '/api/orders/' + orderId + '/status/cancelled', testPatient2Openid, patientRole)
      .expect(403, done);
  });

  it('Service stock increase 1 after order cancelled (even cancelled twice)', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId + '/serviceStock', testPatientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.jiahao.thisWeek.length).equal(5);
        var currentStock = getTodayStock(data);
        // should equal 2 because created 3 orders and cancelled 1.
        should(previousServiceStock.stock - currentStock.stock).equal(2);
        done();
      });
  });
});
