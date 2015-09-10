/**
 Created by Ting on 2015/7/22.
 */
var wechat = require('wechat');
var debug = require('debug')('ylb.wechat.patient');
var resources = require('../resources')();
var utils = require('../middleware/utils');
var conf = require('../conf');

module.exports = function (app, api) {
  var Patient = app.models.Patient;
  var Doctor = app.models.Doctor;

  /**
   * Get wechat account information and create patient account if not exist.
   * @param message
   * @param res
   */
  var subscribe = function (message, res) {
    debug('Patient subscribe');
    api.getUser(message.FromUserName, function (err, result) {
      if (err) return debug('Subscribe: Get wechat user error: ', err);
      Patient.find({"wechat.openid": result.openid}, function (err, patient) {
        if (err) return debug('Subscribe: Find patient in db error: ', err);
        if (patient.length && patient.length > 0) {
          debug('Subscribe: Patient exist, update.');
          Patient.update({"wechat.openid": result.openid}, {
            wechat: result
          }, function (err, raw) {
            if (err) return debug('Subscribe: Update patient error: ', err);
            debug('Subscribe: Update patient success: ', raw);
            if (message.EventKey) {
              handleSubscribeMessageKey(message, res);
            } else {
              res.reply(resources.get('event.subscribe.welcome'));
            }
          });
        } else {
          debug('Subscribe: Patient not exist, create.');
          Patient.find({}, 'number').limit(1).sort({'number': -1}).exec(function (err, maxNumberPatient) {
            if (err) return debug('Get patient max number error: ', err);
            console.log('maxNumberPatient:', maxNumberPatient);
            Patient.create({
              mobile: 'openid_' + result.openid,
              number: maxNumberPatient.length > 0 ? maxNumberPatient[0].number + 10000 : 10001,
              wechat: result
            }, function (err, raw) {
              if (err) return debug('Subscribe: Save patient error: ', err);
              debug('Subscribe: Save patient success: ', raw);
              if (message.EventKey) {
                handleSubscribeMessageKey(message, res);
              } else {
                res.reply(resources.get('event.subscribe.welcome'));
              }
            });
          });
        }
      });
    });
  };

  var unsubscribe = function (message, res) {
    debug('Patient unsubscribe');
    Patient.update({'wechat.openid': message.FromUserName}, {'wechat.subscribe': 0}, function (err, result) {
      if (err) debug('Unsubscribe: Update patient subscribe status error: ', err);
      debug('Unsubscribe: Patient unsubscribe success: ', result);
      res.reply('unsubscribed');
    });
  };

  /**
   * 获得用户扫码时间推送后，回复医生的图文信息
   * @param doctorOpenId
   * @param res
   */
  var sendDoctorNews = function (doctorOpenId, toOpenId, res) {
    debug('sendDoctorNews(), find doctor by openid: %s', doctorOpenId);
    Doctor.findOne({'wechat.openid': doctorOpenId}, function (err, doctor) {
      if (err) {
        debug('sendDoctorNews(), find doctor error: %o', err);
        return res.reply('');
      }
      if (!doctor) {
        debug('sendDoctorNews(), doctor not found: %s', doctorOpenId);
        return res.reply('');
      }
      var profileUrl = '/profile/doctor/' + doctorOpenId;
      var profilePage = conf.serverUrl + conf.wxIndexPageUrl + profileUrl;
      var articles = [
        {
          "title": doctor.name,
          "description": doctor.title + '  ' + doctor.department + '  ' + doctor.hospital,
          "url": profilePage,
          "picurl": doctor.avatar
        }];
      api.sendNews(toOpenId, articles, function (err, data) {
        if (err) {
          debug('sendNews error: %o', err);
        } else {
          debug('sendNews success');
        }
      });
    });
  };

  var handleSubscribeMessageKey = function (message, res) {
    if (message.EventKey) {
      debug('user scan QR code, senceStr: %s', message.EventKey);
      // for scan QR code of doctor.
      // EventKey: 'qrscene_profile-oWTqJs8SEbDON98vMor20rnXh9UQ',
      // Refer to app.js, 'profile' is state name, corresponding url is '/profile/doctor/:openid'.
      var doctorQrScenePrefix = 'qrscene_profile-';
      if (message.EventKey.indexOf(doctorQrScenePrefix) == 0) {
        var doctorOpenId = message.EventKey.substr(doctorQrScenePrefix.length, message.EventKey.length);
        debug('handleSubscribeMessageKey(), user subscribe via scan QR code of doctor openid: %s', doctorOpenId);
        sendDoctorNews(doctorOpenId, message.FromUserName, res);
      }
    }
  };

  return wechat(conf.wechatp, function (req, res, next) {
      var message = req.weixin;
      debug(req.url);
      debug('Receive wechat message: ', message);
      if (message.Event == 'subscribe') {
        subscribe(message, res);
      } else if (message.Event == 'unsubscribe') {
        unsubscribe(message, res);
      } else if (message.MsgType == 'event' && message.Event == 'VIEW') {
        // Patient click menu which points to a url.
        // Windows client will not trigger this event.
        //var url = message.EventKey;
        //if (url.indexOf('openid=') > 0) {
        //  // target url need append openid as parameter.
        //  url.replace('openid=', 'openid=' + message.FromUserName);
        //}
        //debug('Redirecting to: %s', url);
        //res.redirect(url);
      } else if (message.MsgType == 'event' && message.Event == 'SCAN') {
        // User scan QR code of doctor, and he already subscribed the PATIENT public account.
        // EventKey: 'profile-oWTqJs8SEbDON98vMor20rnXh9UQ',
        debug('user scan QR code, senceStr: %s', message.EventKey);
        var doctorQrScenePrefix = 'profile-';
        if (message.EventKey.indexOf(doctorQrScenePrefix) == 0) {
          var doctorOpenId = message.EventKey.substr(doctorQrScenePrefix.length, message.EventKey.length);
          debug('handleScanEvent, user (already subscribed) scan QR code of doctor openid: %s', doctorOpenId);
          sendDoctorNews(doctorOpenId, message.FromUserName, res);
        }
      }
    }
  );
};
