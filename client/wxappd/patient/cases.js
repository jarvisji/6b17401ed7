/**
 * Created by Ting on 2015/7/30.
 */
angular.module('ylbWxApp')
  .controller('wxPatientCasesCtrl', ['$scope', '$rootScope', '$stateParams', '$http', '$popover', '$modal', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $stateParams, $http, $popover, $modal, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    var patientId = $stateParams.id ? $stateParams.id : currentUser.patient._id;
    if (!patientId) {
      $rootScope.alertError('', '输入错误，无法显示患者病历。');
    }


    var checkViewCasePrivilege = function () {
      $http.get('/api/patients/' + patientId + '/cases/viewPrivilege')
        .success(function (resp) {
          getPatientCases();
          checkPostCasePrivilege();
        }).error(function (resp, status) {
          if (status === 403) {
            $rootScope.alertError('', '你不能查看此患者病历。');
          } else {
            $rootScope.alertError(null, err, status);
          }
        });
    };
    checkViewCasePrivilege();

    var getPatientCases = function () {
      $http.get('/api/patients/' + patientId + '/cases')
        .success(function (resp) {
          $scope.cases = resp.data;
        }).error(function (resp, status) {
          $rootScope.alertError(null, err, status);
        });
    };

    var checkPostCasePrivilege = function () {
      $http.get('/api/patients/' + patientId + '/cases/postPrivilege')
        .success(function (resp) {
          $scope.hasPostPrivilege = true;
        }).error(function (resp, status) {
          $rootScope.alertError(null, err, status);
        });
    };

    $scope.deleteCase = function (index) {
      console.log('deleteCase', index);
    };

    $scope.createCase = function () {

    };
  }]);
