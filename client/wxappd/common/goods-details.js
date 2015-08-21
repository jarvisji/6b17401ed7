/**
 * Created by Ting on 2015/8/21.
 */
angular.module('ylbWxApp')
  .controller('wxGoodsCtrl', ['$scope', '$rootScope', '$http', '$state', '$stateParams', '$sce', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, $stateParams, $sce, resources, commonUtils) {
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

    $scope.settle = function () {
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
          avatar: buyer.avatar
        },
        quantity: 1,
        orderPrice: $scope.item.price
      };
      $http.post('/api/orders', newOrder)
        .success(function (resp) {
          $rootScope.alertSuccess('', '订单已生成，跳转到微信支付页面。');
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
  }]);
