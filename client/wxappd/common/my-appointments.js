/**
 * Created by Ting on 2015/8/5.
 */
angular.module('ylbWxApp')
  .controller('wxOrdersCtrl', ['$scope', '$rootScope', '$http', '$state', '$stateParams', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, $stateParams, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();
    //var type = $stateParams.type;
    var getOrders = function () {
      $http.get('/api/orders/my')
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
          $rootScope.alertError(null, resp, status);
        });
    };
    getOrders();

    $scope.showOrderDetail = function (idx) {
      console.log('showOrderDetail');
      var orderId = $scope.orders[idx]._id;
      $state.go('order-detail', {id: orderId});
    };
  }]);
