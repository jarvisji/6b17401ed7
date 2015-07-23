/**
 * Display patient profile.
 * Created by Ting on 2015/7/22.
 */
angular.module('ylbWxApp')
  .controller('wxProfilePatientCtrl', ['$scope', '$rootScope', '$stateParams', '$http', '$alert', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $stateParams, $http, $alert, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    var snapshot = {}; // snapshot data to compare changes.
    var openid = $stateParams.openid;

    var loadPatientData = function () {
      $http.get('/api/patients', {params: {filter: {'wechat.openid': openid}}})
        .success(function (res) {
          if (res.count > 0) {
            var patient = res.data[0];
            preparePatientData(patient);
          } else {
            $rootScope.alertError('', '用户未注册。');
          }
        }).error(function (err) {
          $rootScope.alertError(null, err, status);
        });
    };
    if (openid && currentUser) {
      $scope.isSelf = openid == currentUser.openid;
      loadPatientData();
    }

    var preparePatientData = function (patient) {
      $scope.patient = patient;
      $scope.patient.age = commonUtils.calculateAge(patient.birthday);
      $scope.patient.displaySex = resources.sex[patient.sex];
      $scope.patient.displayLevel = resources.patientLevel[patient.level];
      $rootScope.checkAvatar(patient);
    };
  }]);
