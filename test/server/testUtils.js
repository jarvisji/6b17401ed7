/**
 * Created by Ting on 2015/7/17.
 */
var app = require('../../server/server');
var request = require('supertest');
var conf = require('./testConfig');

module.exports = {
  req: {
    json: function (verb, url, openid, role) {
      var request = request(conf.serverUrl)[verb](url);
      request = request.set('Accept', 'application/json');
      if (openid && role) {
        request = request.set('Authorization', 'wechatOAuth openid="' + openid + '" role="' + role + '"');
      }
      return request;
      //.expect('Content-Type', /json/);
    },
    xml: function (verb, url) {
      return request(conf.serverUrl)[verb](url)
        .set('Content-Type', 'text/plain;charset=UTF-8');
    }
  },
  app: app,
  conf: conf
};

