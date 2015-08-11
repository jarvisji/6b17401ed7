/**
 * Display doctor profile.
 * $scope.friendStatus controls status of friend buttons. Check tpl file to see the logic.
 * Created by Ting on 2015/7/11.
 */
angular.module('ylbWxApp')
  .controller('wxProfileCtrl', ['$scope', '$rootScope', '$stateParams', '$http', '$alert', '$modal', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $stateParams, $http, $alert, $modal, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();
    var snapshot = {}; // snapshot data to compare changes.
    var openid = $stateParams.openid ? $stateParams.openid : currentUser.openid

    var loadDoctorData = function () {
      var filter = {filter: {'wechat.openid': openid}};
      if (commonUtils.isObjectId(openid)) {
        filter = {filter: {'_id': openid}};
      }
      $http.get('/api/doctors', {params: filter})
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
      if (commonUtils.isObjectId(openid)) {
        $scope.isSelf = openid == currentUser.id;
      }
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
        $http.get('/api/relations/doctor/' + doctor._id + '/patient/' + currentUser.patient._id)
          .success(function (resp) {
            if (resp.data /*&& resp.data.status == resources.relationStatus.normal.value*/) {
              // as long as have relation, whatever is 'putong', 'jiwang' or 'huizhen', will not display follow button.
              $scope.isFollowed = resp.data._id;
            }
          });
      }

      // prepare services data.
      for (var i = 0; i < doctor.services.length; i++) {
        // type should be one of 'jiahao, suizhen, huizhen'.
        $scope[doctor.services[i].type] = doctor.services[i];
        snapshot[doctor.services[i].type] = angular.copy(doctor.services[i]);
      }

      if (!$scope.jiahao || !$scope.jiahao.weekQuantity) {
        $scope.jiahao = resources.doctorServices.jiahao;
        $scope.jiahao.weekQuantity = {d1: '', d2: '', d3: '', d4: '', d5: ''};
      } else {
        orderJiahaoDays();
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

    // make sure display order is from d1 to d5.
    var orderJiahaoDays = function () {
      var days = Object.keys($scope.jiahao.weekQuantity);
      days.sort();
      var weekQuantity = {};
      for (var i = 0; i < days.length; i++) {
        weekQuantity[days[i]] = $scope.jiahao.weekQuantity[days[i]];
      }
      $scope.jiahao.weekQuantity = weekQuantity;
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
      $scope.jiahao.billingPrice = $scope.jiahao.price.toFixed(2);
      $scope.huizhen.billingPrice = ($scope.huizhen.price * 1.1).toFixed(2);
      $scope.suizhen.billingPrice = ($scope.suizhen.price * 1.1).toFixed(2);
      var servicesData = [$scope.jiahao, $scope.huizhen, $scope.suizhen];

      $http.put('/api/doctors/' + $scope.doctor._id, {services: servicesData})
        .success(function (resp) {
          var updatedServices = resp.data.services;
          for (var i = 0; i < updatedServices.length; i++) {
            $scope[updatedServices[i].type] = updatedServices[i];
          }
          orderJiahaoDays();
        }).error(function (err) {
          $rootScope.alertError(null, err, status);
        });
    };

    /**************************************
     * jiahao
     */
    // Pre-fetch an external template populated with a custom scope
    var addJiahaoModal = $modal({scope: $scope, template: 'wxappd/doctor/add-jiahao-modal.tpl.html', show: false});
    // Show when some event occurs (use $promise property to ensure the template has been loaded)
    $scope.showAddJiahaoModal = function () {
      $http.get('/api/doctors/' + $scope.doctor._id + '/serviceStock')
        .success(function (resp) {
          $scope.serviceStock = [];
          if (resp.data.jiahao) {
            var today = commonUtils.date.getTodayStartDate();
            var thisWeek = resp.data.jiahao.thisWeek;
            for (var i = 0; i < thisWeek.length; i++) {
              if (new Date(thisWeek[i].date) < today) {
                thisWeek[i].isPast = true;
              }
            }
            $scope.serviceStock = resp.data.jiahao;
          }
          if (!$scope.serviceStock.price) {
            $rootScope.alertWarn('', '医生没有设置加号服务价格。');
          } else {
            addJiahaoModal.$promise.then(addJiahaoModal.show);
          }
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    $scope.buyJiahao = function (item) {
      if (item.stock <= 0 || item.isPast) {
        return;
      }
      var newOrder = {
        serviceId: item.serviceId,
        serviceType: resources.doctorServices.jiahao.type,
        doctorId: $scope.doctor._id,
        patientId: currentUser.patient._id,
        price: $scope.serviceStock.price,
        quantity: 1,
        bookingTime: item.date
      };
      $http.post('/api/orders', newOrder)
        .success(function (resp) {
          addJiahaoModal.$promise.then(addJiahaoModal.hide);
          $rootScope.alertSuccess('', '订单已生成，请查看“我的订单”并尽快支付。');
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    /**************************************
     * suizhen
     */
    // Pre-fetch an external template populated with a custom scope
    var addSuizhenModal = $modal({scope: $scope, template: 'wxappd/doctor/add-suizhen-modal.tpl.html', show: false});
    // Show when some event occurs (use $promise property to ensure the template has been loaded)
    $scope.showAddSuizhenModal = function () {
      if (!$scope.suizhen.billingPrice) {
        $rootScope.alertWarn('', '医生没有设置随诊服务价格。');
      } else {
        $scope.modalData = {price: $scope.suizhen.billingPrice, quantity: 1};
        addSuizhenModal.$promise.then(addSuizhenModal.show);
      }
    };
    $scope.buySuizhen = function () {
      if ($scope.modalData.quantity < 1 || $scope.modalData.quantity > 12) {
        $rootScope.alertWarn('', '清输入1-12的数字');
        return;
      }
      var newOrder = {
        serviceId: $scope.suizhen._id,
        serviceType: resources.doctorServices.suizhen.type,
        doctorId: $scope.doctor._id,
        patientId: currentUser.patient._id,
        price: $scope.modalData.price,
        quantity: $scope.modalData.quantity
      };
      $http.post('/api/orders', newOrder)
        .success(function (resp) {
          addSuizhenModal.$promise.then(addSuizhenModal.hide);
          $rootScope.alertSuccess('', '订单已生成，请查看“我的订单”并尽快支付。');
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    /**************************************
     * huizhen
     */
    var addHuizhenModal = $modal({scope: $scope, template: 'wxappd/doctor/add-huizhen-modal.tpl.html', show: false});
    $scope.showAddHuizhenModal = function () {
      if (!currentUser.isPatient) {
        return;
      }
      var currentUserId = currentUser.patient._id;
      $http.get('/api/patients/' + currentUserId + '/doctors')
        .success(function (resp) {
          var modalData = {title: '购买会诊服务'};
          // for better experience, when user selected some doctor, and click 'ok' button, we will not refresh doctors data,
          // so user may open the dialog again to modify selections.
          // if user click 'cancel' button, will clean '$scope.modalData.huizhenDoctors', and refresh all doctors data.
          modalData.huizhenDoctors = $rootScope.generateDoctorDisplayData(resp.data);
          // get huizhen service price.
          for (var idx in modalData.huizhenDoctors) {
            var doctor = modalData.huizhenDoctors[idx];
            var huizhenService = $rootScope.getDoctorServiceByType(doctor, resources.doctorServices.huizhen.type);
            doctor.servicePrice = huizhenService.billingPrice;
          }
          // init order price;
          modalData.orderPrice = 0;
          $scope.modalData = modalData;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
      addSuizhenModal.$promise.then(addHuizhenModal.show);
    };
    $scope.buyHuizhen = function () {
      var serviceId;
      var doctorIds = [];
      for (var i = 0; i < $scope.modalData.huizhenDoctors.length; i++) {
        var doctor = $scope.modalData.huizhenDoctors[i];
        if (doctor.isSelected) {
          doctorIds.push(doctor._id);
          if (!serviceId) {
            // for huizhen, serviceId actually no use since there more than one doctor. Just set it to make sure data validate pass.
            var huizhenService = $rootScope.getDoctorServiceByType(doctor, resources.doctorServices.huizhen.type);
            serviceId = huizhenService._id;
          }
        }
      }
      if (doctorIds.length < 2) {
        $rootScope.alertError('', '至少选择2位医生。', '', 1);
        return;
      }

      var newOrder = {
        serviceId: serviceId,
        serviceType: resources.doctorServices.huizhen.type,
        doctorId: doctorIds,
        patientId: currentUser.id,
        price: $scope.modalData.orderPrice,
        quantity: 1
      };
      $http.post('/api/orders', newOrder)
        .success(function (resp) {
          addSuizhenModal.$promise.then(addHuizhenModal.hide);
          $rootScope.alertSuccess('', '订单已生成，请查看“我的订单”并尽快支付。');
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.cancelHuizhen = function () {
      $scope.modalData.huizhenDoctors = undefined;
      addSuizhenModal.$promise.then(addHuizhenModal.hide);
    };

    $scope.huizhenDoctorChanges = function (idx) {
      var doctor = $scope.modalData.huizhenDoctors[idx];
      if (doctor.isSelected) {
        $scope.modalData.orderPrice += doctor.servicePrice;
      } else {
        $scope.modalData.orderPrice -= doctor.servicePrice;
      }
    };

    // patient follow profile doctor.
    $scope.followDoctor = function () {
      var profileDoctorId = $scope.doctor._id;
      var patientId = currentUser.patient._id;
      $http.post('/api/relations/normal', {
        'doctorId': profileDoctorId,
        'patientId': patientId,
        'memo': $scope.modalData.message
      }).success(function (resp) {
        $rootScope.alertSuccess('', '已加关注。');
        $scope.isFollowed = resp.data._id;
      }).error(function (resp, status) {
        $rootScope.alertError(null, resp, status);
      });
    };

    $scope.unfollowDoctor = function () {
      var profileDoctorId = $scope.doctor._id;
      var patientId = currentUser.patient._id;
      $http.delete('/api/relations/normal/' + $scope.isFollowed)
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
    $scope.showAddFriendModal = function (type) {
      $scope.modalData = {title: '发送添加好友请求', type: type};
      if (type == 'doctor') {
        $scope.modalData.title = '关注医生';
      }
      addFriendModal.$promise.then(addFriendModal.show);
    };

    // doctor add profile doctor as friend.
    $scope.addFriend = function () {
      if ($scope.modalData.type == 'doctor') {
        return $scope.followDoctor();
      }
      var currentDoctorId = currentUser.doctor._id;
      var profileDoctorId = $scope.doctor._id;
      $http.post('/api/doctors/' + currentDoctorId + '/friends/requests', {
        toDoctorId: profileDoctorId,
        message: $scope.modalData.message
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
