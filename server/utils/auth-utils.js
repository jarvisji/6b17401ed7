/**
 * Utility methods for user authorization. Currently we leverage wechat oauth access_token.The base flow is:
 *
 * 1. oauth.getAuthorizeURL()
 * 2. oauth.request(authorizeUrl), get 'code' from wechat server.
 * 3. getAccessToken(), use 'code' to get access_token, save to local db.
 * 4. check access_token is valid: return !!this.data.access_token && (new Date().getTime()) < (this.data.create_at + this.data.expires_in * 1000);
 * 5. if invalid, call refreshAccessToken().
 * Refer to wechat document: http://mp.weixin.qq.com/wiki/17/c0f37d5704f0b64713d5d2c37b468d75.html
 * Created by Ting on 2015/7/29.
 */

var OAuth = require('wechat-oauth');
var debug = require('debug')('ylb.authUtils');
var conf = require('../conf');

module.exports = function (app) {
  var WechatOAuth = app.models.WechatOAuth;
  var saveToken = function (openid, token, callback) {
    WechatOAuth.findOneAndUpdate({openid: openid}, token, {upsert: true}, function (err) {
      if (err) return callback(err);
      callback(null);
    });
  };
  var getToken = function (openid, callback) {
    WechatOAuth.findOne({openid: openid}, function (err, token) {
      if (err) return callback(err);
      callback(null, token);
    });
  };
  if (!this.oauth) {
    this.oauth = new OAuth(conf.wechat.appid, conf.wechat.appsecret, getToken, saveToken);
    debug('Initialized wechat-oauth middleware.');
  }

  return {
    saveToken: saveToken,
    getToken: getToken,
    isTokenValid: function (data) {
      return !!data.access_token && (new Date().getTime()) < (data.create_at + data.expires_in * 1000);
    }
  };
};
