/**
 * Test order APIs. Also verify service stock changes.
 *
 * 订单涉及系统的核心逻辑，随着订单的创建、支付、确认和完成，医患的等级、账户余额，以及之间的关系也随之发生变化。
 *
 * 一、关于医患的关系：
 * 订单类型分为：加号、随诊、会诊
 * 关系状态分为：随诊、既往、普通
 *
 * 关系链在两个角色之间是唯一的，关系链的状态是唯一的。
 * • 患者关注医生：
 *    ○ 如果没有关系存在，创建新的关系，状态为普通。
 *    ○ 如果已有关系存在，保持状态不变。
 * • 所有订单以支付成功为节点：
 *    ○ 如果没有关系存在，创建新的关系，状态为既往。
 *    ○ 如果已有普通关系，转换关系状态为既往。
 *    ○ 如果已有既往关系，保持关系状态不变。
 *    ○ 如果已有随诊关系，保持关系状态不变。
 * • 随诊订单以医生确认为节点，转为关系状态为随诊。
 * • 随诊订单以服务到期为节点，转为关系状态为既往。
 * • 患者可以删除既往和普通状态的关系（医生不可以删除医患关系链），然后患者再加这个医生为好友，这时候又会创建一个普通状态的医患关系链。
 *
 * 二、订单状态改变：
 * 订单的主要状态包括：未支付、已支付、已确认、已拒绝、已完成，还有一个特殊的订单“已提取”。
 * 1. 创建的订单，24小时不支付，变为过期。
 * 2. 支付的订单，会出现在医患的“随诊”或“既往”关系中，且医生可以查看，确认或拒绝。
 * 3. 已确认的订单，会记入医生“进行中交易”的积分。
 * 4. 会诊订单，所有医生确认，订单状态才为“确认”。
 * 5. 已拒绝的订单，会记入患者的账户余额。
 * 6. 已完成的订单，会记入医生账户余额。
 * 7. 账户提取记入“已提取”。
 *
 *
 * 在这个测试中，我们关注：
 * 1. 创建普通关系，验证“我的医生”的普通关系包含医生，“全部患者”的普通关系包含患者。
 * 2. 创建加号、随诊、会诊订单各一。验证“我的医生”和“全部患者”结果不变，依然在普通关系。
 * 3. 加号订单不支付，支付随诊和会诊订单。验证“我的医生”和“全部患者”结果改为随诊关系。医生账户不变。
 * 4. 随诊订单拒绝，验证医患关系进入既往，患者账户余额增加。
 * 5. 会诊订单所有医生同意，订单状态进入确认。医生账户“进行中交易“积分增加。
 * 6. 执行订单状态检查脚本，由于未到期，没有以完成交易。
 * 7. 修改会诊订单时间，执行订单状态检查脚本，验证订单应该变为已完成，医生积分变化, 等级变化。
 *
 *
 * Created by Ting on 2015/8/4.
 */
var should = require('should');
var test = require('../testUtils');
var dateUtil = require('../../../server/utils/date-utils');
var orderStatusProcessor = require('../../../server/processOrderStatus');
describe('Test order APIs. ', function () {
  var testData, testPatient, testPatient2, testDoctor, testDoctor2;
  var patientId, patientId2, doctorId, doctorId2, patientOpenid, patientOpenid2, doctorOpenid, doctorOpenid2;
  var doctorService, previousServiceStock;
  var orderIdJiahao, orderIdSuizhen, orderIdSuizhen2, orderIdHuizhen, doctorCommentId, patientCommentId;

  var Doctor = test.app.models.Doctor;
  var Patient = test.app.models.Patient;
  var ServiceOrder = test.app.models.ServiceOrder;
  var DPRelation = test.app.models.DoctorPatientRelation;
  var patientRole = test.app.consts.role.patient;
  var doctorRole = test.app.consts.role.doctor;
  var suizhenDoctorPrice = test.conf.testData.doctorService[2].price;
  var huizhenDoctorPrice = test.conf.testData.doctorService[1].price; // all doctor's service are same.
  var suizhenBillingPrice = test.conf.testData.doctorService[2].billingPrice; // billing price is for patient, it is 1.1 times of doctor service price
  var huizhenBillingPrice = test.conf.testData.doctorService[1].billingPrice;

  before(function (done) {
    testPatient = test.conf.testData.unitPatients[3]; //level 1
    testPatient2 = test.conf.testData.unitPatients[2];//level 2
    testDoctor = test.conf.testData.unitDoctors[3];   //level 1
    testDoctor2 = test.conf.testData.unitDoctors[2];  //level 2
    testData = JSON.parse(process.env.testData);
    patientId = testData.patient4.id;
    patientId2 = testData.patient3.id;
    doctorId = testData.doctor4.id;
    doctorId2 = testData.doctor3.id;
    patientOpenid = testData.patient4.openid;
    patientOpenid2 = testData.patient3.openid;
    doctorOpenid = testData.doctor4.openid;
    doctorOpenid2 = testData.doctor3.openid;
    doctorService = test.conf.testData.doctorService;


    // make sure no relation and order data
    DPRelation.remove({
      '$or': [
        {'doctor.id': {'$in': [doctorId, doctorId2]}},
        {'patient.id': {'$in': [patientId, patientId2]}}
      ]
    }).exec()
      .then(function () {
        return ServiceOrder.remove({
          '$or': [
            {'doctors.id': {'$in': [doctorId, doctorId2]}},
            {'patient.id': {'$in': [patientId, patientId2]}}
          ]
        }).exec();
      }).then(function () {
        done();
      }).then(null, function (err) {
        done(err);
      })
  });

  after(function (done) {
    // delete created orders and DPRelations.
    var createdOrderIds = [orderIdJiahao, orderIdSuizhen, orderIdSuizhen2, orderIdHuizhen];
    ServiceOrder.remove({'_id': {'$in': createdOrderIds}})
      .then(function (ret) {
        should(ret.result.n).equal(createdOrderIds.length);
        return DPRelation.remove({'patient.id': patientId})
      }).then(function (ret) {
        should(ret.result.n).equal(2); // in all cases, created relations with 2 doctors (doctor1, doctor2)
        done();
      }).then(null, function (err) {
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


  it('Test doctors are not in "my doctors" of patient1 because no relations currently', function (done) {
    test.req.json('get', '/api/patients/' + patientId + '/doctorRelations', patientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(0);
        done();
      });
  });

  it('Test patient1 are not in "my patients" of doctor1 because no relations currently', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId + '/patientRelations', doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(0);
        done();
      });
  });

  it('Test patient1 are not in "my patients" of doctor2 because no relations currently', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId2 + '/patientRelations', doctorOpenid2, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(0);
        done();
      });
  });

  it('Test patient1, doctor1, doctor2 level is not "real"', function (done) {
    test.req.json('get', '/api/patients/' + patientId, patientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.level).equal('1');
        test.req.json('get', '/api/doctors/' + doctorId, doctorOpenid, doctorRole)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            var data = res.body.data;
            should(data.level).equal('1');
            test.req.json('get', '/api/doctors/' + doctorId2, doctorOpenid2, doctorRole)
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err);
                var data = res.body.data;
                should(data.level).equal('2');
                done();
              });
          });
      });
  });

  it('Test create "normal" relation between patient1 and doctor1', function (done) {
    test.req.json('post', '/api/relations/normal', patientId, patientRole)
      .send({doctorId: doctorId, patientId: patientId})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('Test doctor1 in "normal" list of "my doctors" of patient1', function (done) {
    test.req.json('get', '/api/patients/' + patientId + '/doctorRelations', patientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(1);
        should(data[0].doctor.id).equal(doctorId);
        should(data[0].status).equal(1); // 1 - putong
        done();
      });
  });

  it('Get service stock of doctor1', function (done) {


    test.req.json('get', '/api/doctors/' + doctorId + '/serviceStock', doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.jiahao.thisWeek.length).equal(5);
        should(data.jiahao.nextWeek.length).equal(5);
        should(data.jiahao.thisWeek[0].stock).equal(test.conf.testData.doctorService[0].weekQuantity.d1);
        previousServiceStock = getTodayStock(data);
        var today = new Date();
        if (today.getDay() == 6 || today.getDay() == 0) {
          should(previousServiceStock).equal(undefined);
          previousServiceStock = data.jiahao.thisWeek[0];
        }
        done();
      });
  });

  it('Create jiahao order of doctor1 by patient1 success.', function (done) {
    var mockOrder = {
      serviceId: previousServiceStock.serviceId,
      serviceType: test.app.consts.doctorServices.jiahao.type,
      doctorId: doctorId,
      patientId: patientId,
      price: doctorService[0].price,
      quantity: 1,
      bookingTime: dateUtil.getTodayStartDate()
    };
    test.req.json('post', '/api/orders', patientId, patientRole)
      .send(mockOrder)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        orderIdJiahao = res.body.data._id;
        done();
      });
  });

  it('Check service stock should decrease 1.', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId + '/serviceStock', patientId, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.jiahao.thisWeek.length).equal(5);
        var currentStock = getTodayStock(data);

        var today = new Date();
        if (today.getDay() == 6 || today.getDay() == 0) {
          should(currentStock).equal(undefined);
          console.log('vv Today is Saturday or Sunday, no jiahao stock, skip verify.');
        } else {
          should(previousServiceStock.stock - currentStock.stock).equal(1);
          //console.log(currentStock);
        }
        done();
      });
  });

  it('Create suizhen order of doctor1 by patient1 success.', function (done) {
    var mockOrder = {
      serviceId: 'mockServiceId',
      serviceType: test.app.consts.doctorServices.suizhen.type,
      doctorId: doctorId,
      patientId: patientId,
      price: doctorService[2].price,
      quantity: 1,
      bookingTime: new Date()
    };
    test.req.json('post', '/api/orders', patientId, patientRole)
      .send(mockOrder)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        orderIdSuizhen = res.body.data._id;
        done();
      });
  });

  it('Create huizhen order of doctor1 and doctor2 by patient1 success.', function (done) {
    var mockOrder = {
      serviceId: 'mockServiceId',
      serviceType: test.app.consts.doctorServices.huizhen.type,
      doctorId: [doctorId, doctorId2],
      patientId: patientId,
      price: doctorService[0].price,
      quantity: 1,
      bookingTime: dateUtil.getTodayStartDate()
    };
    test.req.json('post', '/api/orders', patientId, patientRole)
      .send(mockOrder)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        orderIdHuizhen = res.body.data._id;
        done();
      });
  });

  it('Test doctor1 still in "normal" list of "my doctors" of patient1, because upon orders are not paid', function (done) {
    test.req.json('get', '/api/patients/' + patientId + '/doctorRelations', patientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(1);
        should(data[0].doctor.id).equal(doctorId);
        should(data[0].status).equal(1);
        done();
      });
  });

  it('Test patient1 still in "normal" list of "my patients" of doctor1 because order are not paid', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId + '/patientRelations', doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(1);
        should(data[0].patient.id).equal(patientId);
        should(data[0].status).equal(1);
        done();
      });
  });

  it('Test patient1 are not in "my patients" of doctor2 because order are not paid', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId2 + '/patientRelations', doctorOpenid2, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(0);
        done();
      });
  });

  it('Test pay the "huizhen" order (this is dummy pay, just change the order status)', function (done) {
    test.req.json('put', '/api/orders/' + orderIdHuizhen + '/status/' + test.app.consts.orderStatus.paid, patientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('Test doctor1 and doctor2 are in "jiwang" list of "my doctors" of patient1', function (done) {
    test.req.json('get', '/api/patients/' + patientId + '/doctorRelations', patientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(2);
        should(data[0].doctor.id == doctorId || data[1].doctor.id == doctorId).be.true();
        should(data[0].doctor.id == doctorId2 || data[1].doctor.id == doctorId2).be.true();
        should(data[0].status).equal(2);
        should(data[1].status).equal(2);
        done();
      });
  });

  it('Test patient1 is in "jiwang" list of "my patients" of doctor1', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId + '/patientRelations', doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(1);
        should(data[0].patient.id).equal(patientId);
        should(data[0].status).equal(2);
        done();
      });
  });

  it('Test patient1 is in "jiwang" list of "my patients" of doctor2', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId2 + '/patientRelations', doctorOpenid2, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(1);
        should(data[0].patient.id).equal(patientId);
        should(data[0].status).equal(2);
        done();
      });
  });

  it('Test pay the "suizhen" order (this is dummy pay, just change the order status)', function (done) {
    test.req.json('put', '/api/orders/' + orderIdSuizhen + '/status/' + test.app.consts.orderStatus.paid, patientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('Test doctor1 confirmed the "suizhen" order.', function (done) {
    test.req.json('put', '/api/orders/' + orderIdSuizhen + '/status/' + test.app.consts.orderStatus.confirmed, doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('Test doctor1 change to "suizhen" and doctor2 are still in "jiwang" list of "my doctors" of patient1', function (done) {
    test.req.json('get', '/api/patients/' + patientId + '/doctorRelations', patientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(2);
        var doctor1Verified, doctor2Verified;
        for (var i = 0; i < data.length; i++) {
          var relation = data[i];
          if (relation.doctor.id == doctorId) {
            should(relation.status).equal(3);
            doctor1Verified = true;
          }
          if (relation.doctor.id == doctorId2) {
            should(relation.status).equal(2);
            doctor2Verified = true;
          }
        }
        should(doctor1Verified).equal(true);
        should(doctor2Verified).equal(true);
        done();
      });
  });

  it('Test patient1 is in "suizhen" list of "my patients" of doctor1', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId + '/patientRelations', doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.length).equal(1);
        should(data[0].patient.id).equal(patientId);
        should(data[0].status).equal(3);
        done();
      });
  });

  it('Test doctor2 rejected "huizhen" order', function (done) {
    test.req.json('put', '/api/orders/' + orderIdHuizhen + '/status/' + test.app.consts.orderStatus.rejected, doctorOpenid2, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('Test doctor1 account balance, should have "trading points" of the confirmed "suizhen" order', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId + '/orders/summary', doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.confirmed).equal(suizhenDoctorPrice);
        should(data.finished).equal(0);
        should(data.recommended).equal(0);
        done();
      });
  });

  it('Test doctor2 account balance, should be zero, because no confirmed orders', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId2 + '/orders/summary', doctorOpenid2, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.confirmed).equal(0);
        should(data.finished).equal(0);
        should(data.recommended).equal(0);
        done();
      });
  });

  it('Test patient account balance, should have withdraw of the rejected "huizhen" order', function (done) {
    test.req.json('get', '/api/patients/' + patientId + '/orders/summary', patientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.rejected).equal(huizhenBillingPrice * 2); // huizhen order have two doctors.
        done();
      });
  });

  it('Doctor1 recommends a "suizhen" order of doctor2 for patient1 success.', function (done) {
    var mockOrder = {
      serviceId: 'mockServiceId',
      serviceType: test.app.consts.doctorServices.suizhen.type,
      doctorId: doctorId2,
      patientId: patientId,
      price: suizhenDoctorPrice,
      quantity: 1,
      bookingTime: new Date(),
      referee: {
        id: doctorId
      }
    };
    test.req.json('post', '/api/orders', doctorOpenid, doctorRole)
      .send(mockOrder)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        orderIdSuizhen2 = res.body.data._id;
        done();
      });
  });

  it('Patient1 paid (dummy) for the recommended "suizhen" order', function (done) {
    test.req.json('put', '/api/orders/' + orderIdSuizhen2 + '/status/' + test.app.consts.orderStatus.paid, patientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('Doctor2 confirmed the recommended "suizen" order', function (done) {
    test.req.json('put', '/api/orders/' + orderIdSuizhen2 + '/status/' + test.app.consts.orderStatus.confirmed, doctorOpenid2, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('Test doctor1 account balance, should have "recommend points" of the 20% of service price', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId + '/orders/summary', doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.confirmed).equal(suizhenDoctorPrice);
        should(data.finished).equal(0);
        should(data.recommended).equal(suizhenDoctorPrice * 0.2);
        done();
      });
  });

  it('Test doctor2 account balance, should have "trading points" of 80% of the service price', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId2 + '/orders/summary', doctorOpenid2, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.confirmed).equal(suizhenDoctorPrice * 0.8);
        should(data.finished).equal(0);
        should(data.recommended).equal(0);
        done();
      });
  });

  it('Run script to check order status, should change 2 "confirmed" orders to "finished", change 1 not paid order to "expired"', function (done) {
    orderStatusProcessor.doProcess(/*isTestMode*/ true, function (err, ret) {
      if (err) return done(err);
      should(ret.finishedOrdersCount).equal(2);
      should(ret.expiredOrdersCount).equal(1);
      done();
    });
  });

  it('Test doctor1 account balance, should all "trading points" changes to "finished points"', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId + '/orders/summary', doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.confirmed).equal(0);
        should(data.finished).equal(suizhenDoctorPrice);
        should(data.recommended).equal(suizhenDoctorPrice * 0.2);
        done();
      });
  });

  it('Test doctor2 account balance, should all "trading points" changes to "finished points"', function (done) {
    test.req.json('get', '/api/doctors/' + doctorId2 + '/orders/summary', doctorOpenid2, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var data = res.body.data;
        should(data.confirmed).equal(0);
        should(data.finished).equal(suizhenDoctorPrice * 0.8);
        should(data.recommended).equal(0);
        done();
      });
  });

  it('Get order detail by testPatient success.', function (done) {
    test.req.json('get', '/api/orders/' + orderIdJiahao, patientOpenid, patientRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        should(res.body.data._id).equal(orderIdJiahao);
        done();
      });
  });

  it('Get order detail by testDoctor success.', function (done) {
    test.req.json('get', '/api/orders/' + orderIdJiahao, doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        should(res.body.data._id).equal(orderIdJiahao);
        done();
      });
  });

  it('Get order detail by testPatient2 should fail, because the order is created by testPatient.', function (done) {
    test.req.json('get', '/api/orders/' + orderIdJiahao, patientOpenid2, patientRole)
      .expect(403, done);
  });

  it('Get order detail by testDoctor2 should fail, because the order is created to testDoctor.', function (done) {
    test.req.json('get', '/api/orders/' + orderIdJiahao, doctorOpenid2, doctorRole)
      .expect(403, done);
  });

  it('Create comment by testDoctor success', function (done) {
    test.req.json('post', '/api/orders/' + orderIdJiahao + '/comments', doctorOpenid, doctorRole)
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
    test.req.json('post', '/api/orders/' + orderIdJiahao + '/comments', patientOpenid, patientRole)
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
    test.req.json('post', '/api/orders/' + orderIdJiahao + '/comments', doctorOpenid2, doctorRole)
      .send({comment: 'comment'})
      .expect(403, done);
  });

  it('Create comment by testPatient2 fail', function (done) {
    test.req.json('post', '/api/orders/' + orderIdJiahao + '/comments', patientOpenid2, patientRole)
      .send({comment: 'comment'})
      .expect(403, done)
  });

  it('Check order comments count should be 2.', function (done) {
    test.req.json('get', '/api/orders/' + orderIdJiahao, doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, resp) {
        if (err) return done(err);
        should(resp.body.data.comments.length).equal(2);
        done();
      });
  });

  it('Delete comment by testDoctor2 fail', function (done) {
    test.req.json('delete', '/api/orders/' + orderIdJiahao + '/comments/' + doctorCommentId, doctorOpenid2, doctorRole)
      .expect(403, done);
  });

  it('Delete comment by testPatient2 fail', function (done) {
    test.req.json('delete', '/api/orders/' + orderIdJiahao + '/comments/' + patientCommentId, patientOpenid2, patientRole)
      .expect(403, done)
  });

  it('Delete comment by testDoctor success', function (done) {
    test.req.json('delete', '/api/orders/' + orderIdJiahao + '/comments/' + doctorCommentId, doctorOpenid, doctorRole)
      .expect(200, done);
  });

  it('Delete comment by testPatient success', function (done) {
    test.req.json('delete', '/api/orders/' + orderIdJiahao + '/comments/' + patientCommentId, patientOpenid, patientRole)
      .expect(200, done)
  });

  it('Check order comments should be deleted.', function (done) {
    test.req.json('get', '/api/orders/' + orderIdJiahao, doctorOpenid, doctorRole)
      .expect(200)
      .end(function (err, resp) {
        if (err) return done(err);
        should(resp.body.data.comments.length).equal(0);
        done();
      });
  });
});
