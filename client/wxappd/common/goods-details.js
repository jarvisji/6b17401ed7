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

    $scope.settle = function() {

    };
  }]);
