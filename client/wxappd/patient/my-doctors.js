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
        });
    };
    if (currentUser && currentUser.isPatient) {
      getFollowedDoctors();
    }

    var getSuizhenDoctors = function () {
      $scope.doctors = $scope.doctorSuizhen = [];
    };

    var getJiwangDoctors = function () {
      $scope.doctors = $scope.doctorJiwang = [];
    };

    /**
     * Show doctor profile.
     * @param openid
     */
    $scope.showDetails = function (openid) {
      $state.go('profile', {openid: openid});
    };

    $scope.displayDoctors = function (type) {
      if (type == 'suizhen') {
        if (!$scope.doctorSuizhen) {
          getSuizhenDoctors();
        } else {
          $scope.doctors = $scope.doctorSuizhen;
        }
      } else if (type == 'jiwang') {
        if (!$scope.doctorJiwang) {
          getJiwangDoctors();
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
