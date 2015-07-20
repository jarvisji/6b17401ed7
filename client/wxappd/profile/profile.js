/**
 * Display doctor profile.
 * Created by Ting on 2015/7/11.
 */
angular.module('ylbWxApp')
  .controller('wxProfileCtrl', ['$scope', '$rootScope', '$stateParams', '$http', '$alert', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $stateParams, $http, $alert, resources, commonUtils) {
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
            prepareDoctorDate(doctor);
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

    var prepareDoctorDate = function (doctor) {
      $scope.doctor = doctor;
      $scope.doctor.age = commonUtils.calculateAge(doctor.birthday);
      $scope.doctor.displaySex = resources.sex[doctor.sex];

      // prepare services data.
      for (var i = 0; i < doctor.services.length; i++) {
        // type should be one of 'jiahao, suizhen, huizhen'.
        $scope[doctor.services[i].type] = doctor.services[i];
      }
      if (!$scope.jiahao) {
        $scope.jiahao = {type: 'jiahao'};
      }
      if (!$scope.suizhen) {
        $scope.suizhen = {type: 'suizhen'};
      }
      if (!$scope.huizhen) {
        $scope.huizhen = {type: 'huizhen'};
      }
    };

    var alertErr = function () {
      console.log('alert');
      $alert({title: '页面加载错误：', content: '请从微信访问此页面。', placement: 'top', type: 'danger', container: '#alert'});
    };

    /**
     * Toggle edit status of SuiZhen.
     */
    $scope.editSuizhen = function () {
      if ($scope.editingSuizhen) {
        // save
        console.log('save', $scope.suizhen);
      } else {
        // edit
        console.log('edit');
      }
      $scope.editingSuizhen = !$scope.editingSuizhen;
    };
    /**
     * Toggle edit status of HuiZhen.
     */
    $scope.editHuizhen = function () {
      if ($scope.editingHuizhen) {
        // save
        console.log('save', $scope.huizhen);
      } else {
        // edit
        console.log('edit');
      }
      $scope.editingHuizhen = !$scope.editingHuizhen;
    };
  }]);
