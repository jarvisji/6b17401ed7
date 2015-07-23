/**
 * Created by Ting on 2015/6/19.
 */
angular.module('ylbWxApp', ['ui.router', 'ngCookies', 'ngAnimate', 'mgcrea.ngStrap'])
  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('entry', {
      url: '/?openid&access_token&redirect',
      controller: 'rootCtrl'
    });
    $stateProvider.state('profile', {
      url: '/profile/doctor/:openid',
      templateUrl: 'wxappd/profile/profile.tpl.html',
      controller: 'wxProfileCtrl'
    });
    $stateProvider.state('profile-edit', {
      url: '/profile/doctor/:openid/edit?firstTime',
      templateUrl: 'wxappd/profile/profile-edit.tpl.html',
      controller: 'wxProfileEditCtrl'
    });
    $stateProvider.state('profile-patient', {
      url: '/profile/patient/:openid',
      templateUrl: 'wxappd/profile/profile-patient.tpl.html',
      controller: 'wxProfilePatientCtrl'
    });
    $stateProvider.state('profile-patient-edit', {
      url: '/profile/patient/:openid/edit?firstTime',
      templateUrl: 'wxappd/profile/profile-patient-edit.tpl.html',
      controller: 'wxProfilePatientEditCtrl'
    });
    $stateProvider.state('search-doctor', {
      url: '/search/doctor',
      templateUrl: 'wxappd/search/search-doctor.tpl.html',
      controller: 'wxSearchDoctorCtrl'
    });
    $stateProvider.state('search-doctor-result', {
      url: '/search/doctor/result',
      templateUrl: 'wxappd/search/search-doctor-result.tpl.html',
      controller: 'wxSearchDoctorResultCtrl'
    });
    $stateProvider.state('error-not-from-wechat', {
      template: '<div class="alert alert-danger" role="alert">请从微信访问此页面。</div>'
    });
    //$urlRouterProvider.otherwise('entry');
  }])
  .controller('rootCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$http', '$cookies', '$log', '$timeout', '$alert', function ($scope, $rootScope, $state, $stateParams, $http, $cookies, $log, $timeout, $alert) {
    /**
     * Get user information by given openid and access_token.
     * This is the first step to access web application. If this step failed, all other pages should not be able to accessed.
     */
    var verifyAndGetUserInfo = function () {
      $log.info('rootCtrl:verifyAndGetUserInfo()');
      //$cookies.remove('currentUser');
      var openid = $stateParams.openid;
      var access_token = $stateParams.access_token;
      var redirect = $stateParams.redirect;
      if (!openid || !access_token) {
        console.log('return');
        return;
      }

      $http.get('/api/verify', {params: {openid: openid, access_token: access_token}})
        .success(function (resp) {
          // save user verification info to session.
          $cookies.putObject('currentUser', resp.data);
          // User must activate before start to use any functions.
          if (resp.data.doctor && !resp.data.doctor.name) {
            $state.go('profile-edit', {openid: openid, firstTime: true});
          } else if (resp.data.patient && !resp.data.patient.name) {
            $state.go('profile-patient-edit', {openid: openid, firstTime: true});
          } else if (redirect) {
            $state.go(redirect, {openid: openid});
          }
        }).error(function (resp, status) {
          $cookies.remove('currentUser');
          if (status == 404) {
            // user not registered
            $rootScope.alertError('', '您还未关注我们的公众号。');
          } else {
            $rootScope.alertError(null, resp.error.message, status);
          }
        });
    };
    verifyAndGetUserInfo();


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
    //$rootScope.checkProfileActivated = function (profile) {
    //  if (!profile.name) {
    //    $alert({title: '账户未激活：', content: '请先完善个人信息。', placement: 'top', type: 'danger', container: '#alert'});
    //    $timeout(function () {
    //      $state.go('profile-edit', {openid: profile.wechat.openid})
    //    }, 2000);
    //    return false;
    //  } else {
    //    return true;
    //  }
    //};

    /**
     * Every page should call this method to make sure user is verified.
     */
    $rootScope.checkUserVerified = function () {
      var verifiedData = $cookies.getObject('currentUser');
      if (!verifiedData) {
        $state.go('error-not-from-wechat');
      } else {
        return verifiedData;
      }
    };

    /**
     * Common method to alert error.
     * @param err
     */
    $rootScope.alertError = function (_title, content, status) {
      var title = generateAlertTitle('错误 ', _title);
      $alert({title: title, content: content, placement: 'top', type: 'danger', duration: 5, container: '#alert'});
    };

    $rootScope.alertWarn = function (_title, content, status) {
      var title = generateAlertTitle('警告 ', _title);
      $alert({title: title, content: content, placement: 'top', type: 'warning', duration: 2, container: '#alert'});
    };

    var generateAlertTitle = function (title, _title) {
      if (_title != undefined && _title != null)
        title = _title;

      if (status)
        title += '[' + status + ']：';
      else if (title != '') {
        title += '：';
      }
      return title;
    };

    /**
     * If doctor/patient doesn't have avatar set in wechat, use default.
     * @param user
     */
    $rootScope.checkAvatar = function(user) {
      if (!user.wechat.headimgurl) {
        user.wechat.headimgurl = '/assets/image/avatar-64.jpg';
      }
    };
  }]);
