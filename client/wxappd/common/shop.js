/**
 * Created by Ting on 2015/8/21.
 */
angular.module('ylbWxApp')
  .controller('wxShopCtrl', ['$scope', '$rootScope', '$http', '$state', '$stateParams', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, $stateParams, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();

    //var type = $stateParams.type;
    var getGoods = function () {
      $http.get('/admin/goods')
        .success(function (resp) {
          var goods = [];
          for (var i = 0; i < resp.data.length; i++) {
            if (resp.data[i].isInSale) {
              goods.push(resp.data[i]);
            }
          }
          $scope.goods = goods;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    getGoods();

    $scope.showGoodDetail = function (idx) {
      var goodsId = $scope.goods[idx]._id;
      $state.go('goods-detail', {id: goodsId});
    };
  }]);
