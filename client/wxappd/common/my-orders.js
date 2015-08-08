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
    var warnStatus = [oStatus.init.value];
    var failStatus = [oStatus.rejected.value];
    var waitStatus4Doctor = [oStatus.paid.value];
    var waitStatus4Patient = [oStatus.doctorFinished.value];
    var successStatus4Doctor = [oStatus.confirmed.value];
    var successStatus4Patient = [oStatus.paid.value, oStatus.confirmed.value];
    var applyStatusLabelStyle = function (order) {
      if (order instanceof Array) {
        for (var idx in order) {
          applyStatusLabelStyle(order[idx]);
        }
      } else {
        order.displayStatus = oStatus[order.status].label;
        if (finishStatus.indexOf(order.status) != -1) {
          order.statusClass = 'label-default';
        } else if (warnStatus.indexOf(order.status) != -1) {
          order.statusClass = 'label-warning';
        } else if (failStatus.indexOf(order.status) != -1) {
          order.statusClass = 'label-danger';
        } else if (currentUser.isDoctor) {
          if (successStatus4Doctor.indexOf(order.status) != -1) {
            order.statusClass = 'label-success';
          } else if (waitStatus4Doctor.indexOf(order.status) != -1) {
            order.statusClass = 'label-primary';
          }
        } else if (currentUser.isPatient) {
          if (successStatus4Patient.indexOf(order.status) != -1) {
            order.statusClass = 'label-success';
          } else if (waitStatus4Patient.indexOf(order.status) != -1) {
            order.statusClass = 'label-primary';
          }
        }
      }
    };
  }]);
