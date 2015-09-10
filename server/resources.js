/**
 * Created by Ting on 2015/7/17.
 */
module.exports = function () {
  var defaultResource = {
    'event.subscribe.welcome': '欢迎关注医联邦微信公众号。',
    'event.subscribe.exist.doctor': '您已注册为医生，不能同时注册患者。',
    'event.subscribe.exist.patient': '您已注册为患者，不能同时注册医生。'
  };

  return {
    get: function (key) {
      return defaultResource[key];
    }
  };
};
