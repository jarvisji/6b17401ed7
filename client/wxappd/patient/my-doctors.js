/**
 * Controller of display my doctors, include followed, and doctors with order relationship. for current patient.
 * Created by Ting on 2015/7/24.
 */
angular.module('ylbWxApp')
  .controller('wxMyDoctorsCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    $scope.uiFlags = {type: 'suizhen'};
    var rStatus = resources.relationStatus;
    var putong = [];
    var jiwang = [];
    var suizhen = [];

    var getDoctorRelations = function () {
      $http.get('/api/patients/' + currentUser.id + '/doctorRelations')
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            var data = resp.data[i];
            data.doctor.relationId = data._id; // save relationId for delete.
            if (data.status == rStatus.normal.value) {
              putong.push(data.doctor);
            } else if (data.status == rStatus.jiwang.value) {
              jiwang.push(data.doctor);
            } else if (data.status == rStatus.suizhen.value) {
              suizhen.push(data.doctor);
            }
          }
          commonUtils.checkDoctorVIcon(putong);
          commonUtils.checkDoctorVIcon(jiwang);
          commonUtils.checkDoctorVIcon(suizhen);
          $scope.doctors = suizhen;

          console.log(putong);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    getDoctorRelations();


    /**
     * Show doctor profile.
     * @param openid
     */
    $scope.showDetails = function (openid) {
      $state.go('profile', {openid: openid});
    };

    $scope.displayDoctors = function (type) {
      $scope.uiFlags.type = type;
      if (type == 'suizhen') {
        $scope.doctors = suizhen;
      } else if (type == 'jiwang') {
        $scope.doctors = jiwang;
      } else if (type == 'putong') {
        $scope.doctors = putong;
      }
    };

    // when patient swipe left, can delete 'jiwang' and 'putong' relations.
    $scope.onSwipeLeft = function (index) {
      if ($scope.uiFlags.type != 'suizhen') {
        for (var i = 0; i < $scope.doctors.length; i++) {
          $scope.doctors[i].isShowDeleteButton = false;
        }
        $scope.doctors[index].isShowDeleteButton = true;
      }
    };

    $scope.deleteRelation = function (index) {
      var relationId = $scope.doctors[index].relationId;
      $http.delete('/api/relations/'+ relationId)
        .success(function(resp){
          $scope.doctors.splice(index, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });

    }
  }]);
