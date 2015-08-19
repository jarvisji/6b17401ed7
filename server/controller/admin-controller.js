/**
 * Created by Ting on 2015/8/19.
 */

var sha512 = require('crypto-js/sha512');
var debug = require('debug')('ylb.adminCtrl');
var utils = require('../middleware/utils');

module.exports = function (app) {
  var AdminUser = app.models.AdminUser;
  var login = function (req, res) {
    var loginUser = req.body;
    if (typeof(loginUser) == 'object' && loginUser.username && loginUser.password) {
      AdminUser.findOne({'username': loginUser.username}, function (err, user) {
        if (err) {
          debug('Find user error: ', err);
          return res.status(500).json(utils.jsonResult(err));
        }
        if (user) {
          var hashedPassword = sha512(user.salt + loginUser.password);
          if (user.password == hashedPassword) {
            var returnUser = user.toObject();
            delete returnUser.password;
            delete returnUser.salt;
            res.json(utils.jsonResult(returnUser));
          } else {
            res.status(401).json(utils.jsonResult(new Error('Login failed.')));
          }
        } else {
          res.status(401).json(utils.jsonResult(new Error('Login failed.')));
        }
      });
    } else {
      res.status(400).json(utils.jsonResult('Invalid request data'));
    }
  };

  return {
    login: login
  };
};
