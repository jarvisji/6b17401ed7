/**
 * Created by Ting on 2015/8/19.
 */

var sha512 = require('crypto-js/sha512');
var debug = require('debug')('ylb.adminCtrl');
var utils = require('../middleware/utils');
var fs = require('fs');
var multer = require('multer');
var conf = require('../conf');


module.exports = function (app) {
  var AdminUser = app.models.AdminUser;
  var ShopItem = app.models.ShopItem;

  /**
   * POST '/admin/login'
   * @param req
   * @param res
   */
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
            var tokenStr = generateToken(returnUser._id);
            returnUser.token = tokenStr;
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

  /**
   * POST '/admin/goods'
   * @param req
   * @param res
   */
  var createGoods = function (req, res) {
    if (!verifyToken(req, res)) {
      return;
    }
    var newItem = req.body;
    debug('createGood(), creating new item: %o', newItem);
    ShopItem.create(newItem, function (err, created) {
      if (err) return utils.handleError(err, 'createGood()', debug, res);
      debug('createGood(), success');
      res.json(utils.jsonResult(created));
    });
  };
  /**
   * PUT '/admin/goods/:id'
   * @param req
   * @param res
   */
  var updateGoods = function (req, res) {
    if (!verifyToken(req, res)) {
      return;
    }
    var id = req.params.id;
    var newItem = req.body;
    debug('updateGood(), updating new item: %o', newItem);
    ShopItem.update({'_id': id}, newItem, function (err, updated) {
      if (err) return utils.handleError(err, 'updateGood()', debug, res);
      debug('updateGood(), success');
      res.json(utils.jsonResult(updated));
    });
  };
  /**
   * GET '/admin/goods'
   * @param req
   * @param res
   */
  var getGoods = function (req, res) {
    ShopItem.find({}).sort({created: -1}).exec()
      .then(function (items) {
        debug('getGoods(), success');
        res.json(utils.jsonResult(items));
      }).then(null, function (err) {
        if (err) return utils.handleError(err, 'getGoods()', debug, res);
      });
  };

  /**
   * DELETE '/admin/goods/:id'
   * @param req
   * @param res
   */
  var deleteGoods = function (req, res) {
    if (!verifyToken(req, res)) {
      return;
    }
    var id = req.params.id;
    ShopItem.remove({'_id': id}, function (err, ret) {
      if (err) return utils.handleError(err, 'deleteGood()', debug, res);
      debug('deleteGood(), success');
      res.json('success');
    });
  };

  /**
   * GET '/admin/goods/:id'
   * @param req
   * @param res
   */
  var getGoodsDetail = function (req, res) {
    var id = req.params.id;
    ShopItem.findById(id, function (err, item) {
      if (err) return utils.handleError(err, 'getGoodsDetail()', debug, res);
      debug('getGoodsDetail(), success, id: %s', id);
      res.json(utils.jsonResult(item));
    });
  };

  var generateToken = function (userId) {
    var tokenStr = Math.round((new Date().valueOf() * Math.random()));
    var token = {token: tokenStr, userId: userId};
    if (!app.tokens) {
      app.tokens = {};
      app.tokens[tokenStr] = token;
    } else {
      // remove exist token.
      for (var token in app.tokens) {
        if (app.tokens[token].userId == userId) {
          delete app.tokens[token];
          break;
        }
      }
      app.tokens[tokenStr] = token;
    }
    return tokenStr;
  };

  var verifyToken = function (req, res) {
    var tokenStr = req.get('token');
    debug('verify token: %s, app.tokens: %o', tokenStr, app.tokens);
    if (!app.tokens)
      app.tokens = {};
    //var authorizationStr = req.get('Authorization');

    if (!tokenStr || !app.tokens[tokenStr]) {
      res.status(403).json(utils.jsonResult(new Error('no privilege')));
    }
    var ret = app.tokens[tokenStr] != undefined;
    debug('verifying token: %s, result: %s', tokenStr, ret);
    return ret;
  };

  var upload = function (req, res) {
    var ret;
    var uploader = multer({
      dest: 'upload/shop/',
      onFileUploadComplete: function (file) {
        var serverUrl = conf.serverUrl;
        if (serverUrl.substr(serverUrl.length - 1, 1) != '/') {
          serverUrl += '/';
        }
        var filePath = conf.serverUrl + file.path.replace(/\\/g, '/');
        debug('upload(), success: %s', filePath);
        ret = {status: 'OK', url: filePath};
      }
    });
    uploader(req, res, function (err) {
      if (err) {
        debug('upload() error: %o', err);
        res.status(500).json(utils.jsonResult(err));
      } else {
        res.json(ret);
      }
    });
  };

  return {
    login: login,
    createGoods: createGoods,
    updateGoods: updateGoods,
    deleteGoods: deleteGoods,
    getGoods: getGoods,
    getGoodsDetail: getGoodsDetail,
    upload: upload
  };
};