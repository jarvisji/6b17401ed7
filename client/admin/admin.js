angular.module('ylbAdmin', ['ui.router', 'ngCookies', 'ngAnimate', 'angularFileUpload', 'mgcrea.ngStrap'])
  .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $locationProvider) {
    //$locationProvider.html5Mode(true);
    $stateProvider.state('shop', {
      url: '/shop',
      templateUrl: 'admin/shop/shop-goods.tpl.html',
      controller: 'adminShopCtrl'
    });
    $stateProvider.state('order', {
      url: '/order',
      templateUrl: 'admin/shop/shop-order.tpl.html',
      controller: 'adminOrderCtrl'
    });
    $stateProvider.state('withdraw', {
      url: '/withdraw',
      templateUrl: 'admin/withdraw/withdraw.tpl.html',
      controller: 'adminWithdrawCtrl'
    });
    $urlRouterProvider.otherwise('shop');
  }])
  .filter('localeDate', function () {
    return function (input) {
      var date = new Date(input);
      var year = 1900 + date.getYear();
      return year + '-' + date.getMonth() + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    }
  })
  .controller('rootCtrl', ['$scope', '$rootScope', '$state', '$http', '$alert', '$cookies', '$log', function ($scope, $rootScope, $state, $http, $alert, $cookies, $log) {
    $log.log('init rootCtrl');

    $rootScope.checkUserLogin = function () {
      var verifiedData = $cookies.getObject('adminUser');
      if (!verifiedData) {
        window.location.href = '/admin/login.html';
      } else {
        $rootScope.currentUser = verifiedData;
        console.log('vd:', verifiedData);
        $http.defaults.headers.common.token = verifiedData.token;
        return verifiedData;
      }
    };

    $rootScope.currentUser = $rootScope.checkUserLogin();

    // init menu
    $scope.menu = [
      {label: '商品管理', location: 'shop'},
      {label: '订单管理', location: 'order'},
      {label: '退款管理', location: 'withdraw'}];

    $scope.logout = function () {
      $cookies.remove('adminUser');
      window.location.href = '/admin/login.html';
    };

    $rootScope.validateForm = function (form) {
      var formValid = form.$valid;
      angular.forEach(form, function (ele) {
        if (ele && ele.$invalid) {
          ele.$dirty = true;
          formValid = false;
          $log.debug("invalid element:", ele);
        }
      });
//        $log.debug("validated form:", formValid, form);
      return formValid;
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
        content = '没有权限，请重新登录。';
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
    $rootScope.alertWarn = function (_title, content, status, duration) {
      var title = generateAlertTitle('警告 ', _title, status);
      $alert({
        title: title,
        content: parseContent(content),
        placement: 'top',
        type: 'warning',
        duration: duration != undefined ? duration : 3,
        animation: 'am-fade-and-slide-top'
      });
    };

    $rootScope.alertSuccess = function (_title, content, status, duration) {
      var title = generateAlertTitle('成功', _title, status);
      $alert({
        title: title,
        content: parseContent(content),
        placement: 'top',
        type: 'success',
        duration: duration != undefined ? duration : 3,
        animation: 'am-fade-and-slide-top'
      });
    };
  }
  ]).controller('loginCtrl', ['$scope', '$rootScope', '$http', '$cookies', function ($scope, $rootScope, $http, $cookies) {
    $scope.login = function () {
      $http.post('/admin/login', {username: $scope.username, password: $scope.password})
        .success(function (resp) {
          $cookies.putObject('adminUser', resp.data);
          $rootScope.currentUser = resp.data;
          window.location.href = '/admin/dashboard.html';
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
  }]);
