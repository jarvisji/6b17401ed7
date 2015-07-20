/**
 * Created by Ting on 2015/7/17.
 */

var sha512 = require('crypto-js/sha512');
var debug = require('debug')('ylb.doctorCtrl');
var utils = require('../middleware/utils');

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

  var getDoctors = function (req, res) {
    var filter = {};
    if (req.query.filter) {
      filter = JSON.parse(req.query.filter);
    }
    Doctor.find(filter, function (err, doctors) {
      if (err) {
        debug('Find doctor error: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.json(utils.jsonResult(doctors));
    });
  };

  var createDoctor = function (req, res) {
    //TODO: check authorization.
    Doctor.count(function (err, count) {
      if (err) return debug('Get doctor count error: ', err);
      var doctor = new Doctor(req.body);
      doctor.salt = Math.round((new Date().valueOf() * Math.random()));
      doctor.password = sha512(doctor.salt + doctor.password);
      doctor.number = count + 1;
      doctor.save(function (err, data) {
        if (err) {
          debug('Save doctor error: ', err);
          if (err.code == 11000) // duplicate key
            return res.status(409).json(utils.jsonResult(err));
          else
            return res.status(500).json(utils.jsonResult(err));
        }
        debug('Save doctor success: ', err);
        var retData = data.toObject();
        delete retData.password;
        delete retData.salt;
        res.status(201).json(utils.jsonResult(retData));
      });
    });
  };

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
    Doctor.findByIdAndUpdate(doctorId, {$set: doctor}, function (err, doctor) {
      if (err) {
        debug('Update doctor error: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.json(utils.jsonResult(doctor));
    });
  };

  return {
    login: login,
    createDoctor: createDoctor,
    getDoctors: getDoctors,
    saveDoctor: saveDoctor
  };
};
