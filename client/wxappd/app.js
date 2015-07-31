/**
 * Created by Ting on 2015/6/19.
 */
angular.module('ylbWxApp', ['ui.router', 'ngCookies', 'ngAnimate', 'ngTouch', 'ngSanitize', 'mgcrea.ngStrap'])
  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('testDoctorIndex', {
      url: '/doctor/index',
      templateUrl: 'wxappd/doctor/test-index.tpl.html',
      controller: 'rootCtrl'
    });
    $stateProvider.state('testPatientIndex', {
      url: '/patient/index',
      templateUrl: 'wxappd/patient/test-index.tpl.html',
      controller: 'rootCtrl'
    });
    $stateProvider.state('entry', {
      url: '/?openid&token&redirect',
      controller: 'entryCtrl'
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
    $stateProvider.state('search-patient', {
      url: '/search/patient',
      templateUrl: 'wxappd/search/search-patient.tpl.html',
      controller: 'wxSearchPatientCtrl'
    });
    $stateProvider.state('search-patient-result', {
      url: '/search/patient/result',
      templateUrl: 'wxappd/search/search-patient-result.tpl.html',
      controller: 'wxSearchPatientResultCtrl'
    });

    /* -- patient -------------------------------------------------------------------- */
    $stateProvider.state('patient-my-doctors', {
      url: '/patient/doctors',
      templateUrl: 'wxappd/patient/my-doctors.tpl.html',
      controller: 'wxMyDoctorsCtrl'
    });
    $stateProvider.state('patient-my-friends', {
      url: '/patient/friends',
      templateUrl: 'wxappd/patient/my-friends.tpl.html',
      controller: 'wxPatientFriendsCtrl'
    });
    $stateProvider.state('patient-cases', {
      url: '/patient/cases/:id',
      templateUrl: 'wxappd/patient/cases.tpl.html',
      controller: 'wxPatientCasesCtrl'
    });


    /* -- doctor -------------------------------------------------------------------- */
    $stateProvider.state('doctor-my-friends', {
      url: '/doctor/friends',
      templateUrl: 'wxappd/doctor/my-friends.tpl.html',
      controller: 'wxDoctorFriendsCtrl'
    });
    $stateProvider.state('error-not-from-wechat', {
      template: '<div class="alert alert-danger" role="alert">请从微信访问此页面。</div>'
    });
    //$urlRouterProvider.otherwise('entry');
  }])
  .controller('rootCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$q', '$http', '$cookies', '$log', '$timeout', '$alert', function ($scope, $rootScope, $state, $stateParams, $q, $http, $cookies, $log, $timeout, $alert) {



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
        verifiedData.isPatient = !!verifiedData.patient;
        verifiedData.isDoctor = !!verifiedData.doctor;
        return verifiedData;
      }
    };

    /**
     * Common method to alert error.
     * @param err
     */
    $rootScope.alertError = function (_title, content, status, duration) {
      var title = generateAlertTitle('错误 ', _title, status);
      $alert({
        title: title,
        content: parseContent(content),
        placement: 'top',
        type: 'danger',
        duration: duration != undefined ? duration : 5,
        animation: 'am-fade-and-slide-top'
      });
    };

    $rootScope.alertWarn = function (_title, content, status) {
      var title = generateAlertTitle('警告 ', _title, status);
      $alert({
        title: title,
        content: parseContent(content),
        placement: 'top',
        type: 'warning',
        duration: 3,
        animation: 'am-fade-and-slide-top'
      });
    };

    $rootScope.alertSuccess = function (_title, content, status) {
      var title = generateAlertTitle('成功', _title, status);
      $alert({
        title: title,
        content: parseContent(content),
        placement: 'top',
        type: 'success',
        duration: 3,
        animation: 'am-fade-and-slide-top'
      });
    };

    var parseContent = function (content) {
      if (typeof(content) === 'string') {
        return content;
      } else if (typeof(content) === 'object') {
        if (content.message) {
          return content.message;
        }
        if (content.error && content.error.message) {
          return content.error.message;
        }
        return content.toString();
      } else {
        return content.toString();
      }
    };

    var generateAlertTitle = function (title, _title, status) {
      if (_title !== undefined && _title !== null)
        title = _title;

      if (status)
        title += '[' + status + ']：';
      else if (title !== '') {
        title += '：';
      }
      return title;
    };

    /**
     * If doctor/patient doesn't have avatar set in wechat, use default.
     * @param user
     */
    $rootScope.checkAvatar = function (user) {
      if (!user.wechat.headimgurl) {
        user.wechat.headimgurl = '/assets/image/avatar-64.jpg';
      }
    };
  }]).controller('entryCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$http', '$cookies', '$log', '$timeout', '$alert', function ($scope, $rootScope, $state, $stateParams, $http, $cookies, $log, $timeout, $alert) {
    /**
     * Create separate entryCtrl from rootCtrl. Because rootCtrl is loaded by wxindex.html, which is usually before
     * 'entry' route defined in $stateProvider. In page initializing, 'verifyAndGetUserInfo()' method will be executed
     * twice, the first is when loading wxindex.html, the second is when load 'entry' route. In the first loading,
     * 'verifyAndGetUserInfo()' method cannot get parameters, so throw error, page load failed.
     *
     * Get user information by given openid and access_token.
     * This is the first step to access web application. If this step failed, all other pages should not be able to accessed.
     * {
     * "data":{"openid":"oWTqJs8SEbDON98vMor20rnXh9UQ", "access_token":"bbb", "verified":1437977798305,
     *   "doctor":{"_id":"55acf0bc8e23e96c2e23b20e", "name":"xxx"}
     *   "patient":{"_id":"55acf0bc8e23e96c2e23b20e", "name":"xxx"}
     * }
     * }
     */
    var verifyAndGetUserInfo = function () {
      $log.info('entryCtrl:verifyAndGetUserInfo()');
      var setDefaultHeader = function () {
        // set default headers for $http service.
        var authorizationStr = 'wechatOAuth openid="' + $scope.currentUser.openid + '" access_token="' + $scope.currentUser.access_token + '"';
        if ($scope.currentUser.doctor) {
          authorizationStr += ' role="doctor"';
        } else if ($scope.currentUser.patient) {
          authorizationStr += ' role="patient"';
        }
        $http.defaults.headers.common.Authorization = authorizationStr;
      };

      var checkUserFirstTime = function () {
        // User must activate before start to use any functions.
        if ($rootScope.currentUser.doctor && !$rootScope.currentUser.doctor.name) {
          $state.go('profile-edit', {openid: openid, firstTime: true});
        } else if ($rootScope.currentUser.patient && !$rootScope.currentUser.patient.name) {
          $state.go('profile-patient-edit', {openid: openid, firstTime: true});
        } else if (redirect) {
          $log.debug('redirect: %s', redirect);
          $state.go(redirect, {openid: openid});
        }
      };

      var verify = function () {
        $http.get('/api/verify', {params: {openid: openid, access_token: access_token}})
          .success(function (resp) {
            // save user verification info to session.
            $cookies.putObject('currentUser', resp.data);
            $rootScope.currentUser = resp.data;
            setDefaultHeader();
            checkUserFirstTime();
            initWxJsSdk();
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

      var initWxJsSdk = function () {
        $http.get('/wechat/jssdkconfig')
          .success(function (resp) {
            wx.config(resp.data);
            wx.ready(function () {
              console.log('wx.ready. ', wx);

            });
            wx.error(function () {
              console.log('wx.error.', arguments);
            })
          });
      };

      //$cookies.remove('currentUser');
      var openid = $stateParams.openid;
      var access_token = $stateParams.token;
      var redirect = $stateParams.redirect;
      var sessionUser = $cookies.getObject('currentUser');
      $log.debug('init page. openid: %s, access_token: %s, redirect: %s, sessionUser: %o', openid, access_token, redirect, sessionUser);
      if (!openid || !access_token) {
        if (sessionUser) {
          $log.debug('read user from session');
          openid = sessionUser.openid;
          access_token = sessionUser.access_token;
          $rootScope.currentUser = sessionUser;
          setDefaultHeader();
          checkUserFirstTime();
          initWxJsSdk();
        } else {
          $log.debug('invalid openid or access_token');
          $rootScope.alertError('', 'invalid openid or access_token');
          return;
        }
      } else {
        verify();
      }
    };
    verifyAndGetUserInfo();
  }]);
