/**
 * Display doctor profile.
 * Created by Ting on 2015/7/11.
 */
angular.module('ylbWxApp')
  .controller('wxProfileCtrl', ['$scope', '$rootScope', '$stateParams', '$http', '$alert', 'ylb.resources', function ($scope, $rootScope, $stateParams, $http, $alert, resources) {
    var openid = $stateParams.openid;
    if (openid) {
      // load doctor data.
      $http.get('/api/doctors', {params: {filter: {'wechat.openid': openid}}})
        .success(function (res) {
          if (res.count > 0) {
            var doctor = res.data[0];
            if (!$rootScope.checkProfileActivated(doctor)) {
              return;
            }
            $scope.doctor = doctor;
          } else {
            alertErr();
          }
        }).error(function (err) {
          $rootScope.alertError(err);
        });
    } else {
      alertErr();
      return;
    }

    var alertErr = function () {
      console.log('alert');
      $alert({title: '页面加载错误：', content: '请从微信访问此页面。', placement: 'top', type: 'danger', container: '#alert'});
    }
  }]);
