/**
 * Created by Ting on 2015/7/23.
 */

var debug = require('debug')('ylb.patientCtrl');
var utils = require('../middleware/utils');
var stringUtils = require('../utils/string-utils');
var fs = require('fs');
var mkdirp = require('mkdirp');

module.exports = function (app, api) {
  var authUtils = require('../utils/auth-utils')(app);
  var Patient = app.models.Patient;
  var PatientFriend = app.models.PatientFriend;
  var Doctor = app.models.Doctor;
  var CaseHistory = app.models.CaseHistory;
  var ServiceOrder = app.models.ServiceOrder;
  var DPRelation = app.models.DoctorPatientRelation;
  var Comment = app.models.Comment;
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
   * GET /api/patients/:id
   * @param req
   * @param res
   */
  var getPatient = function (req, res) {
    var id = req.params.id;
    Patient.findById(id).select(patientExcludeFields).exec(function (err, patient) {
      if (err) {
        debug('Get patient error: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.json(utils.jsonResult(patient));
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
  //var getFollows = function (req, res) {
  //  var patientId = req.params.id;
  //  var expand = req.query.expand;
  //  var openid = req.query.openid; // operator
  //  var role = req.query.role; // operator
  //  debug('getFollows(), patientId: %s, expand: %s.', patientId, expand);
  //
  //  checkRelationshipWithPatient(patientId, openid, role, function (err, isSelf, isFriend, hasOrder, opUser) {
  //    if (err) {
  //      return res.status(500).json(utils.jsonResult(err));
  //    }
  //    if (isSelf) {
  //      doGetFollows(opUser);
  //    } else {
  //      return res.status(403).json(utils.jsonResult(new Error('no privilege')));
  //    }
  //  });
  //
  //  var doGetFollows = function () {
  //    Patient.findById(patientId, 'doctorFollowed', function (err, patient) {
  //      if (err) {
  //        debug('getFollows(), get patient follows failed: ', err);
  //        return res.status(500).json(utils.jsonResult(err));
  //      }
  //
  //      if (!patient) {
  //        debug('getFollows() error: patient not found, id: %s', patientId);
  //        return res.status(404).json(utils.jsonResult('Patient not found'));
  //      }
  //
  //      if (!patient.doctorFollowed || !patient.doctorFollowed.length)
  //        patient.doctorFollowed = [];
  //
  //      if (expand) {
  //        debug('getFollows(), getting expand info of doctors that followed: %o ', patient.doctorFollowed);
  //        Doctor.find({'_id': {'$in': patient.doctorFollowed}}, doctorExcludeFields, function (err, doctors) {
  //          if (err) {
  //            debug('getFollows(), get patient followed doctors failed: ', err);
  //            return res.status(500).json(utils.jsonResult(err));
  //          }
  //          res.json(utils.jsonResult(handleDoctorOrder(doctors, patient.doctorFollowed)));
  //        });
  //      } else {
  //        res.json(utils.jsonResult(patient.doctorFollowed));
  //      }
  //    });
  //  }
  //};

  /**
   * Comment method to find doctor and patient information to generate a base DoctorPatientRelation document.
   * @param patientId
   * @param doctorId
   * @param callback
   */
  var generateNewRelationObject = function (patientId, doctorId, callback) {
    var newDpr = {};
    debug('generateNewRelationObject(), getting doctor info: %s', doctorId);
    Doctor.findById(doctorId).exec()
      .then(function (doctor) {
        if (!doctor) {
          debug('generateNewRelationObject(), doctor does not exist: %s', doctorId);
          throw new Error('doctor not exist');
        }
        newDpr.doctor = {id: doctor.id, name: doctor.name, avatar: doctor.wechat.headimgurl, hospital: doctor.hospital};
        debug('generateNewRelationObject(), getting patient info: %s', patientId);
        return Patient.findById(patientId).exec();
      }).then(function (patient) {
        if (!patient) {
          debug('generateNewRelationObject(), patient does not exist: %s', patientId);
          throw new Error('patient not exist');
        }
        newDpr.patient = {id: patient.id, name: patient.name, avatar: patient.wechat.headimgurl};
        debug('generateNewRelationObject(), generated new relation: %o', newDpr);
        callback(null, newDpr);
      }).then(null, function (err) {
        callback(err);
      });
  };
  /**
   * POST /api/relations/normal
   * Data: {'doctorId':'', 'patientId': ''}
   * Create normal relationship that a patient follows a doctor.
   *
   * 患者关注医生：
   * - 如果没有关系存在，创建新的关系，状态为普通。
   * - 如果已有关系存在，保持状态不变。
   * @param req
   * @param res
   */
  var createFollow = function (req, res) {
    var reqDpr = req.body;
    var patientId = reqDpr.patientId;
    var doctorId = reqDpr.doctorId;
    debug('createFollow(), receive create follow request, patientId: %s, doctorId: %s.', patientId, doctorId);
    if (!patientId || !doctorId) {
      return utils.handleError(new Error('invalid data'), 'createFollow()', debug, res, 400);
    }
    debug('createFollow(), checking current relation...');
    DPRelation.find({'patient.id': patientId, 'doctor.id': doctorId}, function (err, relation) {
      if (err) return utils.handleError(err, 'createFollow()', debug, res);
      if (relation.length == 0) {
        debug('createFollow(), no relation exist, creating a new one.');
        generateNewRelationObject(patientId, doctorId, doCreateFollow);
      } else {
        debug('createFollow(), skip create since relation exists: %s', relation.status);
        res.json(utils.jsonResult(relation));
      }
    });

    var doCreateFollow = function (err, newDpr) {
      if (err) return utils.handleError(err, 'doCreateFollow()', debug, res);
      newDpr.memo = reqDpr.memo;
      newDpr.status = app.consts.relationStatus.putong.value;
      debug('createFollow(), doCreateFollow(), saving to db.');
      DPRelation.create(newDpr, function (err, created) {
        if (err) return utils.handleError(err, 'doCreateFollow()', debug, res);
        res.json(utils.jsonResult(created));
      })
    }
  };

  /**
   * GET '/api/relations/doctor/:doctorId/patient/:patientId'
   * Get relation between patient and doctor.
   * @Response: {DoctorPatientRelation}
   * @param req
   * @param res
   */
  var getRelation = function (req, res) {
    var patientId = req.params.patientId;
    var doctorId = req.params.doctorId;
    var role = req.query.role;
    var openid = req.query.openid;
    debug('getRelation(), patientId: %s, doctorId: %s.', patientId, doctorId);

    var _relation;
    DPRelation.find({'doctor.id': doctorId, 'patient.id': patientId}).exec()
      .then(function (relation) {
        if (relation.length == 0) {
          debug('getRelation(), relation not exist.');
          res.json(utils.jsonResult(null));
          throw new Error('responded');
        }
        _relation = relation[0];
        if (!_relation.doctor || !_relation.patient) {
          debug('getRelation(), invalid relation data: %o', _relation);
          throw new Error('invalid relation data');
        }
        debug('getRelation(), get current operation user, role: %s, openid: %s', role, openid);
        return utils.getUserByOpenid(openid, role);
      }).then(function (user) {
        if (!user) {
          debug('getRelation(), operate user not exist.');
          throw new Error('user not found');
        }
        if (user.id != _relation.doctor.id && user.id != _relation.patient.id) {
          debug('getRelation(), user: %s no privilege to delete relation: %s', user.id, _relation._id);
          return utils.response403(res);
        }
        debug('getRelation(), pass privilege check, return relation.');
        res.json(utils.jsonResult(_relation));
      }).then(null, function (err) {
        utils.handleError(err, 'getRelation()', debug, res);
      });
  };

  /**
   * DELETE /api/relations/normal/:relationId
   * Delete normal relationship that a patient follows a doctor.
   *
   * Only patient can delete his follow relation.
   * @param req
   * @param res
   */
  var deleteFollow = function (req, res) {
    var relationId = req.params.relationId;
    var role = req.query.role;
    var openid = req.query.openid;

    debug('deleteFollow(), receive request to delete normal relation: %s', relationId);
    if (role != app.consts.role.patient) {
      debug('deleteFollow(), only patient can delete normal relation.');
      return res.status(403).json(utils.jsonResult(new Error('no privilege')));
    }
    var _relation;
    DPRelation.findById(relationId).exec()
      .then(function (relation) {
        if (!relation) {
          debug('deleteFollow(), no relation found, response success.');
          res.json(utils.jsonResult('success'));
          throw new Error('responded');
        }
        if (relation.status != app.consts.relationStatus.putong.value) {
          debug('deleteFollow(), cannot delete relation of status: %s', relation.status);
          res.status(500).json(utils.jsonResult(new Error('invalid relation status')));
          throw new Error('responded');
        }
        _relation = relation;
        return utils.getUserByOpenid(openid, role);
      }).then(function (patient) {
        if (patient.id != _relation.patient.id) {
          debug('deleteFollow(), patient only can delete own relation.');
          res.status(403).json(utils.jsonResult(new Error('no privilege')));
          throw new Error('responded');
        }
        return patient.remove();
      }).then(function (removed) {
        debug('deleteFollow(), delete normal relation success: %s', relationId);
        res.json(utils.jsonResult('success'));
      }).then(null, function (err) {
        utils.handleError(err, 'deleteFollow()', debug, res);
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
   * GET '/api/patients/:id/doctors'
   * Get the doctors those have relations with the given patient.
   * @param req
   * @param res
   */
  var getDoctorRelations = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var patientId = req.params.id;

    debug('getDoctorRelations(), receive request to get doctors of patient: %s', patientId);
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (user.id != patientId) {
          debug('getDoctorRelations(), currently only support get own relations. operate user is %s, ', user.id);
          throw utils.response403(res);
        }
        return DPRelation.find({'patient.id': patientId}).sort({created: -1}).exec();
      }).then(function (relations) {
        res.json(utils.jsonResult(relations));
      }).then(null, function (err) {
        utils.handleError(err, 'getDoctorRelations()', debug, res);
      });

    //checkRelationshipWithPatient(patientId, openid, role, function (err, isSelf, isFriend, hasOrder, opUser) {
    //  if (err) {
    //    res.status(500).json(utils.jsonResult(err));
    //  } else {
    //    if (isSelf) {
    //      doGetDoctors(opUser);
    //    } else {
    //      res.status(403).json(utils.jsonResult(err));
    //    }
    //  }
    //});
    //
    //var doGetDoctors = function (patient) {
    //  var doctorInService = patient.doctorInService;
    //  var doctorPast = patient.doctorPast;
    //  var ret = {doctorInService: [], doctorPast: []};
    //  Doctor.find({'_id': {'$in': doctorInService}}).select(doctorExcludeFields).exec()
    //    .then(function (doctors) {
    //      ret.doctorInService = handleDoctorOrder(doctors, doctorInService);
    //      return Doctor.find({_id: {'$in': doctorPast}}).select(doctorExcludeFields).exec();
    //    }).then(function (doctors) {
    //      ret.doctorPast = handleDoctorOrder(doctors, doctorPast);
    //      res.json(utils.jsonResult(ret));
    //    }).then(null, function (err) {
    //      utils.handleError(err, 'getDoctors()', debug, res);
    //    });
    //};
  };

  /**
   * Get all doctors those have relations with the given patient.
   * Response: List of Doctor.
   *
   * GET '/api/patients/:id/doctors'
   * @param req
   * @param res
   */
  var getDoctors = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var patientId = req.params.id;

    debug('getDoctors(), receive request to get doctors of patient: %s', patientId);
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (user.id != patientId) {
          debug('getDoctors(), currently only support get own relations. operate user is %s, ', user.id);
          throw utils.response403(res);
        }
        return DPRelation.find({'patient.id': patientId}).sort({created: -1}).exec();
      }).then(function (relations) {
        var doctorIds = [];
        for (var i = 0; i < relations.length; i++) {
          doctorIds.push(relations[i].doctor.id);
        }
        return Doctor.find({'_id': {'$in': doctorIds}}).select(doctorExcludeFields + ' -wechat').exec();
      }).then(function (doctors) {
        res.json(utils.jsonResult(doctors));
      }).then(null, function (err) {
        utils.handleError(err, 'getDoctors()', debug, res);
      });
  };

  // use '$in' to find doctors return order is not as we want, need reorder them.
  var handleDoctorOrder = function (doctors, idsInOrderWillBeReversed) {
    var ret = [];
    for (var i in idsInOrderWillBeReversed) {
      for (var j in doctors) {
        if (idsInOrderWillBeReversed[i] == doctors[j].id) {
          // the order of 'doctorInService' and 'doctorPast' is reversed, so use unshift instead of push.
          ret.unshift(doctors[j]);
          break;
        }
      }
    }
    return ret;
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

    var validTypes = Object.keys(app.consts.caseLinkTypes);
    if (newCase.link && newCase.link.linkType && validTypes.indexOf(newCase.link.linkType) == -1) {
      debug('createCase(), invalid link type: %s', newCase.link.linkType);
      return res.status(400).json(utils.jsonResult(new Error('Invalid link type')));
    }

    if (!newCase.content && !newCase.link) {
      debug('createCase(), invalid content: %s', newCase.content);
      return res.status(400).json(utils.jsonResult(new Error('Invalid content')));
    }

    checkRelationshipWithPatient(patientId, openid, role, function (err, isSelf, isFriend, hasRelation, creatorUser) {
      if (err) {
        res.status(500).json(utils.jsonResult(err));
      } else {
        if (isSelf || hasRelation) {
          createCase(creatorUser);
        } else {
          res.status(403).json(utils.jsonResult(err));
        }
      }
    });

    var createCase = function (creatorUser) {
      newCase.creator = {id: creatorUser.id, name: creatorUser.name, avatar: creatorUser.wechat.headimgurl, role: role};
      newCase.patientId = patientId;
      var createdCaseId;
      CaseHistory.create(newCase, function (err, created) {
        if (err) {
          debug('createCase(), create case error: %o', err);
          return res.status(500).json(utils.jsonResult(err));
        }
        createdCaseId = created.id;
        res.json(utils.jsonResult(created));
      });
      // download image from wechat server and replace link.
      if (newCase.link && newCase.link.linkType == app.consts.caseLinkTypes.image) {
        var mediaId = newCase.link.target;
        debug('createCase(), downloading image from wechat server, mediaId: %s', mediaId);
        api.getMedia(mediaId, function (err, result, header) {
          if (err) {
            debug('createCase(), get media from wechat server error: %o', err);
            //TODO: if do not throw this error to user, need consider retry or error handler.
            return;
          }
          // generate local file name.
          var fileName;
          if (header.headers['content-disposition']) {
            var tmpArr = header.headers['content-disposition'].split('filename="');
            if (tmpArr.length > 1) {
              fileName = tmpArr[1].substr(0, tmpArr[1].length - 1);
            }
          } else {
            var tmpArr = header.headers['content-type'].split('/');
            fileName = mediaId + '.' + tmpArr[1];
          }
          var fileLink = '/upload/' + creatorUser.id + '/';
          var path = __dirname + '/../..' + fileLink;
          fs.exists(path, function (exist) {
            if (!exist) {
              mkdirp.sync(path);
            }

            var filePath = path + fileName;
            fileLink += fileName;
            debug('createCase(), writing download file to %s', filePath);
            fs.writeFile(filePath, result, function (err) {
              if (err) {
                debug('createCase(), save media file error: %o', err);
                //TODO: error handler
                return;
              }
              debug('createCase(), updating case data.');
              CaseHistory.findOneAndUpdate({'_id': createdCaseId}, {
                'link.target': fileLink,
                'link.avatar': fileLink
              }, function (err, result) {
                if (err) {
                  debug('createCase(), update image link failed: %o', err);
                  return;
                }
                debug('createCase(), update image link success: %o', result);
              });
            });
          });
        });
      }
    };
  };

  /**
   * GET '/api/patients/:id/cases/postPrivilege'
   * Check current user (openid) has privilege to create case for the patient or not.
   * Response: 403, 200
   * @param req
   * @param res
   */
  var getCasesPostPrivilege = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var patientId = req.params.id;
    checkRelationshipWithPatient(patientId, openid, role, function (err, isSelf, isFriend, hasRelation, opUser) {
      if (err) {
        res.status(500).json(utils.jsonResult(err));
      } else {
        if (isSelf || hasRelation) {
          res.json('ok');
        } else {
          res.status(403).json(utils.jsonResult(err));
        }
      }
    });
  };

  /**
   * GET '/api/patients/:id/cases/viewPrivilege'
   * Check current user (openid) has privilege to view cases for the patient or not.
   * Response: 403, 200
   * @param req
   * @param res
   */
  var getCasesViewPrivilege = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var patientId = req.params.id;
    checkRelationshipWithPatient(patientId, openid, role, function (err, isSelf, isFriend, hasRelation, opUser) {
      if (err) {
        res.status(500).json(utils.jsonResult(err));
      } else {
        if (isSelf || isFriend || hasRelation) {
          res.json('ok');
        } else {
          res.status(403).json(utils.jsonResult(err));
        }
      }
    });
  };

  /**
   * GET '/api/patients/:id/cases'
   * @param req
   * @param res
   */
  var getCases = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var patientId = req.params.id;

    checkRelationshipWithPatient(patientId, openid, role, function (err, isSelf, isFriend, hasRelation, opUser) {
      if (err) {
        res.status(500).json(utils.jsonResult(err));
      } else {
        if (isSelf || isFriend || hasRelation) {
          getCasesData();
        } else {
          res.status(403).json(utils.jsonResult(err));
        }
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
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var patientId = req.params.id;
    var caseId = req.params.caseId;

    checkRelationshipWithPatient(patientId, openid, role, function (err, isSelf, isFriend, hasRelation, opUser) {
      if (err) {
        res.status(500).json(utils.jsonResult(err));
      } else {
        CaseHistory.findById(caseId, function (err, theCase) {
          if (err) {
            debug('deleteCase(), get case error: %o', err);
            return res.status(500).json(utils.jsonResult(err));
          }
          if (!theCase) {
            debug('deleteCase(), the case %s is not found', caseId);
            return res.status(404).json(utils.jsonResult(new Error('not found')));
          }
          if (isSelf || theCase.creator.id == opUser.id) {
            CaseHistory.remove({_id: caseId}, function (err, ret) {
              if (err) {
                debug('deleteCase(), remove case error: %o', err);
                return res.status(500).json(utils.jsonResult(err));
              }
              res.json('success');
            });
          } else {
            res.status(403).json(utils.jsonResult(err));
          }
        });
      }
    });
  };

  /**
   * GET '/api/patients/:id/friends/cases'
   * Get all friends cases of given patient.
   * @param req
   * @param res
   */
  var getFriendCases = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var patientId = req.params.id;
    debug('getFriendCases(), receive request to get friends cases of patient: %s', patientId);
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (!user) {
          throw utils.responseOpUserNotFound(res, debug, openid, role);
        }
        if (user.id != patientId) {
          debug('getFriendCases(), currently only support get own patients data. operate patient is %s, ', user.id);
          throw utils.response403(res);
        }
        return PatientFriend.find({
          '$or': [{from: patientId}, {to: patientId}],
          status: app.consts.friendStatus.accepted
        }).exec();
      }).then(function (friends) {
        debug('getFriendCases(), found %d patient friends.', friends.length);
        var patientIds = [];
        for (var i = 0; i < friends.length; i++) {
          var f = friends[i];
          if (f.from == patientId) {
            patientIds.push(f.to);
          } else {
            patientIds.push(f.from);
          }
        }

        // construct query.
        var query = CaseHistory.find({
          patientId: {'$in': patientIds}
        }).sort({created: -1});
        if (req.query.createdBefore) {
          query.lt('created', new Date(req.query.createdBefore));
        }
        var limit = 20;
        if (!isNaN(req.query.limit)) {
          limit = Number(req.query.limit);
        }
        query.limit(limit);
        return query.exec();
      }).then(function (cases) {
        debug('getFriendCases(), found %d cases.', cases.length);
        res.json(utils.jsonResult(cases));
      }).then(null, function (err) {
        utils.handleError(err, 'getFriendCases()', debug, res);
      });
  };

  /**
   * POST '/api/patients/:id/cases/:caseId/comments'
   * @param req
   * @param res
   */
  var createCaseComment = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var patientId = req.params.id;
    var caseId = req.params.caseId;
    var newComment = req.body;

    checkRelationshipWithPatient(patientId, openid, role, function (err, isSelf, isFriend, hasRelation, opUser) {
      if (err) {
        res.status(500).json(utils.jsonResult(err));
      } else {
        if (isSelf || isFriend || hasRelation) {
          createComment(opUser);
        } else {
          res.status(403).json(utils.jsonResult(err));
        }
      }
    });

    var createComment = function (opUser) {
      CaseHistory.findById(caseId, function (err, theCase) {
        if (err) return handleError(err, 'createCaseComment', res);

        if (!theCase) {
          debug('createCaseComment(), the case of id: %s not found.', caseId);
          return res.status(404).json(utils.jsonResult(new Error('not found')));
        }

        newComment.creator = {id: opUser.id, name: opUser.name, avatar: opUser.wechat.headimgurl, role: role};
        theCase.comments.push(newComment);
        theCase.save(function (err) {
          if (err) return handleError(err, 'createCaseComment', res);
          res.json(utils.jsonResult(theCase));
        });
      });
    }
  };

  /**
   * DELETE 'api/patients/:id/cases/:caseId/comments/:commentId'
   * @param req
   * @param res
   */
  var deleteCaseComment = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var patientId = req.params.id;
    var caseId = req.params.caseId;
    var commentId = req.params.commentId;

    checkRelationshipWithPatient(patientId, openid, role, function (err, isSelf, isFriend, hasRelation, opUser) {
      if (err) {
        res.status(500).json(utils.jsonResult(err));
      } else {
        deleteComment(opUser);
      }
    });

    var deleteComment = function (opUser) {
      CaseHistory.findById(caseId, function (err, theCase) {
        if (err) return handleError(err, 'deleteCaseComment', res);

        if (!theCase) {
          debug('deleteCaseComment(), the case of id: %s not found.', caseId);
          return res.status(404).json(utils.jsonResult(new Error('not found')));
        }

        var comment = theCase.comments.id(commentId);
        if (comment.creator.id != opUser.id) {
          debug('deleteCaseComment(), cannot delete comment created by others. comment creator: %s, opUser: %s', comment.creator.id, opUser.id);
          return res.status(403).json(utils.jsonResult(new Error('no privilege')));
        }

        comment.remove();
        theCase.save(function (err) {
          if (err) return handleError(err, 'deleteCaseComment', res);
          res.json(utils.jsonResult(theCase));
        });
      });
    }
  };

  /**
   * Get operate user by given 'openid' and 'role', then check the user (maybe doctor or patient) with the
   * target patient, is his self? is patient friend? or is doctor who has orders?
   *
   * And system error occurred, will trigger callback with only one parameter 'err'. Otherwise, will trigger
   * callback with all the flags of relationships.
   * @param patientId
   * @param operatorOpenId
   * @param operatorRole
   * @param callback
   */
  var checkRelationshipWithPatient = function (patientId, operatorOpenId, operatorRole, callback) {
    var isSelf = false;
    var isFriend = false;
    var hasRelation = false;
    var error = null;
    var operationUser;
    if (operatorRole != app.consts.role.doctor && operatorRole != app.consts.role.patient) {
      // wrong role
      debug('checkRelationship(), invalid role: %s', operatorRole);
      return callback(new Error('Invalid role'));
    }
    utils.getUserByOpenid(operatorOpenId, operatorRole)
      .then(function (user) {
        if (!user) {
          debug('checkRelationship(), user not found openid: %s, role: %s', operatorOpenId, operatorRole);
          error = new Error('user not found');
        } else {
          operationUser = user;
          if (operatorRole == app.consts.role.doctor) {
            // doctor, check order relationship.
            debug('checkRelationship(), operator is doctor, check if they have order relationship.');
            return getRelationBetweenDoctorAndPatient(user.id, patientId);
          } else if (operatorRole == app.consts.role.patient) {
            if (user.id == patientId) {
              // patient self
              debug('checkRelationship(), operator is patient self.');
              isSelf = true;
            } else {
              return getPatientFriendRelations(user.id, patientId);
            }
          }
        }
      }).then(function (data) {
        if (data instanceof Array) {
          if (operatorRole == app.consts.role.doctor) {
            // relations
            if (data.length > 0) {
              debug('checkRelationship(), doctor and patient has order relationship.');
              hasRelation = true;
            } else {
              debug('checkRelationship(), doctor: %s, openid: %s has no orders with patient: %s.', operationUser.id, operatorOpenId, patientId);
              error = new Error('No privilege');
            }
          } else {
            if (data.length > 0) {
              debug('checkRelationship(), patient and patient has friend relationship.');
              isFriend = true;
            } else {
              debug('checkRelationship(), patient: %s, openid: %s has no orders with patient: %s.', operationUser.id, operatorOpenId, patientId);
              error = new Error('No privilege');
            }
          }
        }
        callback(error, isSelf, isFriend, hasRelation, operationUser);
      }).then(null, function (err) {
        if (err) {
          debug('checkRelationship(), get error: %o', err);
          callback(err);
        }
      });
  };

  var getRelationBetweenDoctorAndPatient = function (doctorId, patientId, callback) {
    var query = DPRelation.find({'doctor.id': doctorId, 'patient.id': patientId});
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

  var handleError = function (err, method, res) {
    debug('%s(), get error: %o', method, err);
    return res.status(500).json(utils.jsonResult(err));
  };

  return {
    find: find,
    getPatient: getPatient,
    save: save,
    //getFollows: getFollows,
    createFollow: createFollow,
    getRelation: getRelation,
    deleteFollow: deleteFollow,
    createFriendsRequests: createFriendsRequests,
    getFriendsRequests: getFriendsRequests,
    acceptFriendsRequests: acceptFriendsRequests,
    rejectFriendsRequests: rejectFriendsRequests,
    deleteFriendsRequests: deleteFriendsRequests,
    getFriendsRequestsStatus: getFriendsRequestsBetween2Patients,
    getFriends: getFriends,
    getDoctorRelations: getDoctorRelations,
    getDoctors: getDoctors,
    createCase: createCase,
    getCases: getCases,
    deleteCase: deleteCase,
    getFriendCases: getFriendCases,
    createCaseComment: createCaseComment,
    deleteCaseComment: deleteCaseComment,
    getCasesPostPrivilege: getCasesPostPrivilege,
    getCasesViewPrivilege: getCasesViewPrivilege
  };
};

