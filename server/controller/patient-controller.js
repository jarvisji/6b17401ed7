/**
 * Created by Ting on 2015/7/23.
 */

var sha512 = require('crypto-js/sha512');
var debug = require('debug')('ylb.patientCtrl');
var utils = require('../middleware/utils');
var stringUtils = require('../utils/string-utils');

module.exports = function (app) {
  var authUtils = require('../utils/auth-utils')(app);
  var Patient = app.models.Patient;
  var PatientFriend = app.models.PatientFriend;
  var Doctor = app.models.Doctor;
  var CaseHistory = app.models.CaseHistory;
  var ServiceOrder = app.models.ServiceOrder;
  var doctorExcludeFields = app.models.doctorExcludeFields;
  var patientExcludeFields = app.models.patientExcludeFields;

  /**
   * GET /api/patients
   * Accept JSON object as filter. Also deal with '*' as wildcard. For example:
   * '*val' means find value end with 'val'.
   * 'val*' means find value start with 'val'.
   * '*val*' means find value contains 'val', include equals.
   * 'val' mean find value equals 'val'.
   * 'va*l', the * in the middle will not be tread as wildcard, means find value equals 'va*l'.
   * @param req
   * @param res
   */
  var find = function (req, res) {
    var filter = {};
    var limit = 10;
    var sort = {created: -1};
    if (req.query.filter) {
      filter = JSON.parse(req.query.filter);
    }
    if (!isNaN(req.query.limit)) {
      limit = Number(req.query.limit);
    }
    if (req.query.sort) {
      sort = JSON.parse(req.query.sort);
    }

    // deal with wildcard in search value.
    for (var key in filter) {
      var value = filter[key];
      if (typeof(value) != 'string') {
        continue;
      }
      if (value == '*') {
        delete filter[key];
      } else if (stringUtils.startWith(value, '*') && stringUtils.endWith(value, '*')) {
        filter[key] = new RegExp(value.substring(1, value.length - 1));
      } else if (stringUtils.startWith(value, '*')) {
        filter[key] = new RegExp(value.substr(1) + '$');
      } else if (stringUtils.endWith(value, '*')) {
        filter[key] = new RegExp('^' + value.substr(0, value.length - 1));
      }
    }

    debug('Finding patients, filter: %o, limit: %d, sort: %o', filter, limit, sort);
    Patient.find(filter).select(patientExcludeFields).limit(limit).sort(sort).exec(function (err, patients) {
      if (err) {
        debug('Find patient error: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.json(utils.jsonResult(patients));
    });
  };

  /**
   * PUT /api/patients/:id
   * @param req
   * @param res
   * @returns {*}
   */
  var save = function (req, res) {
    var patient = req.body;
    var id = req.params.id;
    if (!patient || !id) {
      debug('Update patient, invalid id or data: ', id, patient);
      return res.status(400).json(utils.jsonResult(new Error('Invalid data')));
    }
    // some fields cannot be updated via public api.
    delete patient.password;
    delete patient.wechat;
    delete patient.salt;
    delete patient.level;

    Patient.findByIdAndUpdate(id, patient, {upsert: true, new: true}, function (err, patient) {
      if (err) {
        debug('Update patient error: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      patient = removeNoOutputData(patient);
      res.json(utils.jsonResult(patient));
    });
  };

  /**
   * GET /api/patients/:id/follows?[expand=true]
   * Get doctors list that a patient follows.
   * @param req
   * @param res
   */
  var getFollows = function (req, res) {
    var patientId = req.params.id;
    var expand = req.query.expand;
    debug('getFollows(), patientId: %s, expand: %s.', patientId, expand);
    Patient.findById(patientId, 'doctorFollowed', function (err, patient) {
      if (err) {
        debug('getFollows(), get patient follows failed: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }

      if (!patient) {
        debug('getFollows() error: patient not found, id: %s', patientId);
        return res.status(404).json(utils.jsonResult('Patient not found'));
      }

      if (!patient.doctorFollowed || !patient.doctorFollowed.length)
        patient.doctorFollowed = [];

      if (expand) {
        debug('getFollows(), getting expand info of doctors that followed: %o ', patient.doctorFollowed);
        Doctor.find({'_id': {'$in': patient.doctorFollowed}}, doctorExcludeFields, function (err, doctors) {
          if (err) {
            debug('getFollows(), get patient followed doctors failed: ', err);
            return res.status(500).json(utils.jsonResult(err));
          }
          res.json(utils.jsonResult(doctors));
        });
      } else {
        res.json(utils.jsonResult(patient.doctorFollowed));
      }
    });
  };

  /**
   * POST /api/patients/:id/follows
   * Data: {'doctorId':''}
   * Create follow relationship that a patient follows a doctor.
   * @param req
   * @param res
   */
  var createFollow = function (req, res) {
    var patientId = req.params.id;
    var doctorId = req.body.doctorId;
    debug('Creating follow, patientId: %s, doctorId: %s.', patientId, doctorId);
    Doctor.findById(doctorId, function (err, doctor) {
      if (err) {
        debug('Get doctor which trying to follow failed: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      if (!doctor) {
        debug('Doctor does not exist, id: ', doctorId);
        return res.status(404).json(utils.jsonResult('Doctor not exist'));
      }
      Patient.findByIdAndUpdate(patientId, {'$addToSet': {'doctorFollowed': doctorId}}, function (err, ret) {
        if (err) {
          debug('Create follows failed: ', err);
          return res.status(500).json(utils.jsonResult(err));
        }
        res.status(201).json(utils.jsonResult('success'));
      });
    });
  };

  /**
   * Check patient is followed a doctor or not.
   * GET '/api/patients/:id/follows/:doctorId'
   * @Response: {data: true/false}
   * @param req
   * @param res
   */
  var isFollowed = function (req, res) {
    var patientId = req.params.id;
    var doctorId = req.params.doctorId;
    debug('isFollowed(), patientId: %s, doctorId: %s.', patientId, doctorId);
    Patient.find({'_id': patientId, 'doctorFollowed': doctorId}, function (err, found) {
      if (err) {
        debug('isFollowed(), get follows failed: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      var isFollowed = found.length > 0;
      res.json(utils.jsonResult(isFollowed));
    });
  };

  /**
   * DELETE /api/patients/:id/follows/:followId
   * Delete follow relationship that a patient follows a doctor.
   * @param req
   * @param res
   */
  var deleteFollow = function (req, res) {
    var patientId = req.params.id;
    var doctorId = req.params.doctorId;
    debug('Deleting follow, patientId: %s, doctorId: %s.', patientId, doctorId);
    Patient.findByIdAndUpdate(patientId, {'$pull': {'doctorFollowed': doctorId}}, function (err, ret) {
      if (err) {
        debug('Delete follows failed: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.status(200).json(utils.jsonResult('success'));
    });
  };


  /**
   * POST '/api/patients/:id/friends/requests'
   * Data: {'toPatientId': 'String', 'message': 'String'}
   * @param req
   * @param res
   */
  var createFriendsRequests = function (req, res) {
    var fromPatientId = req.params.id;

    if (!req.body || !req.body['toPatientId']) {
      res.status(400).end();
    } else {
      var toPatientId = req.body['toPatientId'];
      var message = req.body.message;
      debug('createFriendsRequests(), from: %s, to: %s', fromPatientId, toPatientId);
      PatientFriend.find({from: fromPatientId, to: toPatientId}).exec()
        .then(function (existFriendRelationship) {
          if (existFriendRelationship.length > 0) {
            debug('createFriendsRequests(), friend relationship exists, skip creating.');
            throw new Error('friend_relationship_exists');
          } else {
            return Patient.findById(fromPatientId).exec();
          }
        }).then(function (patient) {
          var name = patient.name;
          var openid = patient.wechat.openid;
          var avatar = patient.wechat.headimgurl;
          debug('createFriendsRequests(), found patient name: "%s", openid: %s, of fromId: %s', name, openid, fromPatientId);
          return PatientFriend.create({
            from: fromPatientId,
            fromName: name,
            fromAvatar: avatar,
            fromOpenid: openid,
            to: toPatientId,
            message: message
          });
        }).then(function (createdFriendRequest) {
          debug('createFriendsRequests(), created.');
          res.status(201).json(utils.jsonResult(createdFriendRequest));
        }, function (err) {
          if (err.message !== 'friend_relationship_exists') {
            debug('createFriendsRequests(), error: %o', err);
            res.status(500).json(utils.jsonResult(err));
          } else {
            res.status(409).end();
          }
        });
    }
  };

  /**
   * GET '/api/patients/:id/friends/requests'
   * @param req
   * @param res
   */
  var getFriendsRequests = function (req, res) {
    var id = req.params.id;
    PatientFriend.find({to: id, status: 'requested'}, function (err, requests) {
      if (err) {
        debug('getFriendsRequests(), error:%o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.json(utils.jsonResult(requests));
    })
  };

  /**
   * PUT '/api/patients/friends/requests/:reqId/acceptance'
   * @param req
   * @param res
   */
  var acceptFriendsRequests = function (req, res) {
    var reqId = req.params.reqId;
    PatientFriend.findByIdAndUpdate(reqId, {status: app.consts.friendStatus.accepted}, function (err, ret) {
      if (err) {
        debug('acceptFriendsRequests(), error:%o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.end();
    });
  };

  /**
   * PUT '/api/patients/friends/requests/:reqId/rejection'
   * @param req
   * @param res
   */
  var rejectFriendsRequests = function (req, res) {
    var reqId = req.params.reqId;
    PatientFriend.findByIdAndUpdate(reqId, {status: app.consts.friendStatus.rejected}, function (err, ret) {
      if (err) {
        debug('rejectFriendsRequests(), error:%o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.end();
    });
  };
  /**
   * DELETE '/api/patients/friends/requests/:reqId'
   * @param req
   * @param res
   */
  var deleteFriendsRequests = function (req, res) {
    var reqId = req.params.reqId;
    PatientFriend.remove({_id: reqId}).exec();
    res.end();
  };

  /**
   * GET '/api/patients/friends/:id1/:id2'
   * Response: PatientFriendSchema if exist.
   * @param req
   * @param res
   */
  var getFriendsRequestsBetween2Patients = function (req, res) {
    var id1 = req.params.id1;
    var id2 = req.params.id2;
    PatientFriend.find({from: id1, to: id2}, function (err, found) {
      if (err) {
        debug('getFriendsRequestsBetween2Patients(), get requests error:%o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      if (found.length > 0) {
        res.json(utils.jsonResult(found[0]));
      } else {
        PatientFriend.find({from: id2, to: id1}, function (err, found) {
          if (err) {
            debug('getFriendsRequestsBetween2Patients(), get requests error:%o', err);
            return res.status(500).json(utils.jsonResult(err));
          }
          if (found.length > 0) {
            res.json(utils.jsonResult(found[0]));
          } else {
            res.status(404).end();
          }
        });
      }
    });
  };

  /**
   * GET '/api/patients/:id/friends'
   * @param req
   * @param res
   */
  var getFriends = function (req, res) {
    var id = req.params.id;
    debug('getFriends(), finding friends for id: %s', id);
    PatientFriend.find({'$or': [{from: id}, {to: id}], status: 'accepted'}, function (err, requests) {
      if (err) {
        debug('getFriends(), get accepted requests error:%o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      debug('getFriends(), found accepted requests: %o', requests);
      var ids = [];
      for (var i = 0; i < requests.length; i++) {
        if (requests[i].from == id) {
          ids.push(requests[i].to);
        } else {
          ids.push(requests[i].from);
        }
      }
      debug('getFriends(), parsed friends ids: %o', ids);
      Patient.find({_id: {'$in': ids}}, function (err, patients) {
        if (err) {
          debug('getFriends(), get patients error:%o', err);
          return res.status(500).json(utils.jsonResult(err));
        }
        res.json(utils.jsonResult(patients));
      });
    })
  };

  /**
   * POST '/api/patients/:id/cases'
   * @param req
   * @param res
   */
  var createCase = function (req, res) {
    var openid = req.query.openid; // creator
    var role = req.query.role; // creator
    var patientId = req.params.id;
    var newCase = req.body;
    debug('createCase(), creating case for patient: %s', patientId);

    if (newCase.link && newCase.link.type && app.consts.caseLinkTypes.indexOf(newCase.link.type) == -1) {
      debug('createCase(), invalid link type: %s', newCase.link.type);
      return res.status(400).json(utils.jsonResult(new Error('Invalid link type')));
    }

    if (!newCase.content) {
      debug('createCase(), invalid content: %s', newCase.content);
      return res.status(400).json(utils.jsonResult(new Error('Invalid content')));
    }



    // Get creator by passed in openid
    var creatorUser;
    getUserByOpenid(openid, role, function (err, user) {
      if (err) {
        debug('createCase(), get user error: %o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      creatorUser = user;
      // check creator have privilege to create case or not.
      if (role == app.consts.role.doctor) {
        // doctor create case, check order relationship.
        debug('createCase(), creator is doctor, check if they have order relationship.');
        getOrdersBetweenDoctorAndPatient(user.id, patientId, function (err, orders) {
          if (err) {
            debug('createCase(), get order relationship error:%o', err);
            return res.status(500).json(utils.jsonResult(err));
          }
          if (orders.length > 0) {
            debug('createCase(), doctor and patient has order relationship, create case.');
            createCase();
          } else {
            debug('createCase(), doctor: %s, openid: %s has no privilege to create case for patient: %s.', user.id, openid, patientId);
            res.status(403).json(utils.jsonResult(new Error('No privilege')));
          }
        });
      } else if (user.id == patientId) {
        // patient self
        debug('createCase(), creator is patient self, create case.');
        createCase();
      } else {
        // no privilege.
        debug('createCase(), user: %s, openid: %s has no privilege to create case for patient: %s.', user.id, openid, patientId);
        res.status(403).json(utils.jsonResult(new Error('No privilege')));
      }
    });

    var createCase = function () {
      newCase.creator = {id: creatorUser.id, name: creatorUser.name, role: role};
      newCase.patientId = patientId;
      CaseHistory.create(newCase, function (err, created) {
        if (err) {
          debug('createCase(), create case error: %o', err);
          return res.status(500).json(utils.jsonResult(err));
        }
        res.json(utils.jsonResult(created));
      });
    };
  };

  /**
   * GET '/api/patients/:id/cases'
   * @param req
   * @param res
   */
  var getCases = function (req, res) {
    var openid = req.query.openid; // creator
    var role = req.query.role; // creator
    var patientId = req.params.id;
    getUserByOpenid(openid, role, function (err, user) {
      if (err) {
        debug('getCases(), get user error: %o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      if (user.id == patientId) {
        getCasesData();
      } else if (role == app.consts.role.doctor) {
        getOrdersBetweenDoctorAndPatient(user.id, patientId, function (err, orders) {
          if (err) {
            debug('getCases(), get order relationship error: %o', err);
            return res.status(500).json(utils.jsonResult(err));
          }
          if (orders.length > 0) {
            debug('getCases(), doctor and patient has order relationship, get case.');
            getCasesData();
          } else {
            debug('getCases(), doctor: %s, openid: %s has no privilege to get case for patient: %s.', user.id, openid, patientId);
            res.status(403).json(utils.jsonResult(new Error('No privilege')));
          }
        })
      } else if (role == app.consts.role.patient) {
        getPatientFriendRelations(user.id, patientId, function (err, friends) {
          if (err) {
            debug('getCases(), get friend relationship error: %o', err);
            return res.status(500).json(utils.jsonResult(err));
          }
          if (friends.length > 0) {
            debug('getCases(), patient and patient has friend relationship, get case.');
            getCasesData();
          } else {
            debug('getCases(), patient: %s, openid: %s has no privilege to get case for patient: %s.', user.id, openid, patientId);
            res.status(403).json(utils.jsonResult(new Error('No privilege')));
          }
        });
      }
    });

    var getCasesData = function () {
      CaseHistory.find({patientId: patientId}, function (err, cases) {
        if (err) {
          debug('getCases(), get cases error: %o', err);
          return res.status(500).json(utils.jsonResult(err));
        }
        res.json(utils.jsonResult(cases));
      });
    }
  };

  /**
   * DELETE '/api/patients/:id/cases/:caseId'
   * @param req
   * @param res
   */
  var deleteCase = function (req, res) {

  };

  /**
   * POST '/api/patients/:id/case/:caseId/comments'
   * @param req
   * @param res
   */
  var createCaseComment = function (req, res) {

  };

  /**
   * DELETE 'api/patients/:id/case/:caseId/comments/commentId'
   * @param req
   * @param res
   */
  var deleteCaseComment = function (req, res) {

  };

  var getUserByOpenid = function (openid, role, callback) {
    if (role == app.consts.role.doctor) {
      var queryPromise = Doctor.findOne({'wechat.openid': openid}).exec();
    } else if (role == app.consts.role.patient) {
      var queryPromise = Patient.findOne({'wechat.openid': openid}).exec();
    } else {
      debug('createCase(), invalid role: %s', role);
      callback(new Error('Invalid role'));
    }
    if (callback) {
      queryPromise.then(function (user) {
        callback(null, user);
      }, function (err) {
        callback(err);
      })
    } else {
      return queryPromise;
    }
  };

  var getOrdersBetweenDoctorAndPatient = function (doctorId, patientId, callback) {
    var query = ServiceOrder.find({doctorId: doctorId, patientId: patientId});
    if (callback) {
      query.exec(callback);
    } else {
      // return a promise.
      return query.exec();
    }
  };

  var getPatientFriendRelations = function (patientId, patientId2, callback) {
    var PatientFriend = app.models.PatientFriend;
    var query = PatientFriend.find({
      "$or": [{
        from: patientId,
        to: patientId2,
        status: app.consts.friendStatus.accepted
      }, {
        from: patientId2,
        to: patientId,
        status: app.consts.friendStatus.accepted
      }]
    });
    if (callback) {
      query.exec(callback);
    } else {
      return query.exec();
    }
  };

  /**
   * Remove some data not tend to expose to user.
   * @param patient
   */
  var removeNoOutputData = function (patient) {
    var ret = patient.toObject();
    delete ret.password;
    delete ret.salt;
    delete ret.wechat.unionid;
    delete ret.wechat.groupid;
    return ret;
  };

  return {
    find: find,
    save: save,
    getFollows: getFollows,
    createFollow: createFollow,
    isFollowed: isFollowed,
    deleteFollow: deleteFollow,
    createFriendsRequests: createFriendsRequests,
    getFriendsRequests: getFriendsRequests,
    acceptFriendsRequests: acceptFriendsRequests,
    rejectFriendsRequests: rejectFriendsRequests,
    deleteFriendsRequests: deleteFriendsRequests,
    getFriendsRequestsStatus: getFriendsRequestsBetween2Patients,
    getFriends: getFriends,
    createCase: createCase,
    getCases: getCases,
    deleteCase: deleteCase,
    createCaseComment: createCaseComment,
    deleteCaseComment: deleteCaseComment
  };
};

