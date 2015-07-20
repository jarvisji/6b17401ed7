/**
 * Created by Ting on 2015/6/19.
 */
angular.module('ylbWxApp', ['ui.router', 'ngCookies', 'ngAnimate', 'mgcrea.ngStrap'])
  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('profile', {
      url: '/profile/:openid',
      templateUrl: 'wxappd/profile/profile.tpl.html',
      controller: 'wxProfileCtrl'
    });
    //$urlRouterProvider.otherwise('wx_activate');
  }])
  .controller('rootCtrl', ['$scope', '$rootScope', '$state', '$log', function ($scope, $rootScope, $state, $log) {
    // Common method for each controller.
    $rootScope.validateForm = function (form) {
      var formValid = form.$valid;
      angular.forEach(form, function (ele) {
        if (ele && ele.$invalid) {
          ele.$dirty = true;
          formValid = false;
          //$log.debug("invalid element:", ele);
        }
      });
      return formValid;
    };
  }]);
