/**
 * Display doctor profile.
 * Created by Ting on 2015/7/11.
 */
angular.module('ylbWxApp')
  .controller('wxProfileCtrl', ['$scope', '$rootScope', '$stateParams', '$http', '$alert', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $stateParams, $http, $alert, resources, commonUtils) {
    var snapshot = {}; // snapshot data to compare changes.
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
            prepareDoctorData(doctor);
            preparePageData();
          } else {
            alertErr();
          }
        }).error(function (err) {
          $rootScope.alertError(null, err, status);
        });
    } else {
      alertErr();
      return;
    }

    var prepareDoctorData = function (doctor) {
      $scope.doctor = doctor;
      $scope.doctor.age = commonUtils.calculateAge(doctor.birthday);
      $scope.doctor.displaySex = resources.sex[doctor.sex];
      $scope.doctor.displayLevel = resources.doctorLevel[doctor.level];

      // prepare services data.
      for (var i = 0; i < doctor.services.length; i++) {
        // type should be one of 'jiahao, suizhen, huizhen'.
        $scope[doctor.services[i].type] = doctor.services[i];
        snapshot[doctor.services[i].type] = angular.copy(doctor.services[i]);
      }
      if (!$scope.jiahao) {
        $scope.jiahao = resources.doctorServices.jiahao;
        $scope.jiahao.weekQuantity = {d1: '', d2: '', d3: '', d4: '', d5: ''};
        snapshot.jiahao = angular.copy($scope.jiahao);
      }
      if (!$scope.suizhen) {
        $scope.suizhen = resources.doctorServices.suizhen;
        snapshot.suizhen = angular.copy($scope.suizhen);
      }
      if (!$scope.huizhen) {
        $scope.huizhen = resources.doctorServices.huizhen;
        snapshot.huizhen = angular.copy($scope.huizhen);
      }
    };

    var preparePageData = function () {
      // get days display names for jiahao service.
      $scope.days = resources.days;

      // check doctor level for service privilege.
      if ($scope.doctor.level == 1) {
        $scope.disableServicePrivilege = true;
      }

      // TODO: check current wchat user is doctor himself or not.
      $scope.isSelf = true;

    };

    var alertErr = function () {
      $alert({title: '页面加载错误：', content: '请从微信访问此页面。', placement: 'top', type: 'danger', container: '#alert'});
    };

    /**
     * Toogle edit status of JiaHao.
     */
    $scope.editJiahao = function () {
      if ($scope.editingJiahao) {
        // save
        if (!angular.equals(snapshot.jiahao, $scope.jiahao)) {
          updateService();
        }
      } else {
        // edit
      }
      $scope.editingJiahao = !$scope.editingJiahao;
    };
    /**
     * Toggle edit status of SuiZhen.
     */
    $scope.editSuizhen = function () {
      if ($scope.editingSuizhen) {
        // save
        if (!angular.equals(snapshot.suizhen, $scope.suizhen)) {
          updateService();
        }
      } else {
        // edit
      }
      $scope.editingSuizhen = !$scope.editingSuizhen;
    };
    /**
     * Toggle edit status of HuiZhen.
     */
    $scope.editHuizhen = function () {
      if ($scope.editingHuizhen) {
        // save
        if (!angular.equals(snapshot.huizhen, $scope.huizhen)) {
          updateService();
        }
      } else {
        // edit
      }
      $scope.editingHuizhen = !$scope.editingHuizhen;
    };

    /**
     * PUT '/api/doctors/:id' will overwrite services, so need put data for all services even only changed one.
     */
    var updateService = function () {
      var servicesData = [$scope.jiahao, $scope.huizhen, $scope.suizhen];
      $http.put('/api/doctors/' + $scope.doctor._id, {services: servicesData})
        .success(function (resp) {
          var updatedServices = resp.data.services;
          for (var i = 0; i < updatedServices.length; i++) {
            $scope[updatedServices[i].type] = updatedServices [i];
          }

        }).error(function (err) {
          $rootScope.alertError(null, err, status);
        });
    };

    $scope.buyJiahao = function () {

    };

    $scope.buyHuizhen = function () {

    };

    $scope.buySuizhen = function () {

    };

    $scope.followDoctor = function() {

    };

  }])
;
