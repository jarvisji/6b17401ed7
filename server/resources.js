/**
 * Created by Ting on 2015/7/17.
 */
module.exports = function () {
  var defaultResource = {
    'event.subscribe.welcome': '欢迎关注医患通微信公众号，我们致力打造便捷可信的医患沟通渠道。系统即将全面公测，敬请期待。【合肥光荫科技信息有限公司版权所有】',
    'event.subscribe.exist.doctor': '您已注册为医生，不能同时注册患者。',
    'event.subscribe.exist.patient': '您已注册为患者，不能同时注册医生。'
  };

  return {
    get: function (key) {
      return defaultResource[key];
    }
  };
};
