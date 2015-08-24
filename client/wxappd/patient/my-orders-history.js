/**
 * Created by Ting on 2015/8/10.
 */
angular.module('ylbWxApp')
  .controller('wxPatientOrderHistoryCtrl', ['$scope', '$rootScope', '$http', '$state', '$modal', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, $modal, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();
    $scope.uiFlags = {};
    var pageLimit = 20;

    var getHistoryOrders = function () {
      $http.get('/api/patients/' + currentUser.id + '/orders/history')
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            var order = resp.data[i];
            order.displayType = resources.doctorServices[order.serviceType].label;
            order.displayStatus = resources.orderStatus[order.status].label;
            $rootScope.applyStatusLabelStyle(order, currentUser.isDoctor, currentUser.isPatient);
            $rootScope.handleDisplayBookingTime(order, /*noLabel*/true);
            $rootScope.setOrderIcon(order);
          }
          $scope.orders = resp.data;
        }).error(function (resp, status) {
          if (status == 403) {
            $rootScope.alertError('', '没有权限');
          } else {
            $rootScope.alertError(null, resp, status);
          }
        });
    };
    var getWithdrawOrders = function() {
      $http.get('/api/orders/withdraw')
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            var order = resp.data[i];
            $rootScope.applyStatusLabelStyle(order, false, true);
            if (order.status == 'init') {
              order.displayStatus = '已提交';
            } else {
              order.displayStatus = resources.orderStatus[order.status].label;
            }
          }
          $scope.withdrawOrders = resp.data;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    var getSummary = function () {
      $http.get('/api/patients/' + currentUser.id + '/orders/summary')
        .success(function (resp) {
          var summary = resp.data;
          $scope.summary = summary;
        }).error(function (resp, status) {
          if (status == 403) {
            $rootScope.alertError('', '没有权限');
          } else {
            $rootScope.alertError(null, resp, status);
          }
        });
    };
    if (currentUser.isPatient) {
      getHistoryOrders();
      getWithdrawOrders();
      getSummary();
    }

    $scope.showOrderDetail = function (index) {
      var orderId = $scope.orders[index]._id;
      $state.go('order-detail', {id: orderId});
    };

    var withdrawModal = $modal({scope: $scope, template: 'wxappd/common/request-withdraw-modal.tpl.html', show: false});
    var showWithdrawModal = function () {
      withdrawModal.$promise.then(withdrawModal.show);
    };
    $scope.requestWithdraw = function () {
      $scope.modalData = {totalPoints: $scope.summary.available};
      showWithdrawModal();
    };
    $scope.createWithdraw = function () {
      var buyer = currentUser.isPatient ? currentUser.patient : currentUser.doctor;
      var newOrder = {
        orderType: resources.orderTypes.withdraw.type,
        buyer: {
          id: buyer._id,
          name: buyer.name,
          avatar: buyer.avatar,
          role: currentUser.isPatient ? resources.role.patient : resources.role.doctor
        },
        quantity: 1,
        orderPrice: $scope.modalData.requestPoints
      };
      $http.post('/api/orders', newOrder)
        .success(function (resp) {
          $rootScope.alertSuccess('', '提现申请已提交，我们会尽快审核并转账。');
          getSummary();
          withdrawModal.$promise.then(withdrawModal.hide);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
  }]);
