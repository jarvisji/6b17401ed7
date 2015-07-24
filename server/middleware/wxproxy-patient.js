/**
 Created by Ting on 2015/7/22.
 */
var wechat = require('wechat');
var debug = require('debug')('ylb.wechat.patient');
var resources = require('../resources')();
var conf = require('../conf');

module.exports = function (app, api) {
  var Patient = app.models.Patient;

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
            res.reply(resources.get('event.subscribe.welcome'));
          });
        } else {
          debug('Subscribe: Patient not exist, create.');
          Patient.find({}, 'number').limit(1).sort({'number': -1}).exec(function (err, maxNumberPatient) {
            if (err) return debug('Get patient max number error: ', err);
            console.log('maxNumberPatient:', maxNumberPatient);
            Patient.create({
              mobile: 'openid_' + result.openid,
              number: maxNumberPatient.length > 0 ? maxNumberPatient[0].number + 1 : 1,
              wechat: result
            }, function (err, raw) {
              if (err) return debug('Subscribe: Save patient error: ', err);
              debug('Subscribe: Save patient success: ', raw);
              res.reply(resources.get('event.subscribe.welcome'));
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

  return wechat(conf.wechat, function (req, res, next) {
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
        var url = message.EventKey;
        if (url.indexOf('openid=') > 0) {
          // target url need append openid as parameter.
          url.replace('openid=', 'openid=' + message.FromUserName);
        }
        debug('Redirecting to: %s', url);
        res.redirect(url);
      }
    }
  );
};
