/**
 * Created by Ting on 2015/7/29.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');

describe.only('Tests for APIs of patient cases.', function () {
  var testData, testPatient, testPatient2, testPatient3, testDoctor, testDoctor2;
  var patientId, patientId2, patientId3, doctorId, doctorId2;
  var caseIdBySelf, caseIdBySelf2, caseIdByDoctor, friendId, relationId, commendIdBySelf, commendIdByPatient, commendIdByDoctor;
  var Doctor = util.app.models.Doctor;
  var Patient = util.app.models.Patient;
  var ServiceOrder = util.app.models.ServiceOrder;
  var PatientFriend = util.app.models.PatientFriend;
  var DPRelation = util.app.models.DoctorPatientRelation;
  var CaseHistory = util.app.models.CaseHistory;

  before(function (done) {
    testPatient = util.conf.testData.unitPatients[0];
    testPatient2 = util.conf.testData.unitPatients[1]; // friend with testPatient
    testPatient3 = util.conf.testData.unitPatients[2]; // not friend with testPatient
    testDoctor = util.conf.testData.unitDoctors[0]; // has order with testPatient
    testDoctor2 = util.conf.testData.unitDoctors[1];// has no order with testPatient
    testData = JSON.parse(process.env.testData);
    patientId = testData.patient1.id;
    patientId2 = testData.patient2.id;
    patientId3 = testData.patient3.id;
    doctorId = testData.doctor1.id;
    doctorId2 = testData.doctor2.id;


    PatientFriend.create({
      from: patientId,
      to: patientId2,
      status: util.app.consts.friendStatus.accepted
    }).then(function (created) {
      friendId = created.id;
      return PatientFriend.find({
        "$or": [{
          from: patientId,
          to: patientId3,
          status: util.app.consts.friendStatus.accepted
        }, {
          from: patientId3,
          to: patientId,
          status: util.app.consts.friendStatus.accepted
        }]
      }).exec();
    }).then(function (friends) {
      // make sure patient and patient3 are NOT friends.
      if (friends.length > 0) {
        for (var i = 0; i < friends.length; i++) {
          PatientFriend.remove({_id: friends[i].id}, function (err, ret) {
            if (err) return done(err);
          })
        }
      }
      return ServiceOrder.find({doctorId: doctorId2, patientId: patientId}).exec();
    }).then(function (orders) {
      // make sure doctor2 and patient has NO orders
      if (orders.length > 0) {
        for (var i = 0; i < orders.length; i++) {
          ServiceOrder.remove({_id: orders[i].id}, function (err, ret) {
            if (err) return done(err);
          })
        }
      }
      return DPRelation.find({'doctor.id': doctorId, 'patient.id': patientId}).exec();
    }).then(function (orders) {
      // make sure doctor and patient has orders
      if (orders.length == 0) {
        DPRelation.create({
          doctor: {id: doctorId},
          patient: {id: patientId},
          status: util.app.consts.relationStatus.putong.value
        }, function (err, created) {
          if (err) return done(err);
          relationId = created.id;
          done();
        });
      } else {
        done();
      }
    }).then(null, function (err) {
      done(err);
    });
  });

  after(function (done) {
    DPRelation.remove({_id: relationId}).exec()
      .then(function () {
        return PatientFriend.remove({_id: friendId}).exec();
      }).then(function () {
        done();
      })
  });

  /* --- create cases ----------------------------------------------------------------------------*/
  it('Create case will success because created by patient self.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases', testPatient.wechat.openid, util.app.consts.role.patient)
      .send({content: 'test case'})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var createdCase = res.body.data;
        caseIdBySelf = createdCase._id;
        should(createdCase.content).equal('test case');
        should(createdCase.creator.id).equal(patientId);
        should(createdCase.creator.name).equal(testPatient.name);
        should(createdCase.creator.role).equal(util.app.consts.role.patient);
        done();
      });
  });

  it('Create case will success because doctor has order relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases', testDoctor.wechat.openid, util.app.consts.role.doctor)
      .send({content: 'test case'})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var createdCase = res.body.data;
        caseIdByDoctor = createdCase._id;
        should(createdCase.content).equal('test case');
        should(createdCase.creator.id).equal(doctorId);
        should(createdCase.creator.name).equal(testDoctor.name);
        should(createdCase.creator.role).equal(util.app.consts.role.doctor);
        done();
      });
  });

  it('Create case will fail because wrong link type.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases', testPatient.wechat.openid, util.app.consts.role.patient)
      .send({content: 'test case', link: {linkType: 'wrongType'}})
      .expect(400, done);
  });

  it('Create case will fail because blank content.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases', testPatient.wechat.openid, util.app.consts.role.patient)
      .send({})
      .expect(400, done);
  });

  it('Create case will success because blank content but has link added.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases', testPatient.wechat.openid, util.app.consts.role.patient)
      .send({link: {type: 'image'}})
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        var createdCase = res.body.data;
        caseIdBySelf2 = createdCase._id;
        done();
      });
  });

  it('Create case will fail because other patient has no privilege.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases', testPatient2.wechat.openid, util.app.consts.role.patient)
      .send({content: 'test case'})
      .expect(403, done);
  });

  it('Create case will fail because doctor has no privilege without order relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases', testDoctor2.wechat.openid, util.app.consts.role.doctor)
      .send({content: 'test case'})
      .expect(403, done);
  });

  /* --- get cases ----------------------------------------------------------------------------*/
  it('Get cases will success because by patient self.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases', testPatient.wechat.openid, util.app.consts.role.patient)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var cases = res.body.data;
        should(cases.length).greaterThan(0);
        done();
      });
  });

  it('Get cases will success because by doctor which have order relationship.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases', testDoctor.wechat.openid, util.app.consts.role.doctor)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var cases = res.body.data;
        should(cases.length).greaterThan(0);
        done();
      });
  });

  it('Get cases will success because by patient which have friend relationship.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases', testPatient2.wechat.openid, util.app.consts.role.patient)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var cases = res.body.data;
        should(cases.length).greaterThan(0);
        done();
      });
  });

  it('Get cases will fail because by patient which have NO friend relationship.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases', testPatient3.wechat.openid, util.app.consts.role.patient)
      .expect(403, done);
  });

  it('Get cases will fail because by doctor which have NO order relationship.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases', testDoctor2.wechat.openid, util.app.consts.role.doctor)
      .expect(403, done);
  });

  /* --- create case comment ----------------------------------------------------------------------------*/
  it('Create case comment will success because by patient self.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments', testPatient.wechat.openid, util.app.consts.role.patient)
      .expect(200)
      .send({comment: 'test comment'})
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(1);
        should(updatedCase.comments[0].comment).equal('test comment');
        should(updatedCase.comments[0].creator.id).equal(patientId);
        commendIdBySelf = updatedCase.comments[0]._id;
        done();
      });
  });

  it('Create case comment will success because by doctor which have order relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments', testDoctor.wechat.openid, util.app.consts.role.doctor)
      .expect(200)
      .send({comment: 'test comment1'})
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(2);
        should(updatedCase.comments[1].comment).equal('test comment1');
        should(updatedCase.comments[1].creator.id).equal(doctorId);
        commendIdByDoctor = updatedCase.comments[1]._id;
        done();
      });
  });

  it('Create case comment will success because by patient which have friend relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments', testPatient2.wechat.openid, util.app.consts.role.patient)
      .expect(200)
      .send({comment: 'test comment2'})
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(3);
        should(updatedCase.comments[2].comment).equal('test comment2');
        should(updatedCase.comments[2].creator.id).equal(patientId2);
        commendIdByPatient = updatedCase.comments[2]._id;
        done();
      });
  });

  it('Create case comment will fail because by patient which have NO friend relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments', testPatient3.wechat.openid, util.app.consts.role.patient)
      .expect(403, done);
  });

  it('Create case comment will fail because by doctor which have NO order relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments', testDoctor2.wechat.openid, util.app.consts.role.doctor)
      .expect(403, done);
  });

  /* --- delete case comment ----------------------------------------------------------------------------*/
  it('Delete case comment will fail because comment created by others.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments/' + commendIdByDoctor, testPatient.wechat.openid, util.app.consts.role.patient)
      .expect(403, done);
  });

  it('Delete case comment will fail because comment created by others.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments/' + commendIdByPatient, testPatient.wechat.openid, util.app.consts.role.patient)
      .expect(403, done);
  });

  it('Delete case comment will success because it was created by patient self.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments/' + commendIdBySelf, testPatient.wechat.openid, util.app.consts.role.patient)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(2);
        done();
      });
  });

  it('Delete case comment will success because it was created by doctor self.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments/' + commendIdByDoctor, testDoctor.wechat.openid, util.app.consts.role.doctor)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(1);
        done();
      });
  });

  it('Delete case comment will success because it was created by another patient self.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments/' + commendIdByPatient, testPatient2.wechat.openid, util.app.consts.role.patient)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(0);
        done();
      });
  });

  /* --- delete case ----------------------------------------------------------------------------*/
  it('Delete case will fail because comment created by others.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdByDoctor, testPatient2.wechat.openid, util.app.consts.role.patient)
      .expect(403, done);
  });

  it('Delete case will fail because comment created by others.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf, testDoctor.wechat.openid, util.app.consts.role.doctor)
      .expect(403, done);
  });

  it('Delete case will success because it was created by patient self.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf, testPatient.wechat.openid, util.app.consts.role.patient)
      .expect(200, done);
  });

  it('Delete case2 will success because it was created by patient self.', function (done) {
    // this case is to avoid leave test data in db.
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf2, testPatient.wechat.openid, util.app.consts.role.patient)
      .expect(200, done);
  });

  it('Delete case will success because it was created by doctor self.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdByDoctor, testDoctor.wechat.openid, util.app.consts.role.doctor)
      .expect(200, done);
  });

  /* --- check post case privilege ----------------------------------------------------------------*/
  it('Check case post privilege will success because is patient self.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/postPrivilege', testPatient.wechat.openid, util.app.consts.role.patient)
      .expect(200, done);
  });
  it('Check case post privilege will success because doctor has orders.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/postPrivilege', testDoctor.wechat.openid, util.app.consts.role.doctor)
      .expect(200, done);
  });
  it('Check case post privilege will fail because patient is friend.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/postPrivilege', testPatient2.wechat.openid, util.app.consts.role.patient)
      .expect(403, done);
  });
  it('Check case post privilege will fail because patient is not friend.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/postPrivilege', testPatient3.wechat.openid, util.app.consts.role.patient)
      .expect(403, done);
  });
  it('Check case post privilege will fail because doctor has no orders.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/postPrivilege', testDoctor2.wechat.openid, util.app.consts.role.doctor)
      .expect(403, done);
  });
  /* --- check view case privilege ----------------------------------------------------------------*/
  it('Check case view privilege will success because is patient self.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/viewPrivilege', testPatient.wechat.openid, util.app.consts.role.patient)
      .expect(200, done);
  });
  it('Check case view privilege will success because doctor has orders.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/viewPrivilege', testDoctor.wechat.openid, util.app.consts.role.doctor)
      .expect(200, done);
  });
  it('Check case view privilege will success because patient is friend.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/viewPrivilege', testPatient2.wechat.openid, util.app.consts.role.patient)
      .expect(200, done);
  });
  it('Check case view privilege will fail because patient is not friend.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/viewPrivilege', testPatient3.wechat.openid, util.app.consts.role.patient)
      .expect(403, done);
  });
  it('Check case view privilege will fail because doctor has no orders.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/viewPrivilege', testDoctor2.wechat.openid, util.app.consts.role.doctor)
      .expect(403, done);
  });
});
