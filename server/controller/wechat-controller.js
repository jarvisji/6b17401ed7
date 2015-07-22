/**
 Created by Ting on 2015/7/17.
 */
var request = require('request');
var conf = require('../conf');
var utils = require('../middleware/utils');
var debug = require('debug')('ylb.wechatCtrl');

module.exports = function (app, api) {
  return {
    createMenu: function (req, res) {
      //TODO: need authorization before update menu
      api.createMenu(req.body, function (err, result) {
        if (err)
          res.json(utils.jsonResult(err));
        else {
          res.json(result);
        }
      })
    },
    getJsSdkConfig: function (req, res) {
      var param = {
        debug: true,
        jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage'],
        url: 'http://www.utime.info/wxindex.html'
      };
      api.getJsConfig(param, function (err, config) {
        if (err) return res.json(utils.jsonResult(err));
        res.json(utils.jsonResult(config));
      })
    }
  }
};
