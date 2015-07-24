/**
 * Created by Ting on 2015/7/23.
 */

var sha512 = require('crypto-js/sha512');
var debug = require('debug')('ylb.patientCtrl');
var utils = require('../middleware/utils');
var stringUtils = require('../utils/string-utils');

module.exports = function (app) {
  var Patient = app.models.Patient;

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
    Patient.find(filter).limit(limit).sort(sort).exec(function (err, patients) {
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
   * GET /api/patients/:id/follows
   * Get doctors list that a patient follows.
   * @param req
   * @param res
   */
  var getFollows = function (req, res) {
    var patientId = req.params.id;
    debug('Getting follow, patientId: %s.', patientId);
    Patient.findById(patientId, 'doctorFollowed', function (err, patient) {
      if (err) {
        debug('Get patient follows failed: ', err);
        return res.status(500).json(utils.jsonResult(err));
      }
      res.json(utils.jsonResult(patient.doctorFollowed));
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
    var Doctor = app.models.Doctor;
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
      })
    })
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
    })
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
    deleteFollow: deleteFollow
  };
};

