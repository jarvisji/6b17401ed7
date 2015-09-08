/**
 * Created by Ting on 2015/7/17.
 */

var sha512 = require('crypto-js/sha512');
var debug = require('debug')('ylb.doctorCtrl');
var utils = require('../middleware/utils');
var stringUtils = require('../utils/string-utils');
var dateUtils = require('../utils/date-utils');

module.exports = function (app, api) {
  var Doctor = app.models.Doctor;
  var DoctorFriend = app.models.DoctorFriend;
  var ServiceStock = app.models.ServiceStock;
  var DPRelation = app.models.DoctorPatientRelation;
  var CaseHistory = app.models.CaseHistory;
  var ServiceOrder = app.models.ServiceOrder;
  var Order = app.models.Order;
  var Message = app.models.Message;
  var excludeFields = app.models.doctorExcludeFields;
  var orderStatus = app.consts.orderStatus;
  var orderTypes = app.consts.orderTypes;
  var messageStatus = app.consts.messageStatus;

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
   * GET '/api/doctors/:id'
   * @param req
   * @param res
   */
  var getDoctor = function (req, res) {
    var id = req.params.id;
    Doctor.findById(id).select(excludeFields).exec(function (err, doctor) {
      if (err) {
        debug('Get doctor error: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.json(utils.jsonResult(doctor));
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
      doctor.number = maxNumberDoctor.length > 0 ? maxNumberDoctor[0].number + 10000 : 10001;
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

      // download avatar from wechat server, then update doctor data.
      if (newDoctor.avatarMediaId) {
        debug('saveDoctor(), avatar changed, downloading from wechat server, mediaId: %s', newDoctor.avatarMediaId);
        utils.downloadWechatMedia(newDoctor.avatarMediaId, doctorId, api, function (err, avatarFileLink) {
          if (err) {
            return debug('saveDoctor(), download avatar from wechat server error: %o', err);
          }
          Doctor.findByIdAndUpdate(doctorId, {avatar: avatarFileLink}, function (err) {
            if (err) {
              return debug('saveDoctor(), save avatar error: %o', err);
            }
            debug('saveDoctor(), saved new avatar: %s', avatarFileLink);
          });
        });
      }

      // Update calculated service stock if jiahao price changed.
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
          var doctorAvatar = doctor.avatar;
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
    DoctorFriend.findById(reqId, function (err, friend) {
      if (err) {
        debug('acceptFriendsRequests(), error:%o', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      friend.status = 'accepted';
      friend.save(function (err) {
        if (err) {
          debug('acceptFriendsRequests(), error:%o', err);
          return res.status(500).json(utils.jsonResult(err));
        }
        debug('acceptFriendsRequests(), updated status to "accepted", requestId: %s', reqId);
        res.json('success');
      });

      // if doctor have 5 friends, set level = 2.
      updateDoctorLevel(friend.from);
      updateDoctorLevel(friend.to);
    });

    var updateDoctorLevel = function (doctorId) {
      debug('acceptFriendsRequests(), updateDoctorLevel(), checking doctor level..., doctorId: %s', doctorId);
      var _doctor;
      Doctor.findById(doctorId).exec()
        .then(function (doctor) {
          if (doctor && doctor.level < 2) {
            debug('acceptFriendsRequests(), updateDoctorLevel(), checking doctor friends count..., doctorId: %s', doctorId);
            _doctor = doctor;
            return DoctorFriend.count({'$or': [{from: doctor.id}, {to: doctor.id}], status: 'accepted'}).exec();
          }
        }).then(function (count) {
          if (count >= 5) {
            debug('acceptFriendsRequests(),updateDoctorLevel(), updating doctor level to 2, doctorId: %s', doctorId);
            _doctor.level = 2;
            return _doctor.save();
          }
        }).then(null, function (err) {
          debug('acceptFriendsRequests(), update doctor level error: %o', err);
        })
    }
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
        _retStock.jiahao.billingPrice = _serviceDef.billingPrice;
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
   * GET '/api/doctors/:id/patientRelations'
   * Get the patients those have relations with the given doctor.
   * Response: List of patients.
   * @param req
   * @param res
   */
  var getPatientRelations = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var doctorId = req.params.id;

    debug('getPatientRelations(), receive request to get patients of doctor: %s', doctorId);
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (user.id != doctorId) {
          debug('getPatientRelations(), currently only support get own relations. operate user is %s, ', user.id);
          throw utils.response403(res);
        }
        return DPRelation.find({'doctor.id': doctorId}).sort({created: -1}).exec();
      }).then(function (relations) {
        res.json(utils.jsonResult(relations));
      }).then(null, function (err) {
        utils.handleError(err, 'getPatientRelations()', debug, res);
      });
  };

  /**
   * GET '/api/doctors/:id/patients/cases'
   * @param req
   * @param res
   */
  var getPatientsCases = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var doctorId = req.params.id;
    debug('getPatientsCases(), receive request to get related patients cases of doctor: %s', doctorId);
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (!user) {
          throw utils.responseOpUserNotFound(res, debug, openid, role);
        }
        if (user.id != doctorId) {
          debug('getPatientsCases(), currently only support get own patients data. operate doctor is %s, ', user.id);
          throw utils.response403(res);
        }
        return DPRelation.find({'doctor.id': doctorId, status: app.consts.relationStatus.suizhen.value}).exec();
      }).then(function (relations) {
        debug('getPatientsCases(), found %d patient relations.', relations.length);
        var patientIds = [];
        for (var i = 0; i < relations.length; i++) {
          patientIds.push(relations[i].patient.id);
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
        debug('getPatientsCases(), found %d cases.', cases.length);
        res.json(utils.jsonResult(cases));
      }).then(null, function (err) {
        utils.handleError(err, 'getPatientsCases()', debug, res);
      });
  };

  /**
   * Get order history of doctor.
   * GET '/api/doctors/:id/orders'
   * @param req
   * @param res
   */
  var getDoctorOrders = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var doctorId = req.params.id;

    debug('getDoctorOrders(), receive request to get orders of doctor: %s', doctorId);
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (!user) {
          throw utils.responseOpUserNotFound(res, debug, openid, role);
        }
        if (user.id != doctorId) {
          debug('getDoctorOrders(), currently only support get own data. operate doctor is %s, ', user.id);
          throw utils.response403(res);
        }

        var status = [orderStatus.confirmed, orderStatus.rejected, orderStatus.finished, orderStatus.extracted];
        return ServiceOrder.find({
          '$or': [{'doctors.id': doctorId}, {'referee.id': doctorId}],
          status: {'$in': status}
        }).sort({created: -1}).exec();
      }).then(function (orders) {
        debug('getDoctorOrders(), found %d orders.', orders.length);
        res.json(utils.jsonResult(orders));
      }).then(null, function (err) {
        utils.handleError(err, 'getDoctorOrders()', debug, res);
      });
  };

  /**
   * Get account summary of doctor. Include balance of in trading, finished, and extracted.
   * GET '/api/doctors/:id/orders/summary'
   * @param req
   * @param res
   */
  var getDoctorOrdersSummary = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var doctorId = req.params.id;

    debug('getDoctorOrdersSummary(), receive request to get orders summary of doctor: %s', doctorId);
    var summary = {confirmed: 0, finished: 0, extractRequested: 0, extracted: 0, recommended: 0};
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (!user) {
          throw utils.responseOpUserNotFound(res, debug, openid, role);
        }
        if (user.id != doctorId) {
          debug('getDoctorOrdersSummary(), currently only support get own data. operate doctor is %s, ', user.id);
          throw utils.response403(res);
        }

        var status = [orderStatus.confirmed, orderStatus.finished, orderStatus.extracted];
        return ServiceOrder.find({
          '$or': [{'doctors.id': doctorId}, {'referee.id': doctorId}],
          status: {'$in': status}
        }).exec();
      }).then(function (orders) {
        debug('getDoctorOrdersSummary(), found %d orders.', orders.length);
        for (var i = 0; i < orders.length; i++) {
          var order = orders[i];
          // income of doctor was calculated when order confirmed. Now only sum the numbers;
          for (var idx in order.doctors) {
            var orderDoctor = order.doctors[idx];
            if (orderDoctor.id == doctorId) {
              summary[order.status] += orderDoctor.income;
            }
          }
          if (order.referee && order.referee.id && order.referee.id == doctorId) {
            summary['recommended'] += order.referee.income;
          }

          //if (order.referee && order.referee.id && order.referee.id == doctorId) {
          //  // calculate recommend fee.
          //  var totalServicePrice = 0;
          //  for (var idx in order.doctors) {
          //    totalServicePrice += order.doctors[idx].servicePrice;
          //  }
          //  earn = totalServicePrice * order.quantity * 0.2;
          //  summary['recommended'] += earn;
          //}
          //
          //// calculate self orders.
          //for (var idx in order.doctors) {
          //  if (order.doctors[idx].id == doctorId) {
          //    var earn = order.doctors[idx].servicePrice * order.quantity;
          //    if (order.referee && order.referee.id) {
          //      // if someone recommended the order, only get 80%.
          //      earn = earn * 0.8;
          //    }
          //    debug('getDoctorOrdersSummary(), calculate order: %s, earn: %d', order.id, earn);
          //    summary[order.status] += earn;
          //    break;
          //  }
          //}
        }
        return Order.find({'buyer.id': doctorId, orderType: orderTypes.withdraw.type}).exec();
      }).then(function (withdraws) {
        for (var i = 0; i < withdraws.length; i++) {
          if (withdraws[i].status == orderStatus.init) {
            summary.extractRequested += withdraws[i].orderPrice;
          } else if (withdraws[i].status == orderStatus.confirmed) {
            summary.extracted += withdraws[i].orderPrice;
          }
        }
        summary.available = summary.finished + summary.recommended - summary.extractRequested - summary.extracted;
        res.json(utils.jsonResult(summary));
      }).then(null, function (err) {
        utils.handleError(err, 'getDoctorOrders()', debug, res);
      });
  };

  /**
   * POST 'api/messages'
   * @Data: {'to': 'string', 'message': 'string'}
   * Only create message when they(from, to) are friends.
   */
  var createMessage = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var message = req.body;

    debug('createMessage(), receive request to create message: %o', message);

    if (!message || !message.to || !message.message) {
      return res.status(400).json(utils.jsonResult(new Error('invalid data')));
    } else {
      message.to = {id: message.to};
      var toUserId = message.to.id;
    }

    var currentUserId;
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        message.from = {id: user.id, name: user.name, avatar: user.avatar, openid: user.wechat.openid};
        currentUserId = user.id;
        return DoctorFriend.find({
          '$or': [{from: currentUserId, to: toUserId}, {from: toUserId, to: currentUserId}],
          status: 'accepted'
        }).exec();
      }).then(function (friends) {
        if (friends.length == 0) {
          throw new Error('No privilege');
        }
        return Message.create(message);
      }).then(function (createdMessage) {
        res.json(utils.jsonResult(createdMessage));
      }).then(null, function (err) {
        utils.handleError(err, 'createMessage()', debug, res);
      });
  };
  /**
   * delete '/api/messages/:id'
   * Only can delete message that created by self (from.id equals current user id).
   */
  var deleteMessage = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var messageId = req.params.id;

    debug('deleteMessage(), receive request to delete message: %s', messageId);

    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        return Message.findOne({_id: messageId, 'from.id': user.id}).exec();
      }).then(function (message) {
        if (!message) {
          debug('deleteMessage(), user openid: %s has no privilege to delete message: %s', openid, messageId);
          throw new Error('No privilege');
        }
        debug('deleteMessage(), deleted.');
        message.remove();
        res.json(utils.jsonResult('success'));
      }).then(null, function (err) {
        utils.handleError(err, 'deleteMessage()', debug, res);
      });
  };

  /**
   * get '/api/messages/current'
   */
  var getUserMessages = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator

    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        debug('getUserMessages(), receive request to get messages of userId: %s', user.id);
        return Message.find({$or: [{'to.id': user.id}, {'from.id': user.id}]}).sort({created: -1}).exec();
      }).then(function (messages) {
        debug('getUserMessages(), find %d message.', messages.length);
        res.json(utils.jsonResult(messages));
      }).then(null, function (err) {
        utils.handleError(err, 'getUserMessages()', debug, res);
      });
  };

  /**
   * get '/api/messages/groups'
   * Get message groups of current user, results are group by relative users.
   * return: [{user: 'object', lastTime: 'date', unread: 'int'}
   */
  var getMessageGroups = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator

    var currentUserId;
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        currentUserId = user.id;
        debug('getMessageGroups(), receive request to get message groups of userId: %s', user.id);
        return Message.find({$or: [{'to.id': user.id}, {'from.id': user.id}]}).sort({created: -1}).exec();
      }).then(function (messages) {
        debug('getMessageGroups(), find %d message.', messages.length);
        var groups = [];
        var userIdsInGroup = [];
        for (var i = 0; i < messages.length; i++) {
          var relUser;
          if (messages[i].from.id == currentUserId) {
            relUser = messages[i].to;
          } else {
            relUser = messages[i].from;
          }
          var groupIdx = userIdsInGroup.indexOf(relUser.id);
          if (groupIdx == -1) {
            groups.push({user: relUser, unread: 0, lastMessage: messages[i].message, lastTime: messages[i].created});
            userIdsInGroup.push(relUser.id);
            groupIdx = userIdsInGroup.length - 1;
          }
          if (messages[i].status == messageStatus.unread) {
            groups[groupIdx].unread++;
          }
        }
        res.json(utils.jsonResult(groups));
      }).then(null, function (err) {
        utils.handleError(err, 'getMessageGroups()', debug, res);
      });
  };
  /**
   * get '/api/messages/group/:userId'
   * Get messages between current user and group user.
   * return: array of messages.
   */
  var getGroupMessagesByUser = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var relUserId = req.params.userId;

    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        debug('getGroupMessagesByUser(), receive request to get messages of userId: %s and relUserId: %s', user.id, relUserId);
        return Message.find({
          $or: [
            {'from.id': relUserId, 'to.id': user.id},
            {'from.id': user.id, 'to.id': relUserId}]
        }).sort({created: 1}).exec();
      }).then(function (messages) {
        debug('getGroupMessagesByUser(), find %d messages.', messages.length);
        res.json(utils.jsonResult(messages));
      }).then(null, function (err) {
        utils.handleError(err, 'getGroupMessagesByUser()', debug, res);
      });
  };

  /**
   * PUT '/api/messages/:id/read'
   * Only can update status of messages send to me (to.id equals current user id).
   */
  var updateMessageReadStatus = function (req, res) {
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    var messageId = req.params.id;

    debug('updateMessageReadStatus(), receive request to update messages read status: %s', messageId);

    var currentUserId;
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        currentUserId = user.id;
        return Message.findById(messageId).exec();
      }).then(function (message) {
        if (!message) {
          throw new Error('Not found');
        } else if (message.to.id != currentUserId) {
          throw new Error('No privilege');
        }
        message.update({status: messageStatus.read}).exec();
        res.json(utils.jsonResult('success'));
      }).then(null, function (err) {
        utils.handleError(err, 'updateMessageReadStatus()', debug, res);
      });
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
    getDoctor: getDoctor,
    saveDoctor: saveDoctor,
    createFriendsRequests: createFriendsRequests,
    getFriendsRequests: getFriendsRequests,
    acceptFriendsRequests: acceptFriendsRequests,
    rejectFriendsRequests: rejectFriendsRequests,
    deleteFriendsRequests: deleteFriendsRequests,
    getFriendsRequestsStatus: getFriendsRequestsBetween2Doctors,
    getFriends: getFriends,
    getServiceStock: getServiceStock,
    getPatientRelations: getPatientRelations,
    getPatientsCases: getPatientsCases,
    getDoctorOrders: getDoctorOrders,
    getDoctorOrdersSummary: getDoctorOrdersSummary,
    createMessage: createMessage,
    deleteMessage: deleteMessage,
    getUserMessages: getUserMessages,
    updateMessageReadStatus: updateMessageReadStatus,
    getMessageGroups: getMessageGroups,
    getGroupMessagesByUser: getGroupMessagesByUser
  };
};

