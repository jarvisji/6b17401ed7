/**
 * Created by Ting on 2015/7/21.
 */
angular.module('ylbWxApp')
  .controller('wxSearchDoctorResultCtrl', ['$scope', '$rootScope', '$http', '$state', function ($scope, $rootScope, $http, $state) {
    $rootScope.checkUserVerified();

    if (!$rootScope.searchDoctorResult) {
      // most likely access this page directly.
      $scope.noMoreRecords = true;
    }

    $scope.showMore = function () {
      var lastCreated = $rootScope.searchDoctorResult[$rootScope.searchDoctorResult.length - 1].created;
      $rootScope.searchDoctorParams.filter.created = {'$lt': lastCreated};
      $http.get('/api/doctors', {params: $rootScope.searchDoctorParams})
        .success(function (resp) {
          if (resp.count > 0) {
            $rootScope.searchDoctorResult = $rootScope.searchDoctorResult.concat(resp.data);
            if ($rootScope.searchDoctorParams.limit && resp.count < $rootScope.searchDoctorParams.limit) {
              $scope.noMoreRecords = true;
            }
          } else {
            $scope.noMoreRecords = true;
          }
        }).error(function (err, status) {
          $rootScope.alertError(null, err, status);
        });
    };

    $scope.showDetails = function (idx) {
      var openid = $rootScope.searchDoctorResult[idx].wechat.openid;
      $state.go('profile', {openid: openid});
    }

  }]);
