/**
 * Created by Ting on 2015/7/17.
 */
module.exports = function () {
  var defaultResource = {
    'event.subscribe.welcome': '欢迎关注医联邦微信公众号。'
  };

  return {
    get: function (key) {
      return defaultResource[key];
    }
  };
};
