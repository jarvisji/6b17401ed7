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
    $stateProvider.state('profile-edit', {
      url: '/profile/:openid/edit',
      templateUrl: 'wxappd/profile/profile-edit.tpl.html',
      controller: 'wxProfileEditCtrl'
    });
    $stateProvider.state('search-doctor', {
      url: '/search/doctor',
      templateUrl: 'wxappd/search/search-doctor.tpl.html',
      controller: 'wxSearchDoctorCtrl'
    });
    //$urlRouterProvider.otherwise('wx_activate');
  }])
  .controller('rootCtrl', ['$scope', '$rootScope', '$state', '$log', '$timeout', '$alert', function ($scope, $rootScope, $state, $log, $timeout, $alert) {
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

    /**
     * Common method to check doctor/patient activated or not. User must activate before start to use any functions.
     * @param profile Doctor/Patient
     */
    $rootScope.checkProfileActivated = function (profile) {
      if (!profile.name) {
        $alert({title: '账户未激活：', content: '请先完善个人信息。', placement: 'top', type: 'danger', container: '#alert'});
        $timeout(function () {
          $state.go('profile-edit', {openid: profile.wechat.openid})
        }, 2000);
        return false;
      } else {
        return true;
      }
    };

    /**
     * Common method to alert error.
     * @param err
     */
    $rootScope.alertError = function (err) {
      $alert({title: err.name, content: err.message, placement: 'top', type: 'danger', container: '#alert'});
    }
  }]);
