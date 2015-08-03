/**
 * Display doctor profile.
 * $scope.friendStatus controls status of friend buttons. Check tpl file to see the logic.
 * Created by Ting on 2015/7/11.
 */
angular.module('ylbWxApp')
  .controller('wxProfileCtrl', ['$scope', '$rootScope', '$stateParams', '$http', '$alert', '$modal', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $stateParams, $http, $alert, $modal, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();
    var snapshot = {}; // snapshot data to compare changes.
    var openid = $stateParams.openid;

    var loadDoctorData = function () {
      $http.get('/api/doctors', {params: {filter: {'wechat.openid': openid}}})
        .success(function (res) {
          if (res.count > 0) {
            var doctor = res.data[0];
            prepareDoctorData(doctor);
            preparePageData();
            loadDoctorFriendRelationship();
          } else {
            $rootScope.alertError('', '用户未注册。');
          }
        }).error(function (err) {
          $rootScope.alertError(null, err, status);
        });
    };
    if (openid) {
      $scope.isSelf = openid == currentUser.openid;
      loadDoctorData();
    }

    var loadDoctorFriendRelationship = function () {
      if (currentUser.isDoctor) {
        var profileDoctorId = $scope.doctor._id;
        var currentDoctorId = currentUser.doctor._id;
        if (profileDoctorId != currentDoctorId) {
          $http.get('/api/doctors/friends/' + currentDoctorId + '/' + profileDoctorId)
            .success(function (resp) {
              $scope.friendStatus = resp.data;
              $scope.friendStatus.isFromMe = resp.data.from == currentDoctorId;
              $scope.friendStatus.isToMe = resp.data.to == currentDoctorId;
            }).error(function (resp, status) {
              if (status == 404) {
                // the two doctors are not friends, also no pending requests. Nothing to do.
              } else {
                $rootScope.alertError(null, err, status);
              }
            });
        }
      }
    };

    var prepareDoctorData = function (doctor) {
      $scope.doctor = doctor;
      $scope.doctor.age = commonUtils.calculateAge(doctor.birthday);
      $scope.doctor.displaySex = resources.sex[doctor.sex];
      $scope.doctor.displayLevel = resources.doctorLevel[doctor.level];
      $rootScope.checkAvatar(doctor);

      // get current user follow this doctor or not.
      if (currentUser.isPatient) {
        $http.get('/api/patients/' + currentUser.patient._id + '/follows/' + doctor._id)
          .success(function (resp) {
            $scope.isFollowed = resp.data;
          });
      }

      // prepare services data.
      for (var i = 0; i < doctor.services.length; i++) {
        // type should be one of 'jiahao, suizhen, huizhen'.
        $scope[doctor.services[i].type] = doctor.services[i];
        snapshot[doctor.services[i].type] = angular.copy(doctor.services[i]);
      }

      if (!$scope.jiahao) {
        $scope.jiahao = resources.doctorServices.jiahao;
        $scope.jiahao.weekQuantity = {d1: '', d2: '', d3: '', d4: '', d5: ''};
      } else {
        // make sure display order is from d1 to d5.
        var days = Object.keys($scope.jiahao.weekQuantity);
        days.sort();
        var weekQuantity = {};
        for (var i = 0; i < days.length; i++) {
          weekQuantity[days[i]] = $scope.jiahao.weekQuantity[days[i]];
        }
        $scope.jiahao.weekQuantity = weekQuantity;
        console.log(weekQuantity);
      }
      snapshot.jiahao = angular.copy($scope.jiahao);

      if (!$scope.suizhen) {
        $scope.suizhen = resources.doctorServices.suizhen;
        snapshot.suizhen = angular.copy($scope.suizhen);
      }
      if (!$scope.huizhen) {
        $scope.huizhen = resources.doctorServices.huizhen;
        snapshot.huizhen = angular.copy($scope.huizhen);
      }
    };

    var preparePageData = function () {
      // get days display names for jiahao service.
      $scope.days = resources.days;

      // check doctor level for service privilege.
      if ($scope.doctor.level == 1) {
        $scope.disableServicePrivilege = true;
      }
      commonUtils.checkDoctorVIcon($scope.doctor);
    };

    /**
     * Toggle edit status of JiaHao.
     */
    $scope.editJiahao = function () {
      if ($scope.editingJiahao) {
        // save
        if (!angular.equals(snapshot.jiahao, $scope.jiahao)) {
          updateService();
        }
      } else {
        // edit
      }
      $scope.editingJiahao = !$scope.editingJiahao;
    };
    /**
     * Toggle edit status of SuiZhen.
     */
    $scope.editSuizhen = function () {
      if ($scope.editingSuizhen) {
        // save
        if (!angular.equals(snapshot.suizhen, $scope.suizhen)) {
          updateService();
        }
      } else {
        // edit
      }
      $scope.editingSuizhen = !$scope.editingSuizhen;
    };
    /**
     * Toggle edit status of HuiZhen.
     */
    $scope.editHuizhen = function () {
      if ($scope.editingHuizhen) {
        // save
        if (!angular.equals(snapshot.huizhen, $scope.huizhen)) {
          updateService();
        }
      } else {
        // edit
      }
      $scope.editingHuizhen = !$scope.editingHuizhen;
    };

    /**
     * PUT '/api/doctors/:id' will overwrite services, so need put data for all services even only changed one.
     */
    var updateService = function () {
      var servicesData = [$scope.jiahao, $scope.huizhen, $scope.suizhen];
      $http.put('/api/doctors/' + $scope.doctor._id, {services: servicesData})
        .success(function (resp) {
          var updatedServices = resp.data.services;
          for (var i = 0; i < updatedServices.length; i++) {
            $scope[updatedServices[i].type] = updatedServices [i];
          }

        }).error(function (err) {
          $rootScope.alertError(null, err, status);
        });
    };

    $scope.buyJiahao = function () {

    };

    $scope.buyHuizhen = function () {

    };

    $scope.buySuizhen = function () {

    };

    // patient follow profile doctor.
    $scope.followDoctor = function () {
      var profileDoctorId = $scope.doctor._id;
      var patientId = currentUser.patient._id;
      $http.post('/api/patients/' + patientId + '/follows', {'doctorId': profileDoctorId})
        .success(function (resp) {
          $rootScope.alertSuccess('', '已加关注。');
          $scope.isFollowed = true;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.unfollowDoctor = function () {
      var profileDoctorId = $scope.doctor._id;
      var patientId = currentUser.patient._id;
      $http.delete('/api/patients/' + patientId + '/follows/' + profileDoctorId)
        .success(function (resp) {
          $rootScope.alertSuccess('', '已取消关注。');
          $scope.isFollowed = false;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    // Pre-fetch an external template populated with a custom scope
    var addFriendModal = $modal({scope: $scope, template: 'wxappd/profile/add-friend-modal.tpl.html', show: false});
    // Show when some event occurs (use $promise property to ensure the template has been loaded)
    $scope.showAddFriendModal = function () {
      addFriendModal.$promise.then(addFriendModal.show);
    };

    // doctor add profile doctor as friend.
    $scope.addFriend = function (message) {
      var currentDoctorId = currentUser.doctor._id;
      var profileDoctorId = $scope.doctor._id;
      $http.post('/api/doctors/' + currentDoctorId + '/friends/requests', {
        toDoctorId: profileDoctorId,
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
      $http.delete('/api/doctors/friends/requests/' + reqId)
        .success(function (resp) {
          $scope.friendStatus = undefined;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

  }]);
