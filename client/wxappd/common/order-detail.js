/**
 * Created by Ting on 2015/8/5.
 */
angular.module('ylbWxApp')
  .controller('wxOrderDetailCtrl', ['$scope', '$rootScope', '$http', '$state', '$stateParams', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, $stateParams, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();
    var stateName = $state.current.name;
    var orderId = $stateParams.id;
    var sType = resources.doctorServices;

    var getOrderInfo = function () {
      $http.get('/api/orders/' + orderId)
        .success(function (resp) {
          var order = resp.data;
          $rootScope.checkCommentAvatar(order.comments);
          checkCommentCanBeDelete(order.comments);
          commonUtils.date.convert2FriendlyDate(order.comments);
          $rootScope.handleDisplayBookingTime(order);
          handleUIFlags(order);
          calculateServicePrice(order);

          if (!order.rank || !order.rank.stars) {
            order.rank = {};
            checkRankStars(0);
          } else {
            checkRankStars(order.rank.stars);
          }

          $scope.order = order;
          getPatientInfo();
        }).error(function (resp, status) {
          if (status == 403) {
            $rootScope.alertError('', '不能查看他人的订单。');
          } else {
            $rootScope.alertError(null, resp, status);
          }
        });
    };

    var getNonServiceOrderInfo = function () {
      $http.get('/api/orders/non-service' + orderId)
        .success(function (resp) {
          var order = resp.data;
          $scope.order = order;
        }).error(function (resp, status) {
          if (status == 403) {
            $rootScope.alertError('', '不能查看他人的订单。');
          } else {
            $rootScope.alertError(null, resp, status);
          }
        });
    };

    if (stateName == 'order-non-service-detail') {
      getNonServiceOrderInfo();
    } else {
      getOrderInfo();
    }

    var getPatientInfo = function () {
      var patientId = $scope.order.patient.id;
      if (patientId) {
        $http.get('/api/patients/' + patientId)
          .success(function (resp) {
            var patient = resp.data;
            $rootScope.generatePatientDisplayData(patient);
            $scope.patient = patient;
          }).error(function (resp, status) {
            $rootScope.alertError(null, resp, status);
          });
      }
    };

    var calculateServicePrice = function (order) {
      var sum = 0;
      for (var i = 0; i < order.doctors.length; i++) {
        sum += order.doctors[i].servicePrice;
      }
      order.servicePrice = sum;
    };

    var checkRankStars = function (stars) {
      if (!stars) {
        $scope.rankStars = [];
        $scope.rankStarsO = [1, 2, 3, 4, 5];
      } else {
        var rankStars = [];
        for (var i = 1; i <= stars; i++) {
          rankStars.push(i);
        }
        var rankStarsO = [];
        for (var i = 5; i > stars; i--) {
          rankStarsO.unshift(i);
        }
        $scope.rankStars = rankStars;
        $scope.rankStarsO = rankStarsO;
      }
    };

    $scope.newComment = {};
    $scope.createComment = function () {
      $http.post('/api/orders/' + orderId + '/comments', $scope.newComment)
        .success(function (resp) {
          var comments = resp.data.comments;
          checkCommentCanBeDelete(comments);
          $rootScope.checkCommentAvatar(comments);
          commonUtils.date.convert2FriendlyDate(comments);
          $scope.order.comments = comments;
          $scope.newComment = {};
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.deleteComment = function (index) {
      var commentId = $scope.order.comments[index]._id;
      $http.delete('/api/orders/' + orderId + '/comments/' + commentId)
        .success(function (resp) {
          $scope.order.comments.splice(index, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.toggleSetBookingTime = function () {
      $scope.isEditingBookingTime = !$scope.isEditingBookingTime;
    };
    $scope.saveBookingTime = function () {
      var newDate = $scope.order.bookingTimeDate;
      var newTime = $scope.order.bookingTimeTime;
      if (newDate && newTime) {
        newDate.setHours(newTime.getHours(), newTime.getMinutes());
        $http.put('/api/orders/' + orderId, {bookingTime: newDate})
          .success(function (resp) {
            $scope.order.bookingTime = newDate;
            $rootScope.handleDisplayBookingTime($scope.order);
            handleUIFlags($scope.order);
            $scope.isEditingBookingTime = false;
          }).error(function (resp, status) {
            $rootScope.alertError(null, resp, status);
          });
      }
    };

    $scope.showCases = function () {
      $state.go('patient-cases', {id: $scope.order.patient.id});
    };

    $scope.payment = function () {
      if (!currentUser.isPatient) {
        return;
      }
      if (!$scope.order.bookingTime) {
        $rootScope.alertWarn('', '请先预约时间。', '', 1);
        return;
      }
      //TODO: this will be replace by wechat payment. Currently update status directly.
      $http.put('/api/orders/' + orderId + '/status/' + resources.orderStatus.paid.value, {})
        .success(function (resp) {
          $scope.order.status = resources.orderStatus.paid.value;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.doctorRejectBookingTime = function () {
      $http.put('/api/orders/' + orderId + '/status/' + resources.orderStatus.rejected.value, {})
        .success(function (resp) {
          $scope.order.status = resp.data.status;
          $scope.order.doctors = resp.data.doctors;
          //$scope.order = resp.data;
          //for (var idx in $scope.order.doctors) {
          //  if ($scope.order.doctors[idx].id == currentUser.id) {
          //    $scope.order.doctors[idx].isConfirmed = false;
          //    break;
          //  }
          //}
          handleUIFlags($scope.order);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.doctorAcceptBookingTime = function () {
      $http.put('/api/orders/' + orderId + '/status/' + resources.orderStatus.confirmed.value, {})
        .success(function (resp) {
          $scope.order.status = resp.data.status;
          $scope.order.doctors = resp.data.doctors;
          //for (var idx in $scope.order.doctors) {
          //  if ($scope.order.doctors[idx].id == currentUser.id) {
          //    $scope.order.doctors[idx].isConfirmed = true;
          //    break;
          //  }
          //}
          handleUIFlags($scope.order);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.setRank = function (val) {
      checkRankStars(val);
      $scope.order.rank.stars = val;
    };

    $scope.saveRank = function () {
      if (!$scope.order.rank.stars) {
        $rootScope.alertWarn('', '请选择星级', '', 1);
        return;
      }
      $http.put('/api/orders/' + orderId, {rank: $scope.order.rank})
        .success(function (resp) {
          handleUIFlags($scope.order);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    var checkCommentCanBeDelete = function (comments) {
      for (var idx in comments) {
        if (comments[idx].creator.id == currentUser.id) {
          comments[idx].canDelete = true;
        }
      }
    };

    var handleUIFlags = function (order) {
      var flags = {isShowCommentInput: true};
      if (order.serviceType == sType.huizhen.type) {
        flags.isShowHuizhenDoctors = true;
      }
      if (order.status == resources.orderStatus.expired.value) {
        flags.isShowCommentInput = false;
      }
      if (currentUser.isDoctor) {
        if (order.serviceType == sType.huizhen.type) {
          for (var idx in order.doctors) {
            var doctor = order.doctors[idx];
            if (doctor.id == currentUser.id && doctor.isConfirmed == undefined) {
              flags.isShowDoctorConfirmButtons = true;
              break;
            }
          }
        } else if (order.serviceType == sType.suizhen.type) {
          if (order.status == resources.orderStatus.paid.value) {
            flags.isShowDoctorConfirmButtons = true;
          }
        }
      }

      if (currentUser.isPatient) {
        flags.isShowPaymentButtons = true;
        if (order.serviceType == sType.huizhen.type) {
          if (order.status == resources.orderStatus.init.value || order.status == resources.orderStatus.paid.value) {
            flags.isShowBookingButtons = true;
            // check if anyone doctor confirmed.
            var checkAnyDoctorConfirmed = false;
            for (var i = 0; i < order.doctors.length; i++) {
              checkAnyDoctorConfirmed = checkAnyDoctorConfirmed || order.doctors[i].isConfirmed;
            }
            // if any doctor confirmed,the booking time cannot be changed again.
            flags.isShowBookingButtons = flags.isShowBookingButtons && !checkAnyDoctorConfirmed;
          }
        }
        if (order.status == resources.orderStatus.finished.value) {
          flags.isShowCommentInput = false;
          if (!order.rank || !order.rank.stars) {
            flags.isShowRankInput = true;
          } else {
            flags.isShowRankResult = true;
          }
        }
      }

      $scope.uiFlags = flags;
    }
  }])
;
