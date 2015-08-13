/**
 * Display patient profile.
 * Created by Ting on 2015/7/22.
 */
angular.module('ylbWxApp')
  .controller('wxProfilePatientCtrl', ['$scope', '$rootScope', '$stateParams', '$http', '$alert', '$modal', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $stateParams, $http, $alert, $modal, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();
    var snapshot = {}; // snapshot data to compare changes.
    var openid = $stateParams.openid ? $stateParams.openid : currentUser.openid;

    var loadPatientData = function () {
      var filter = {filter: {'wechat.openid': openid}};
      if (commonUtils.isObjectId(openid)) {
        filter = {filter: {'_id': openid}};
      }
      $http.get('/api/patients', {params: filter})
        .success(function (res) {
          if (res.count > 0) {
            var patient = res.data[0];
            preparePatientData(patient);
            loadFriendRelationship();
          } else {
            $rootScope.alertError('', '用户未注册。');
          }
        }).error(function (err) {
          $rootScope.alertError(null, err, status);
        });
    };
    if (openid && currentUser) {
      $scope.isSelf = openid == currentUser.openid;
      if (commonUtils.isObjectId(openid)) {
        $scope.isSelf = openid == currentUser.id;
      }
      loadPatientData();
    }

    var preparePatientData = function (patient) {
      $scope.patient = patient;
      $scope.patient.age = commonUtils.calculateAge(patient.birthday);
      $scope.patient.displaySex = resources.sex[patient.sex];
      $scope.patient.displayLevel = resources.patientLevel[patient.level];
    };

    var loadFriendRelationship = function () {
      if (currentUser.isPatient) {
        var profileId = $scope.patient._id;
        var currentId = currentUser.patient._id;
        if (profileId != currentId) {
          $http.get('/api/patients/friends/' + currentId + '/' + profileId)
            .success(function (resp) {
              $scope.friendStatus = resp.data;
              $scope.friendStatus.isFromMe = resp.data.from == currentId;
              $scope.friendStatus.isToMe = resp.data.to == currentId;
            }).error(function (resp, status) {
              if (status == 404) {
                // the two patients are not friends, also no pending requests. Nothing to do.
              } else {
                $rootScope.alertError(null, err, status);
              }
            });
        }
      }
    };

    // Pre-fetch an external template populated with a custom scope
    var addFriendModal = $modal({scope: $scope, template: 'wxappd/profile/add-friend-modal.tpl.html', show: false});
    // Show when some event occurs (use $promise property to ensure the template has been loaded)
    $scope.showAddFriendModal = function () {
      addFriendModal.$promise.then(addFriendModal.show);
    };

    // patient add profile patient as friend.
    $scope.addFriend = function (message) {
      var currentId = currentUser.patient._id;
      var profileId = $scope.patient._id;
      $http.post('/api/patients/' + currentId + '/friends/requests', {
        toPatientId: profileId,
        message: message
      }).success(function (resp) {
        $rootScope.alertSuccess('', '添加好友请求已发送。');
        $scope.friendStatus = {isFromMe: true, status: 'requested'};
      }).error(function (resp, status) {
        if (status === 409) {
          $rootScope.alertSuccess('', '添加好友请求已发送。');
          $scope.friendStatus = {isFromMe: true, status: 'requested'};
        }
        else
          $rootScope.alertError(null, resp, status);
      });
    };

    $scope.deleteFriend = function (reqId) {
      $http.delete('/api/patients/friends/requests/' + reqId)
        .success(function (resp) {
          $scope.friendStatus = undefined;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
  }]);
