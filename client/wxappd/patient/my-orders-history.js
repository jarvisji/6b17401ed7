/**
 * Created by Ting on 2015/8/10.
 */
angular.module('ylbWxApp')
  .controller('wxPatientOrderHistoryCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
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
    var getSummary = function () {
      $http.get('/api/patients/' + currentUser.id + '/orders/summary')
        .success(function (resp) {
          var summary = resp.data;
          summary.available = summary.rejected - summary.extracted;
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
      getSummary();
    }

    $scope.showOrderDetail = function (index) {
      var orderId = $scope.orders[index]._id;
      $state.go('order-detail', {id: orderId});
    };
  }]);
