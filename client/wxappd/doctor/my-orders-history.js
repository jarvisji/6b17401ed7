/**
 * Created by Ting on 2015/8/10.
 */
angular.module('ylbWxApp')
  .controller('wxDoctorOrderHistoryCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();
    $scope.uiFlags = {};
    var pageLimit = 20;

    var getHistoryOrders = function () {
      $http.get('/api/doctors/' + currentUser.id + '/orders/history')
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            var order = resp.data[i];
            order.displayType = resources.doctorServices[order.serviceType].label;
            order.displayStatus = resources.orderStatus[order.status].label;
            $rootScope.applyStatusLabelStyle(order, currentUser.isDoctor, currentUser.isPatient);
            $rootScope.handleDisplayBookingTime(order, /*noLabel*/true);
            $rootScope.setOrderIcon(order);

            // set doctor income, will display on page.
            for (var j = 0; j < order.doctors.length; j++) {
              if (order.doctors[j].id == currentUser.id) {
                order.income = order.doctors[j].income;
                break;
              }
            }
            if (order.referee && order.referee.id && order.referee.id == currentUser.id) {
              order.refereeIncome = order.referee.income;
            }
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
    var getNonServiceOrders = function () {
      $http.get('/api/orders/non-service')
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            var order = resp.data[i];
            order.displayStatus = resources.orderStatus[order.status].label;
            $rootScope.applyStatusLabelStyle(order, false, true);
          }
          $scope.nonServiceOrders = resp.data;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    var getSummary = function () {
      $http.get('/api/doctors/' + currentUser.id + '/orders/summary')
        .success(function (resp) {
          var summary = resp.data;
          summary.available = summary.finished + summary.recommended - summary.extracted;
          $scope.summary = summary;
        }).error(function (resp, status) {
          if (status == 403) {
            $rootScope.alertError('', '没有权限');
          } else {
            $rootScope.alertError(null, resp, status);
          }
        });
    };
    if (currentUser.isDoctor) {
      getHistoryOrders();
      getNonServiceOrders();
      getSummary();
    }

    $scope.showOrderDetail = function (index) {
      var orderId = $scope.orders[index]._id;
      $state.go('order-detail', {id: orderId});
    };

    $scope.showGoodsDetail = function (index) {
      var orderId = $scope.nonServiceOrders[index].orderItem.id;
      $state.go('goods-detail', {id: orderId});
    };

    $scope.cancelNonServiceOrder = function (index) {
      var orderId = $scope.nonServiceOrders[index]._id;
      $http.delete('/api/orders/non-service/' + orderId)
        .success(function (resp) {
          $scope.nonServiceOrders.splice(index, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.payNonServiceOrder = function (index) {


    };
  }]);
