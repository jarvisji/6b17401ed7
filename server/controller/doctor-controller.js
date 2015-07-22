/**
 * Created by Ting on 2015/7/17.
 */

var sha512 = require('crypto-js/sha512');
var debug = require('debug')('ylb.doctorCtrl');
var utils = require('../middleware/utils');
var stringUtils = require('../utils/string-utils');

module.exports = function (app) {
  var Doctor = app.models.Doctor;

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
      console.log('key:', key, value);
      if (typeof(value) != 'string') {
        break;
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

    Doctor.find(filter).limit(limit).sort(sort).exec(function (err, doctors) {
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
      doctor.number = maxNumberDoctor[0].number + 1;
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
    saveDoctor: saveDoctor
  };
};

