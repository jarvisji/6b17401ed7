/**
 * Created by Ting on 2015/8/5.
 */
angular.module('ylbWxApp')
  .controller('wxOrdersCtrl', ['$scope', '$rootScope', '$http', '$state', '$stateParams', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, $stateParams, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();
    var type = $stateParams.type;
    var getOrders = function () {
      $http.get('/api/orders/my/' + type)
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            var order = resp.data[i];
            order.displayType = resources.doctorServices[order.serviceType].label;
            order.displayStatus = resources.orderStatus[order.status].label;
            applyStatusLabelStyle(order);
            $rootScope.handleDisplayBookingTime(order, /*noLabel*/true);
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

    var oStatus = resources.orderStatus;
    var finishStatus = [oStatus.finished.value, oStatus.expired.value, oStatus.cancelled.value];
    var successStatus = [oStatus.paid.value, oStatus.confirmed.value, oStatus.doctorFinished.value];
    var warnStatus = [oStatus.init.value];
    var failStatus = [oStatus.rejected.value];
    var applyStatusLabelStyle = function (order) {
      if (order instanceof Array) {
        for (var idx in order) {
          applyStatusLabelStyle(order[idx]);
        }
      } else {
        order.displayStatus = oStatus[order.status].label;
        if (finishStatus.indexOf(order.status) != -1) {
          order.statusClass = 'label-default';
        } else if (successStatus.indexOf(order.status) != -1) {
          order.statusClass = 'label-success';
        } else if (warnStatus.indexOf(order.status) != -1) {
          order.statusClass = 'label-warning';
        } else if (failStatus.indexOf(order.status) != -1) {
          order.statusClass = 'label-danger';
        }
      }
    }
  }]);
