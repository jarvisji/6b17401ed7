/**
 * Created by Ting on 2015/8/21.
 */
angular.module('ylbWxApp')
  .controller('wxGoodsCtrl', ['$scope', '$rootScope', '$http', '$state', '$stateParams', '$sce', '$modal', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, $stateParams, $sce, $modal, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();

    //var type = $stateParams.type;
    var getGoodsDetail = function () {
      var id = $stateParams.id;
      $http.get('/admin/goods/' + id)
        .success(function (resp) {
          resp.data.detailHtml = $sce.trustAsHtml(resp.data.detail);
          $scope.item = resp.data;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    getGoodsDetail();

    $scope.settle = function (form) {
      if (!$rootScope.validateForm(form)) {
        return;
      }

      var buyer = currentUser.isPatient ? currentUser.patient : currentUser.doctor;
      var newOrder = {
        orderType: resources.orderTypes.shop.type,
        orderItem: {
          id: $scope.item._id,
          name: $scope.item.name,
          avatar: $scope.item.picUrl
        },
        buyer: {
          id: buyer._id,
          name: buyer.name,
          avatar: buyer.avatar,
          role: currentUser.isPatient ? resources.role.patient : resources.role.doctor,
          mobile: $scope.modalData.mobile,
          address: $scope.modalData.address
        },
        quantity: $scope.modalData.quantity,
        orderPrice: $scope.item.price * $scope.modalData.quantity
      };
      $http.post('/api/orders', newOrder)
        .success(function (resp) {
          $rootScope.alertSuccess('', '订单已生成，跳转到微信支付页面。');
          buyModal.$promise.then(buyModal.hide);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    // Pre-fetch an external template populated with a custom scope
    var buyModal = $modal({scope: $scope, template: 'wxappd/common/request-shop-modal.tpl.html', show: false});
    // Show when some event occurs (use $promise property to ensure the template has been loaded)
    $scope.showBuyModal = function () {
      $scope.modalData = {quantity: 1};
      buyModal.$promise.then(buyModal.show);
    };
  }]);
