/**
 * Created by Ting on 2015/8/20.
 */
angular.module('ylbAdmin')
  .controller('adminWithdrawCtrl', ['$scope', '$rootScope', '$http', '$log', function ($scope, $rootScope, $http, $log) {
    $log.log('init adminWithdrawCtrl');
    var initOrders = [];
    var confirmedOrders = [];
    var rejectedOrders = [];
    $scope.uiFlags = {};

    getWithdraws();

    function getWithdraws() {
      $http.get('/admin/orders/withdraw/all')
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            var order = resp.data[i];
            order.buyer.displayRole = order.buyer.role == 'doctor' ? "医生" : "患者";
            if (order.status == 'init') {
              initOrders.push(order);
            } else if (order.status == 'confirmed') {
              confirmedOrders.push(order);
            } else if (order.status == 'rejected') {
              rejectedOrders.push(order);
            }
          }
          $scope.orders = initOrders;
          $scope.uiFlags.status = 'init';
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    }

    $scope.agree = function (index) {
      var orderId = $scope.orders[index]._id;
      $http.put('/admin/orders/' + orderId + '/status/confirm', {})
        .success(function (resp) {
          var order = $scope.orders.splice(index, 1);
          order[0].status = resp.data.status;
          confirmedOrders.push(order[0]);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.decline = function (index) {
      var orderId = $scope.orders[index]._id;
      $http.put('/admin/orders/' + orderId + '/status/reject', {})
        .success(function (resp) {
          var order = $scope.orders.splice(index, 1);
          order[0].status = resp.data.status;
          rejectedOrders.push(order[0]);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.switchOrders = function (status) {
      if (status == 'init') {
        $scope.orders = initOrders;
      } else if (status == 'confirmed') {
        $scope.orders = confirmedOrders;
      } else if (status == 'rejected') {
        $scope.orders = rejectedOrders;
      }
      $scope.uiFlags.status = status;
    };
  }]);
