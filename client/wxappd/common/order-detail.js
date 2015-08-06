/**
 * Created by Ting on 2015/8/5.
 */
angular.module('ylbWxApp')
  .controller('wxOrderDetailCtrl', ['$scope', '$rootScope', '$http', '$state', '$stateParams', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, $stateParams, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();
    var orderId = $stateParams.id;
    var sType = resources.doctorServices;

    var getOrderInfo = function () {
      $http.get('/api/orders/' + orderId)
        .success(function (resp) {
          var order = resp.data;
          $rootScope.checkCommentAvatar(order.comments);
          checkCommentCanBeDelete(order.comments);
          commonUtils.date.convert2FriendlyDate(order.comments);
          handleDisplayBookingTime(order);
          handleUIFlags(order);
          $scope.order = order;
          getPatientInfo();
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    getOrderInfo();

    var getPatientInfo = function () {
      var patientId = $scope.order.patient.id;
      if (patientId) {
        $http.get('/api/patients/' + patientId)
          .success(function (resp) {
            var patient = resp.data;
            patient.age = commonUtils.calculateAge(patient.birthday);
            patient.displaySex = resources.sex[patient.sex];
            patient.displayLevel = resources.patientLevel[patient.level];
            patient.displaySickness = patient.sickness.join('<br>');
            $rootScope.checkAvatar(patient);
            $scope.patient = patient;
          }).error(function (resp, status) {
            $rootScope.alertError(null, resp, status);
          });
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
            handleDisplayBookingTime($scope.order);
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
      //TODO: this will be replace by wechat payment. Currently update status directly.
      $http.put('/api/orders/' + orderId + '/status/' + resources.orderStatus.paid.value, {})
        .success(function (resp) {
          $scope.order.status = resources.orderStatus.paid.value;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.doctorRejectBookingTime = function () {
      $http.put('/api/orders/' + orderId, {status: resources.orderStatus.rejected.value})
        .success(function (resp) {
          $scope.order.status = resources.orderStatus.rejected.value;
          handleUIFlags($scope.order);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.doctorAcceptBookingTime = function () {
      $http.put('/api/orders/' + orderId, {status: resources.orderStatus.confirmed.value})
        .success(function (resp) {
          $scope.order.status = resources.orderStatus.confirmed.value;
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

    var handleDisplayBookingTime = function (order) {
      if (order.serviceType == sType.suizhen.type) {
        order.displayBookingTime = '预约周期：' + order.quantity + '个月';
      } else {
        var bookingDate = order.bookingTime;
        if (bookingDate) {
          if (typeof(bookingDate) === 'string') {
            bookingDate = new Date(bookingDate);
          }
          var month = bookingDate.getMonth() + 1;
          var date = bookingDate.getDate();
          var hour = bookingDate.getHours();
          var time = ' 上午';
          if (hour > 12) {
            hour = hour - 12;
            time = ' 下午'
          }
          if (order.serviceType == sType.jiahao.type) {
            order.displayBookingTime = '预约时间：' + month + '月' + date + '日';
          } else if (order.serviceType == sType.huizhen.type) {
            order.displayBookingTime = '预约时间：' + month + '月' + date + '日' + time + hour + '点';
          }
        } else {
          order.displayBookingTime = '尚未预约具体时间';
        }
      }
    };

    var handleUIFlags = function (order) {
      var flags = {};
      if (currentUser.isDoctor) {
        if (order.serviceType != sType.jiahao.type && order.status == resources.orderStatus.paid.value) {
          flags.isShowDoctorConfirmButtons = true;
        }
        if (flags.isShowDoctorConfirmButtons && !order.bookingTime && !order.serviceType == sType.suizhen.type) {
          flags.isDisableDoctorConfirmButtons = true;
        }
      }
      if (currentUser.isPatient) {
        flags.isShowPaymentButtons = true;
        if (!order.bookingTime && !order.serviceType == sType.suizhen.type) {
          flags.isShowBookingButtons = true;
        }
      }

      $scope.uiFlags = flags;
    }
  }]);
