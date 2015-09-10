/**
 Created by Ting on 2015/7/17.
 */
var wechat = require('wechat');
var debug = require('debug')('ylb.wechat');
var resources = require('../resources')();
var conf = require('../conf');

module.exports = function (app, api) {
  var Doctor = app.models.Doctor;

  /**
   * Get wechat account information and create doctor account if not exist.
   * @param message
   * @param res
   */
  var subscribe = function (message, res) {
    debug('Doctor subscribe');
    api.getUser(message.FromUserName, function (err, result) {
      if (err) return debug('Subscribe: Get wechat user error: ', err);
      Doctor.find({"wechat.openid": result.openid}, function (err, doctor) {
        if (err) return debug('Subscribe: Find doctor in db error: ', err);
        if (doctor.length && doctor.length > 0) {
          debug('Subscribe: Doctor exist, update.');
          Doctor.update({"wechat.openid": result.openid}, {
            wechat: result
          }, function (err, raw) {
            if (err) return debug('Subscribe: Update doctor error: ', err);
            debug('Subscribe: Update doctor success: ', raw);
            res.reply(resources.get('event.subscribe.welcome'));
          });
        } else {
          debug('Subscribe: Doctor not exist, create.');
          Doctor.find({}, 'number').limit(1).sort({'number': -1}).exec(function (err, maxNumberDoctor) {
            if (err) return debug('Get doctor max number error: ', err);
            Doctor.create({
              mobile: 'openid_' + result.openid,
              number: maxNumberDoctor.length > 0 ? maxNumberDoctor[0].number + 10000 : 10001,
              wechat: result
            }, function (err, raw) {
              if (err) return debug('Subscribe: Save doctor error: ', err);
              debug('Subscribe: Save doctor success: ', raw);
              res.reply(resources.get('event.subscribe.welcome'));
            });
          });
        }
      });
    });
  };

  var unsubscribe = function (message, res) {
    debug('Doctor unsubscribe');
    Doctor.update({'wechat.openid': message.FromUserName}, {'wechat.subscribe': 0}, function (err, result) {
      if (err) debug('Unsubscribe: Update doctor subscribe status error: ', err);
      debug('Unsubscribe: Doctor unsubscribe success: ', result);
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
        // Doctor click menu which points to a url.
        // Windows client will not trigger this event.
        //var url = message.EventKey;
        //if (url.indexOf('openid=') > 0) {
        //  // target url need append openid as parameter.
        //  url.replace('openid=', 'openid=' + message.FromUserName);
        //}
        //debug('Redirecting to: %s', url);
        //res.redirect(url);

        res.reply('success'); // do nothing currently.
      } else {
        res.reply('success'); // do nothing for other events.
      }
    }
  );
};
