/**
 * Created by Ting on 2015/8/24.
 */
angular.module('ylbAdmin')
  .controller('adminOrderCtrl', ['$scope', '$rootScope', '$http', '$log', '$timeout', 'FileUploader', function ($scope, $rootScope, $http, $log, $timeout, FileUploader) {
    $log.log('init adminOrderCtrl');
    var initOrders = [];
    var confirmedOrders = [];
    $scope.uiFlags = {};

    loadOrders();

    function loadOrders() {
      $http.get('/admin/orders/shop/all')
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            var order = resp.data[i];
            if (order.status == 'init') {
              initOrders.push(order);
            } else if (order.status == 'confirmed') {
              confirmedOrders.push(order);
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

    $scope.switchOrders = function (status) {
      if (status == 'init') {
        $scope.orders = initOrders;
      } else if (status == 'confirmed') {
        $scope.orders = confirmedOrders;
      }
      $scope.uiFlags.status = status;
    };
  }]);
