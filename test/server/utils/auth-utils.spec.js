/**
 * Test auth-utils.
 * Created by Ting on 2015/7/29.
 */
var app = require('../../../server/server');
var authUtils = require('../../../server/utils/auth-utils')(app);
var should = require('should');

describe('Test auth-utils functions.', function () {
  var mockToken = {
    "access_token": "ACCESS_TOKEN",
    "expires_in": 7200,
    "refresh_token": "REFRESH_TOKEN",
    "openid": "OPENID",
    "scope": "SCOPE",
    "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL"
  };

  it('Test save token.', function (done) {
    authUtils.saveToken(mockToken.openid, mockToken, function (err) {
      if (err) return done(err);
      authUtils.getToken(mockToken.openid, function (err, token) {
        if (err) return done(err);
        should(token.access_token).equal(mockToken.access_token);
        should(token.refresh_token).equal(mockToken.refresh_token);
        should(token.unionid).equal(mockToken.unionid);
        done();
      });
    })
  });

  it('Test save token for exist openid.', function (done) {
    var beforeCaseTime = new Date();
    setTimeout(function(){
      authUtils.saveToken(mockToken.openid, mockToken, function (err) {
        if (err) return done(err);
        authUtils.getToken(mockToken.openid, function (err, token) {
          if (err) return done(err);
          should(token.access_token).equal(mockToken.access_token);
          should(token.refresh_token).equal(mockToken.refresh_token);
          should(token.unionid).equal(mockToken.unionid);
          should(token.lastModified).greaterThan(beforeCaseTime);
          done();
        });
      });
    }, 100);
  });
});

