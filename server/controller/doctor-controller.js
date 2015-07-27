/**
 * Created by Ting on 2015/7/17.
 */

var sha512 = require('crypto-js/sha512');
var debug = require('debug')('ylb.doctorCtrl');
var utils = require('../middleware/utils');
var stringUtils = require('../utils/string-utils');

module.exports = function (app) {
  var Doctor = app.models.Doctor;
  var DoctorFriend = app.models.DoctorFriend;
  var excludeFields = app.models.doctorExcludeFields;

  var login = function (req, res) {
    var loginUser = req.body;
    if (typeof(loginUser) == 'object' && loginUser.mobile && loginUser.password) {
      Doctor.findOne({'mobile': loginUser.mobile}, function (err, user) {
        if (err) {
          debug('Find user error: ', err);
          return res.status(500).json(utils.jsonResult(err));
        }
        if (user) {
          var hashedPassword = sha512(user.salt + loginUser.password);
          if (user.password == hashedPassword) {
            var returnUser = user.toObject();
            delete returnUser.password;
            delete returnUser.salt;
            res.json(utils.jsonResult(returnUser));
          } else {
            res.status(401).json(utils.jsonResult(new Error('Login failed.')));
          }
        } else {
          res.status(401).json(utils.jsonResult(new Error('Login failed.')));
        }
      });
    } else {
      res.status(400).json(utils.jsonResult('Invalid request data'));
    }
  };

  /**
   * Accept JSON object as filter. Also deal with '*' as wildcard. For example:
   * '*val' means find value end with 'val'.
   * 'val*' means find value start with 'val'.
   * '*val*' means find value contains 'val', include equals.
   * 'val' mean find value equals 'val'.
   * 'va*l', the * in the middle will not be tread as wildcard, means find value equals 'va*l'.
   * @param req
   * @param res
   */
  var findDoctors = function (req, res) {
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

    debug('Finding doctors, filter: %o, limit: %d, sort: %o', filter, limit, sort);
    Doctor.find(filter).select(excludeFields).limit(limit).sort(sort).exec(function (err, doctors) {
      if (err) {
        debug('Find doctor error: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.json(utils.jsonResult(doctors));
    });
  };

  /**
   * POST /api/doctors
   * @param req
   * @param res
   */
  var createDoctor = function (req, res) {
    //TODO: check authorization.
    Doctor.find({}, 'number').limit(1).sort({'number': -1}).exec(function (err, maxNumberDoctor) {
      if (err) return debug('Get max doctor number error: ', err);
      var doctor = new Doctor(req.body);
      doctor.salt = Math.round((new Date().valueOf() * Math.random()));
      doctor.password = sha512(doctor.salt + doctor.password);
      doctor.number = maxNumberDoctor.length > 0 ? maxNumberDoctor[0].number + 1 : 1;
      doctor.save(function (err, data) {
        if (err) {
          debug('Save doctor error: ', err);
          if (err.code == 11000) // duplicate key
            return res.status(409).json(utils.jsonResult(err));
          else
            return res.status(500).json(utils.jsonResult(err));
        }
        debug('Save doctor success: ', err);
        var retData = removeNoOutputData(data);
        res.status(201).json(utils.jsonResult(retData));
      });
    });
  };

  /**
   * PUT /api/doctors/:id
   * @param req
   * @param res
   * @returns {*}
   */
  var saveDoctor = function (req, res) {
    var doctor = req.body;
    var doctorId = req.params.id;
    if (!doctor || !doctorId) {
      debug('Update doctor, invalid id or data: ', doctorId, doctor);
      return res.status(400).json(utils.jsonResult(new Error('Invalid data')));
    }
    // some fields cannot be updated via public api.
    delete doctor.password;
    delete doctor.wechat;
    delete doctor.salt;
    delete doctor.level;

    //Doctor.findById(doctorId, function (err, doctor) {
    //  if (err) {
    //    debug('Get doctor %s error: %o', doctorId, err);
    //    return res.status(500).json(utils.jsonResult(err));
    //  }
    //  if (!doctor) {
    //    debug('Get doctor %s not found.', doctorId);
    //    return res.status(404).json(utils.jsonResult('Doctor not found.'));
    //  }
    //
    //
    //  doctor.save(function (err) {
    //    if (err) return handleError(err);
    //    res.json(utils.jsonResult(doctor));
    //  });
    //});
    Doctor.findByIdAndUpdate(doctorId, doctor, {upsert: true, new: true}, function (err, doctor) {
      if (err) {
        debug('Update doctor error: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      doctor = removeNoOutputData(doctor);
      res.json(utils.jsonResult(doctor));
    });
  };

  /**
   * POST '/api/doctors/:id/friends/requests'
   * Data: {'toDoctorId': 'String', 'message': 'String'}
   * @param req
   * @param res
   */
  var createFriendsRequests = function (req, res) {
    var fromDoctorId = req.params.id;

    if (!req.body || !req.body['toDoctorId']) {
      res.status(400).end();
    } else {
      var toDoctorId = req.body['toDoctorId'];
      var message = req.body.message;
      debug('createFriendsRequests(), from: %s, to: %s', fromDoctorId, toDoctorId);
      DoctorFriend.find({from: fromDoctorId, to: toDoctorId}).exec()
        .then(function (existFriendRelationship) {
          if (existFriendRelationship.length > 0) {
            debug('createFriendsRequests(), friend relationship exists, skip creating.');
            throw new Error('friend_relationship_exists');
          } else {
            return Doctor.findById(fromDoctorId).exec();
          }
        }).then(function (doctor) {
          var doctorName = doctor.name;
          var doctorOpenid = doctor.wechat.openid;
          var doctorAvatar = doctor.wechat.headimgurl;
          debug('createFriendsRequests(), found doctor name: "%s", openid: %s, of fromId: %s', doctorName, doctorOpenid, fromDoctorId);
          return DoctorFriend.create({
            from: fromDoctorId,
            fromName: doctorName,
            fromAvatar: doctorAvatar,
            fromOpenid: doctorOpenid,
            to: toDoctorId,
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
   * GET '/api/doctors/:id/friends/requests'
   * @param req
   * @param res
   */
  var getFriendsRequests = function (req, res) {
    var id = req.params.id;
    DoctorFriend.find({to: id, status: 'requested'}, function (err, requests) {
      if (err) {
        debug('getFriendsRequests(), error:%o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.json(utils.jsonResult(requests));
    })
  };

  /**
   * PUT '/api/doctors/friends/requests/:reqId/acceptance'
   * @param req
   * @param res
   */
  var acceptFriendsRequests = function (req, res) {
    var reqId = req.params.reqId;
    DoctorFriend.findByIdAndUpdate(reqId, {status: 'accepted'}, function (err, ret) {
      if (err) {
        debug('acceptFriendsRequests(), error:%o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.end();
    });
  };

  /**
   * PUT '/api/doctors/friends/requests/:reqId/rejection'
   * @param req
   * @param res
   */
  var rejectFriendsRequests = function (req, res) {
    var reqId = req.params.reqId;
    DoctorFriend.findByIdAndUpdate(reqId, {status: 'rejected'}, function (err, ret) {
      if (err) {
        debug('rejectFriendsRequests(), error:%o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.end();
    });
  };
  /**
   * DELETE '/api/doctors/friends/requests/:reqId'
   * @param req
   * @param res
   */
  var deleteFriendsRequests = function (req, res) {
    var reqId = req.params.reqId;
    DoctorFriend.remove({_id: reqId}).exec();
    res.end();
  };

  /**
   * GET '/api/doctors/friends/:id1/:id2'
   * Response: doctorFriendSchema if exist.
   * @param req
   * @param res
   */
  var getFriendsRequestsBetween2Doctors = function (req, res) {
    var id1 = req.params.id1;
    var id2 = req.params.id2;
    DoctorFriend.find({from: id1, to: id2}, function (err, found) {
      if (err) {
        debug('getFriendsRequestsBetween2Doctors(), get requests error:%o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      if (found.length > 0) {
        res.json(utils.jsonResult(found[0]));
      } else {
        DoctorFriend.find({from: id2, to: id1}, function (err, found) {
          if (err) {
            debug('getFriendsRequestsBetween2Doctors(), get requests error:%o', err);
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
   * GET '/api/doctors/:id/friends'
   * @param req
   * @param res
   */
  var getFriends = function (req, res) {
    var id = req.params.id;
    debug('getFriends(), finding friends for id: %s', id);
    DoctorFriend.find({'$or': [{from: id}, {to: id}], status: 'accepted'}, function (err, requests) {
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
      Doctor.find({_id: {'$in': ids}}, function (err, doctors) {
        if (err) {
          debug('getFriends(), get doctors error:%o', err);
          return res.status(500).json(utils.jsonResult(err));
        }
        res.json(utils.jsonResult(doctors));
      });
    })
  };

  /**
   * Remove some data not tend to expose to user.
   * @param doctor
   */
  var removeNoOutputData = function (doctor) {
    var ret = doctor.toObject();
    delete ret.password;
    delete ret.salt;
    delete ret.wechat.unionid;
    delete ret.wechat.groupid;
    return ret;
  };

  return {
    login: login,
    createDoctor: createDoctor,
    findDoctors: findDoctors,
    saveDoctor: saveDoctor,
    createFriendsRequests: createFriendsRequests,
    getFriendsRequests: getFriendsRequests,
    acceptFriendsRequests: acceptFriendsRequests,
    rejectFriendsRequests: rejectFriendsRequests,
    deleteFriendsRequests: deleteFriendsRequests,
    getFriendsRequestsStatus: getFriendsRequestsBetween2Doctors,
    getFriends: getFriends
  };
};

