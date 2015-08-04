/**
 * Created by Ting on 2015/7/17.
 */

var sha512 = require('crypto-js/sha512');
var debug = require('debug')('ylb.doctorCtrl');
var utils = require('../middleware/utils');
var stringUtils = require('../utils/string-utils');
var dateUtils = require('../utils/date-utils');

module.exports = function (app) {
  var Doctor = app.models.Doctor;
  var DoctorFriend = app.models.DoctorFriend;
  var ServiceStock = app.models.ServiceStock;
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
    var newDoctor = req.body;
    var doctorId = req.params.id;
    if (!newDoctor || !doctorId) {
      debug('Update doctor, invalid id or data: ', doctorId, newDoctor);
      return res.status(400).json(utils.jsonResult(new Error('Invalid data')));
    }
    // some fields cannot be updated via public api.
    delete newDoctor.password;
    delete newDoctor.wechat;
    delete newDoctor.salt;
    delete newDoctor.level;


    // We pre-calculated service stock, so if user changed the quantity, we need update stock corresponding.
    // Compare to current service quantity and update service stock information.
    Doctor.findById(doctorId, function (err, doctor) {
      var oldJiahao;
      var newJiahao;

      if (doctor && doctor.services) {
        for (var idx in doctor.services) {
          if (doctor.services[idx].type == app.consts.doctorServices.jiahao.type) {
            oldJiahao = doctor.services[idx];
            break;
          }
        }
      }

      if (newDoctor.services) {
        for (var idx in newDoctor.services) {
          if (newDoctor.services[idx].type == app.consts.doctorServices.jiahao.type) {
            newJiahao = newDoctor.services[idx];
            break;
          }
        }
      }
      debug('saveDoctor(), old Jiahao: %o, new Jiahao: %o', oldJiahao, newJiahao);

      // create new or update exists doctor.
      debug('saveDoctor(), updating doctor.');
      Doctor.findByIdAndUpdate(doctorId, newDoctor, {upsert: true, new: true}, function (err, doctor) {
        if (err) {
          debug('Update doctor error: ', err);
          return res.status(500).json(utils.jsonResult(err));
        }
        doctor = removeNoOutputData(doctor);
        res.json(utils.jsonResult(doctor));
      });


      if (!newJiahao || !oldJiahao) {
        debug('saveDoctor(), no newJiahao or oldJiahao, needn\'t update service stock.');
        return;
      }

      var saveNewStock = function (serviceStock) {
        if (serviceStock) {
          var oldQuantity = quantities[serviceStock.serviceId].oldQuantity;
          var newQuantity = quantities[serviceStock.serviceId].newQuantity;
          var currentStock = serviceStock.stock;
          var orderedQuantity = oldQuantity - currentStock;
          var newStock = newQuantity - orderedQuantity;
          if (newStock < 0) {
            newStock = 0;
          }
          debug('sveDoctor(), saveNewStock(), updating stock, current: %s, ordered: %s, new: %s of serviceId: %s.', currentStock, orderedQuantity, newStock, serviceStock.id);
          serviceStock.stock = newStock;
          serviceStock.save(function (err) {
            if (err) {
              debug('saveDoctor(), save service stock error: %o', err);
            }
          });
        } else {
          debug('saveDoctor(), saveNewStock(), no service stock data found, needn\'t update.');
        }
      };

      // check changes of week quantity.
      var _currentWeekRange = dateUtils.getCurrentWeekWorkingDate();
      var _nextWeekRange = dateUtils.getNextWeekWorkingDate();
      var currentWeekDates = dateUtils.getDateInRange(_currentWeekRange.start, _currentWeekRange.end);
      var nextWeekDates = dateUtils.getDateInRange(_nextWeekRange.start, _nextWeekRange.end);
      var quantities = {};
      for (var key in newJiahao.weekQuantity) {
        var newQuantity = newJiahao.weekQuantity[key];
        var oldQuantity = oldJiahao.weekQuantity ? oldJiahao.weekQuantity[key] : 0;
        if (!isNaN(newQuantity) && newQuantity != oldQuantity) {
          quantities[oldJiahao.id] = {newQuantity: newQuantity, oldQuantity: oldQuantity};
          debug('saveDoctor(), weekQuantity of %s changes, old: %s, new: %s', key, oldQuantity, newQuantity);
          // quantity of key changes. key is one of 'd1', 'd2', 'd3', 'd4', 'd5'.
          var dayOfWeek = key.substr(1, 1) * 1;
          var dateOfCurrentWeek = currentWeekDates[dayOfWeek - 1];
          var dateOfNextWeek = nextWeekDates[dayOfWeek - 1];
          debug('saveDoctor(), retrieve stock data of relative date in current week: %o', dateOfCurrentWeek);
          ServiceStock.findOne({serviceId: oldJiahao.id, 'date': dateOfCurrentWeek}, function (err, serviceStock) {
            if (err) {
              return debug('saveDoctor(), find service stock of current week error: %o', err);
            }
            saveNewStock(serviceStock);
          });
          debug('saveDoctor(), retrieve stock data of relative date in next week: %o', dateOfNextWeek);
          ServiceStock.findOne({serviceId: oldJiahao.id, 'date': dateOfNextWeek}, function (err, serviceStock) {
            if (err) {
              return debug('saveDoctor(), find service stock of next week error: %o', err);
            }
            saveNewStock(serviceStock);
          });
        }
      }
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
   * GET '/api/doctors/:id/serviceStock'
   * @param req
   * @param res
   * @Return HttpResponse. For 'jiahao', return remain counts of this week and next week.
   */
  var getServiceStock = function (req, res) {
    var id = req.params.id;
    debug('getServiceStock(), getting service of doctor: %s', id);
    var _serviceDef, _currentWeekRange, _nextWeekRange;
    var _retStock = {jiahao: {thisWeek: '', nextWeek: ''}};
    Doctor.findById(id).exec()
      .then(function (doctor) {
        if (!doctor) {
          debug('getServiceStock(), doctor not found.');
          throw new Error('doctor not found');
        }

        //find doctor service
        var services = doctor.services;
        for (var idx in services) {
          if (services[idx].weekQuantity) {
            _serviceDef = services[idx];
            break;
          }
        }
        debug('getServiceStock(), found service: %o', _serviceDef);
        // find service stock for this week and next week.
        if (!_serviceDef) {
          debug('getServiceStock() error, no week quantity defined for this doctor.');
          throw new Error('no service quantity defined');
        }

        _currentWeekRange = dateUtils.getCurrentWeekWorkingDate();
        _nextWeekRange = dateUtils.getNextWeekWorkingDate();
        debug('getServiceStock(), checking stock of current week.');
        return ServiceStock.find({
          serviceId: _serviceDef.id,
          date: {'$gte': _currentWeekRange.start, '$lte': _currentWeekRange.end}
        }).sort({date: 1}).exec();
      }).then(function (currentWeekServiceStocks) {
        debug('getServiceStock(), currentWeekServiceStocks: %o', currentWeekServiceStocks);
        if (currentWeekServiceStocks.length == 0) {
          debug('getServiceStock(), No data of service stock of current week, initializing...');
          var dateArray = dateUtils.getDateInRange(_currentWeekRange.start, _currentWeekRange.end);
          var newStockData = [];
          for (var i = 0; i < dateArray.length; i++) {
            newStockData.push({
              doctorId: id,
              serviceId: _serviceDef.id,
              date: dateArray[i],
              stock: _serviceDef.weekQuantity['d' + (i + 1)]
            });
          }
          return ServiceStock.create(newStockData);
        } else {
          if (currentWeekServiceStocks.length != 5) {
            // check this log to see if we got data exception. This should not happen, no error handler currently.
            debug('getServiceStock(), data error, currentWeekServiceStocks should have 5 records: %o', currentWeekServiceStocks);
          }
          _retStock.jiahao.thisWeek = currentWeekServiceStocks;
        }
      }
    ).then(function (createdStockData) {
        if (createdStockData instanceof Array) {
          debug('getServiceStock(), createdStockData for current week: %o', createdStockData);
          _retStock.jiahao.thisWeek = createdStockData;
        }

        debug('getServiceStock(), checking stock of next week.');
        return ServiceStock.find({
          serviceId: _serviceDef.id,
          date: {'$gte': _nextWeekRange.start, '$lte': _nextWeekRange.end}
        }).sort({date: 1}).exec();
      }).then(function (nextWeekServiceStocks) {
        debug('getServiceStock(), nextWeekServiceStocks: %o', nextWeekServiceStocks);
        if (nextWeekServiceStocks.length == 0) {
          debug('getServiceStock(), No data of service stock of next week, initializing...');
          var dateArray = dateUtils.getDateInRange(_nextWeekRange.start, _nextWeekRange.end);
          var newStockData = [];
          for (var i = 0; i < dateArray.length; i++) {
            newStockData.push({
              doctorId: id,
              serviceId: _serviceDef.id,
              date: dateArray[i],
              stock: _serviceDef.weekQuantity['d' + (i + 1)]
            });
          }
          return ServiceStock.create(newStockData);
        } else {
          if (nextWeekServiceStocks.length != 5) {
            // check this log to see if we got data exception. This should not happen, no error handler currently.
            debug('getServiceStock(), data error, nextWeekServiceStocks should have 5 records: %o', nextWeekServiceStocks);
          }
          _retStock.jiahao.nextWeek = nextWeekServiceStocks;
        }
      }).then(function (createdStockData) {
        if (createdStockData instanceof Array) {
          debug('getServiceStock(), createdStockData for next week: %o', createdStockData);
          _retStock.jiahao.nextWeek = createdStockData;
        }
        _retStock.jiahao.price = _serviceDef.price;
        debug('getServiceStock(), done.');
        res.json(utils.jsonResult(_retStock));
      }).then(null, function (err) {
        if (err) {
          debug('getServiceStock(), error: %o', err);
          if (err.message == 'no service quantity defined') {
            res.json(utils.jsonResult([]));
          } else {
            res.status(500).json(utils.jsonResult(err));
          }
        }
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
    getFriends: getFriends,
    getServiceStock: getServiceStock
  };
};

