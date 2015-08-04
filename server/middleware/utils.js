/**
 * Created by Ting on 2015/7/15.
 */
var _debug = require('debug')('ylb.utils');

module.exports = {
  debugMongooseError: function (err, debug, message /* optional */) {
    if (message)
      debug(message, err);
    else
      debug('Mongoose error: ', err);
  },

  handleError: function (err, prefix, debug, res, status) {
    var theDebug = debug ? debug : _debug;
    if (prefix)
      theDebug('%s, error: %o', prefix, err);
    else
      theDebug('Error: %o', err);

    if (res) {
      var statusCode = 500;
      if (err.message == 'no privilege')
        statusCode = 403
      if (status)
        statusCode = status;
      return res.status(statusCode).json(this.jsonResult(err));
    }
  },

  /**
   * Warp different result object to uniform JSON format before response..
   * @param result
   * @param [mix]
   * @returns {{data: Array}}
   */
  jsonResult: function (result, mix) {
    var jsonRet = {data: []};
    if (result instanceof Error) {
      jsonRet.error = {'message': result.message, 'name': result.name};
    } else if (typeof(result) == 'string') {
      jsonRet.message = result;
    } else {
      jsonRet.data = result;
      if (result instanceof Array) {
        jsonRet.count = result.length;
      }
    }
    if (mix && mix instanceof Object) {
      var keys = Object.keys(mix);
      for (var key in keys) {
        jsonRet[key] = mix[key];
      }
    }
    return jsonRet;
  },

  /**
   * Get user by openid and role. Maybe doctor or patient.
   * @param openid
   * @param role
   * @param [callback]
   * @returns {*|Promise}
   */
  getUserByOpenid: function (openid, role, callback) {
    var Doctor = gApp.models.Doctor;
    var Patient = gApp.models.Patient;
    if (role == gApp.consts.role.doctor) {
      var queryPromise = Doctor.findOne({'wechat.openid': openid}).exec();
    } else if (role == gApp.consts.role.patient) {
      var queryPromise = Patient.findOne({'wechat.openid': openid}).exec();
    } else {
      throw new Error('invalid role');
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
  }
};
