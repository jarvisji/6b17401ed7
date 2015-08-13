/**
 * Middleware to verify 'Authorization' header:
 * Authorization: wechatOAuth openid="", access_token="", role="patient|doctor".
 *
 * If 'openid' and 'access_token' pair is not found in DB, return 401.
 * Else, if access_token is expired, try to refresh it.
 *
 * If refresh success, set refreshed_access_token in res.
 * If refresh failed, return 401.
 *
 * Last, set 'openid' and 'role' as request query parameters, and call next router.
 * Created by Ting on 2015/7/29.
 */

var utils = require('./utils');
var debug = require('debug')('ylb.oauth');
module.exports = function (req, res, next) {
  if (req.originalUrl.indexOf('/api/') == 0) {
    var authorizationStr = req.get('Authorization');
    debug('Received request: %s, Authorization: %s', req.originalUrl, authorizationStr);

    var auth = {};
    // expect Authorization : wechatOAuth openid="" access_token="" role="doctor|patient"
    if (!authorizationStr) {
      debug('Invalid authorization string: %s', authorizationStr);
      return res.status(401).json(utils.jsonResult(new Error('Invalid authorization string')));
    }

    var authArr = authorizationStr.split(' ');
    if (authArr[0] != 'wechatOAuth') {
      debug('Unsupported authorization method: %s', authArr[0]);
      return res.status(401).json(utils.jsonResult(new Error('Unsupported authorization method')));
    }

    //if (authArr.length !== 4) {
    //  debug('Invalid authorization string: %s', authorizationStr);
    //  return res.status(401).json(utils.jsonResult(new Error('Invalid authorization string')));
    //}

    for (var i = 1; i < authArr.length; i++) {
      var tmpArr = authArr[i].split('="');
      if (tmpArr.length = 2) {
        //auth[tmpArr[0]] = tmpArr[1].substr(0, tmpArr[1].length - 1);
        var key = tmpArr[0];
        var value = tmpArr[1].substr(0, tmpArr[1].length - 1);
        req.query[key] = value;

        if ((key == 'openid' || key == 'role') && (!value || value == 'undefined')) {
          debug('Missing openid or role in header');
          return res.status(401).json(utils.jsonResult(new Error('Invalid authorization string')));
        }
      } else {
        debug('Invalid value of authorization string: %s', authArr[i]);
      }
    }

    // TODO: should verify openid and access_token.
  }
  next();
};
