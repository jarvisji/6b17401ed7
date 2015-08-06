/**
 * Controller of display my doctors, include followed, and doctors with order relationship. for current patient.
 * Created by Ting on 2015/7/24.
 */
angular.module('ylbWxApp')
  .controller('wxMyDoctorsCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    $scope.displayType = 'putong';

    var getFollowedDoctors = function () {
      $http.get('/api/patients/' + currentUser.patient._id + '/follows?expand=true')
        .success(function (resp) {
          commonUtils.checkDoctorVIcon(resp.data);
          $scope.doctors = $scope.doctorFollowed = resp.data;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    var getOrderDoctors = function () {
      $http.get('/api/patients/' + currentUser.patient._id + '/doctors')
        .success(function (resp) {
          commonUtils.checkDoctorVIcon(resp.data.doctorInService);
          commonUtils.checkDoctorVIcon(resp.data.doctorPast);
          $scope.doctorSuizhen = resp.data.doctorInService;
          $scope.doctorJiwang = resp.data.doctorPast;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    getFollowedDoctors();
    getOrderDoctors();


    /**
     * Show doctor profile.
     * @param openid
     */
    $scope.showDetails = function (openid) {
      $state.go('profile', {openid: openid});
    };

    $scope.displayDoctors = function (type) {
      console.log(type);
      if (type == 'suizhen') {
        if (!$scope.doctorSuizhen) {
          getOrderDoctors();
        } else {
          $scope.doctors = $scope.doctorSuizhen;
        }
      } else if (type == 'jiwang') {
        if (!$scope.doctorJiwang) {
          getOrderDoctors();
        } else {
          $scope.doctors = $scope.doctorJiwang;
        }
      } else if (type == 'putong') {
        if (!$scope.doctorFollowed) {
          getFollowedDoctors();
        } else {
          $scope.doctors = $scope.doctorFollowed;
        }
      }
    };
  }]);
