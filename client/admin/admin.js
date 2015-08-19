angular.module('ylbAdmin', ['ui.router', 'ngCookies', 'ngAnimate', 'mgcrea.ngStrap'])
  .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $locationProvider) {
    //$locationProvider.html5Mode(true);
    $stateProvider.state('dashboard', {
      url: '/dashboard',
      templateUrl: 'app/dashboard/dashboard.tpl.html',
      controller: 'dashboardCtrl'
    });
    //$urlRouterProvider.otherwise('dashboard');
  }])
  .controller('rootCtrl', ['$scope', '$rootScope', '$state', '$http', '$alert', '$log', function ($scope, $rootScope, $state, $http, $alert, $log) {
    $scope.login = function () {
      $http.post('/admin/login', {username: $scope.username, password: $scope.password})
        .success(function (resp) {
          window.location.href = 'admin/dashboard.html';
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    // init menu
    $scope.menu = [
      {label: '最新通知', location: '/curriculum'},
      {label: '今日作业', location: '/curriculum'},
      {label: '成绩查询', location: '/curriculum'},
      {label: '课程表', location: '/curriculum'},
      {label: '通讯录', location: '/curriculum'},
      {label: '账号绑定', location: '/curriculum'}];


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

    /**
     * Common method to alert error.
     * @param err
     */
    $rootScope.alertError = function (_title, content, status, duration, container) {
      var title = generateAlertTitle('错误 ', _title, status);
      var content;
      if (status == 403) {
        content = '没有权限';
      } else {
        content = parseContent(content);
      }
      var opt = {
        title: title,
        content: content,
        placement: 'top',
        type: 'danger',
        duration: duration != undefined ? duration : 5,
        animation: 'am-fade-and-slide-top'
      };
      if (container) {
        opt.container = container;
      }
      $alert(opt);
    };
  }
  ])
;
