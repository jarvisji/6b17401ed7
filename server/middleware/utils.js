/**
 * Created by Ting on 2015/7/15.
 */
var _debug = require('debug')('ylb.utils');
var fs = require('fs');
var mkdirp = require('mkdirp');

module.exports = {
  debugMongooseError: function (err, debug, message /* optional */) {
    if (message)
      debug(message, err);
    else
      debug('Mongoose error: ', err);
  },

  handleError: function (err, prefix, debug, res, status) {
    if (err.message == 'responded') {
      // means already send response to user and skip after promise then().
      return;
    }
    var theDebug = debug ? debug : _debug;
    if (prefix)
      theDebug('%s, error: %o', prefix, err);
    else
      theDebug('Error: %o', err);

    if (res) {
      var statusCode = 500;
      if (err.message == 'no privilege')
        statusCode = 403;
      if (status)
        statusCode = status;
      return res.status(statusCode).json(this.jsonResult(err));
    }
  },

  response403: function (res, message) {
    var msg = message ? message : 'no privilege';
    res.status(403).json(this.jsonResult(new Error(msg)));
    return new Error('responded');
  },

  responseOpUserNotFound: function (res, debug, openid, role) {
    var theDebug = debug ? debug : _debug;
    theDebug('getPatientsCases(), cannot find operate user, openid: %s, role: %s.', openid, role);
    res.status(404).json(this.jsonResult(new Error('user not found')));
    return new Error('responded');
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
    var queryPromise;
    if (role == gApp.consts.role.doctor) {
      queryPromise = Doctor.findOne({'wechat.openid': openid}).exec();
    } else if (role == gApp.consts.role.patient) {
      queryPromise = Patient.findOne({'wechat.openid': openid}).exec();
    } else {
      _debug('getrUserByOpenid(), invalid role: %s', role);
      throw new Error('invalid role');
    }
    if (callback) {
      queryPromise.then(function (user) {
        callback(null, user);
      }, function (err) {
        callback(err);
      })
    }
    return queryPromise;
  },

  /**
   * Download media from wechat server, save to local user directory.
   * @param mediaId
   * @param userId
   * @param api
   * @param callback
   */
  downloadWechatMedia: function (mediaId, userId, api, callback) {
    _debug('createCase(), downloading image from wechat server, mediaId: %s', mediaId);
    api.getMedia(mediaId, function (err, result, header) {
      if (err) {
        _debug('downloadWechatMedia(), get media from wechat server error: %o', err);
        //TODO: if do not throw this error to user, need consider retry or error handler.
        callback(err);
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
      var fileLink = '/upload/' + userId + '/';
      var path = __dirname + '/../..' + fileLink;
      fs.exists(path, function (exist) {
        if (!exist) {
          mkdirp.sync(path);
        }

        var filePath = path + fileName;
        fileLink += fileName;
        _debug('downloadWechatMedia(), writing download file to %s', filePath);
        fs.writeFile(filePath, result, function (err) {
          if (err) {
            _debug('createCase(), save media file error: %o', err);
            //TODO: error handler
            callback(err);
          }
          callback(null, fileLink);
        });
      });
    });
  }
};
