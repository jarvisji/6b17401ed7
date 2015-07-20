/**
 * Created by Ting on 2015/6/19.
 */
angular.module('ylbWxApp', ['ui.router', 'ngCookies', 'ngAnimate', 'mgcrea.ngStrap'])
  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('wx_activate', {
      url: '/activate/:openid',
      templateUrl: 'wxappd/activate/activate.tpl.html',
      controller: 'wxActivateCtrl'
    });
    //$urlRouterProvider.otherwise('wx_activate');
  }])
  .controller('rootCtrl', ['$scope', '$rootScope', '$state', '$log', function ($scope, $rootScope, $state, $log) {
    // init sessionInfo object at the beginning, other pages can call its properties directly needn't worry about undefined error.
  }]);
