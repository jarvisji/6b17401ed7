/**
 * Created by Ting on 2015/7/17.
 */
var app = require('../../server/server');
var request = require('supertest');
var conf = require('./testConfig');

module.exports = {
  req: {
    json: function (verb, url) {
      return request(conf.serverUrl)[verb](url)
        .set('Accept', 'application/json');
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

