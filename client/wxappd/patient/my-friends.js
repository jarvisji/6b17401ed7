/**
 * Controller of my friends of a patient.
 * Created by Ting on 2015/7/27.
 */
angular.module('ylbWxApp')
  .controller('wxPatientFriendsCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();

    var getMyFriends = function () {
      var currentUserId = currentUser.patient._id;
      $http.get('/api/patients/' + currentUserId + '/friends')
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            resp.data[i].age = commonUtils.calculateAge(resp.data[i].birthday);
            resp.data[i].displaySex = resources.sex[resp.data[i].sex];
          }
          $scope.friends = resp.data;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    var getMyFriendRequests = function () {
      var currentUserId = currentUser.patient._id;
      $http.get('/api/patients/' + currentUserId + '/friends/requests')
        .success(function (resp) {
          $scope.requests = resp.data;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    if (currentUser && currentUser.isPatient) {
      getMyFriends();
      getMyFriendRequests();
    }

    $scope.showRequests = function () {
      $scope.isShowRequests = true;
    };

    $scope.showRequestProfile = function (idx) {
      var openid = $scope.requests[idx].fromOpenid;
      $state.go('profile-patient', {openid: openid});
    };

    // accept friend request
    $scope.accept = function (idx) {
      var reqId = $scope.requests[idx]._id;
      $http.put('/api/patients/friends/requests/' + reqId + '/acceptance')
        .success(function (resp) {
          $scope.requests.splice(idx, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    // reject friend request
    $scope.reject = function (idx) {
      var reqId = $scope.requests[idx]._id;
      $http.put('/api/patients/friends/requests/' + reqId + '/rejection')
        .success(function (resp) {
          $scope.requests.splice(idx, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.showDetails = function (idx) {
      $scope.showDetailIndex = idx;
    };
  }]);
