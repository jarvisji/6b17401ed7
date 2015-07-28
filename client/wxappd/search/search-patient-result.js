/**
 * Created by Ting on 2015/7/28.
 */
angular.module('ylbWxApp')
  .controller('wxSearchPatientResultCtrl', ['$scope', '$rootScope', '$http', '$state', function ($scope, $rootScope, $http, $state) {
    $rootScope.checkUserVerified();

    if (!$rootScope.searchPatientResult) {
      // most likely access this page directly.
      $scope.noMoreRecords = true;
    }

    $scope.showMore = function () {
      var lastCreated = $rootScope.searchPatientResult[$rootScope.searchPatientResult.length - 1].created;
      $rootScope.searchPatientParams.filter.created = {'$lt': lastCreated};
      $http.get('/api/patients', {params: $rootScope.searchPatientParams})
        .success(function (resp) {
          if (resp.count > 0) {
            $rootScope.searchPatientResult = $rootScope.searchPatientResult.concat(resp.data);
            if ($rootScope.searchPatientParams.limit && resp.count < $rootScope.searchPatientParams.limit) {
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
      var openid = $rootScope.searchPatientResult[idx].wechat.openid;
      $state.go('profile-patient', {openid: openid});
    };
  }]);
