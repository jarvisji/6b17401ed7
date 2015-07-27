/**
 * Controller of my friends of a doctor.
 * Created by Ting on 2015/7/27.
 */
angular.module('ylbWxApp')
  .controller('wxDoctorFriendsCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();

    var getMyFriends = function () {
      var currentUserId = currentUser.doctor._id;
      $http.get('/api/doctors/' + currentUserId + '/friends')
        .success(function (resp) {
          $scope.friends = resp.data;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    var getMyFriendRequests = function () {
      var currentUserId = currentUser.doctor._id;
      $http.get('/api/doctors/' + currentUserId + '/friends/requests')
        .success(function (resp) {
          $scope.requests = resp.data;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    if (currentUser && currentUser.isDoctor) {
      getMyFriends();
      getMyFriendRequests();
    }

    $scope.showRequests = function () {
      $scope.isShowRequests = true;
    };

    $scope.showRequestDoctorProfile = function (idx) {
      var openid = $scope.requests[idx].fromOpenid;
      $state.go('profile', {openid: openid});
    };

    // accept friend request
    $scope.accept = function (idx) {
      var reqId = $scope.requests[idx]._id;
      $http.put('/api/doctors/friends/requests/' + reqId + '/acceptance')
        .success(function (resp) {
          $scope.requests.splice(idx, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    // reject friend request
    $scope.reject = function (idx) {
      var reqId = $scope.requests[idx]._id;
      $http.put('/api/doctors/friends/requests/' + reqId + '/rejection')
        .success(function (resp) {
          $scope.requests.splice(idx, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.showDetails = function (idx) {
      var openid = $scope.friends[idx].wechat.openid;
      $state.go('profile', {openid: openid});
    };
  }]);
