/**
 Created by Ting on 2015/7/17.
 */
var request = require('request');
var utils = require('../middleware/utils');
var debug = require('debug')('ylb.wechatCtrl');

module.exports = function (app, api, apip, oauth) {
  var authUtils = require('../utils/auth-utils')(app);
  var excludeFields = app.models.doctorExcludeFields;
  var patientExcludeFields = app.models.patientExcludeFields;

  return {
    createMenu: function (req, res) {
      //TODO: need authorization before update menu
      api.createMenu(req.body, function (err, result) {
        if (err)
          res.json(utils.jsonResult(err));
        else {
          res.json(result);
        }
      });
    },
    /**
     * GET '/wechat/qrcode/doctor/:openid'
     * Get QR code for doctor. Notice, we want user scan the QR code to follow PATIENT public account, so we use 'apip'.
     * @param req
     * @param res
     */
    getQrCode: function (req, res) {
      var stateName = 'profile';
      var stateParam = req.params.openid;
      var senseId = stateName + '-' + stateParam;
      debug('getQrCode(), receive request to get QR code for openid: %s', stateParam);
      apip.createLimitQRCode(senseId, function (err, data) {
        if (err) {
          return utils.handleError(err, 'getQrCode()', debug, res);
        }
        // return data:
        // { ticket: 'gQH88DoAAAAAAAAAASxodHRwOi8vd2VpeGluLnFxLmNvbS9xL0NVZzMtQWZtR1E1Z0J1b3ZKbUNkAAIE0NzvVQMEAAAAAA==',
        //  url: 'http://weixin.qq.com/q/CUg3-AfmGQ5gBuovJmCd' }
        var ticket = data.ticket;
        var qrCodeUrl = apip.showQRCodeURL(ticket);
        res.json(utils.jsonResult({qrCodeUrl: qrCodeUrl}));
      })
    },
    getJsSdkConfig: function (req, res) {
      var param = {
        debug: false,
        jsApiList: ['chooseImage', 'previewImage', 'uploadImage', 'downloadImage'],
        url: 'http://www.utime.info/wxindex.html'
      };
      api.getJsConfig(param, function (err, config) {
        if (err) return res.json(utils.jsonResult(err));
        res.json(utils.jsonResult(config));
      });
    },
    /**
     * Verify given 'openid' and 'access_token' from wechat server.
     * After verify succeed, try to get registered doctor/patient data.
     * @param req
     * @param res
     */
    verifyAccessToken: function (req, res) {
      var openid = req.query.openid;
      var access_token = req.query.access_token;
      if (!openid || !access_token) {
        return res.status(400).json(utils.jsonResult(new Error('Invalid parameters.')));
      }
      // TODO: enable verify access_token.

      //oauth._verifyToken(openid, access_token, function (err, data) {
      //  if (err) {
      //    debug('Verify openid: %s, access_token: %s failed: %o', openid, access_token, err);
      //    return res.status(401).json(utils.jsonResult(err));
      //  }
      app.models.Doctor.findOne({'wechat.openid': openid}, excludeFields + ' -wechat', function (err, doctor) {
        if (err) {
          debug('Get user information error: %o', err);
          return res.status(500).json(utils.jsonResult(err));
        }
        app.models.Patient.findOne({'wechat.openid': openid}, patientExcludeFields + ' -wechat', function (err, patient) {
          if (err) {
            debug('Get user information error: %o', err);
            return res.status(500).json(utils.jsonResult(err));
          }
          if (!doctor && !patient) {
            debug('Cannot find register user for openid: %s', openid);
            return res.status(404).json(utils.jsonResult(new Error('Not found')));
          }

          var retData = {
            openid: openid,
            access_token: access_token,
            verified: Date.now()
          };
          if (doctor) {
            retData.doctor = doctor;
          }
          if (patient) {
            retData.patient = patient;
          }
          res.json(utils.jsonResult(retData));
        });
      });
      //});
    }
  };
};
