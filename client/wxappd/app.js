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
    $stateProvider.state('patient-orders', {
      url: '/patient/orders',
      templateUrl: 'wxappd/common/my-appointments.tpl.html',
      controller: 'wxOrdersCtrl'
    });
    $stateProvider.state('patient-friends-cases', {
      url: '/patient/friends/cases',
      templateUrl: 'wxappd/patient/my-friends-cases.tpl.html',
      controller: 'wxMyFriendsCasesCtrl'
    });
    $stateProvider.state('patient-orders-history', {
      url: '/patient/orders/history',
      templateUrl: 'wxappd/patient/my-orders-history.tpl.html',
      controller: 'wxPatientOrderHistoryCtrl'
    });


    /* -- doctor -------------------------------------------------------------------- */
    $stateProvider.state('doctor-my-friends', {
      url: '/doctor/friends',
      templateUrl: 'wxappd/doctor/my-friends.tpl.html',
      controller: 'wxDoctorFriendsCtrl'
    });
    $stateProvider.state('doctor-my-patients', {
      url: '/doctor/patients',
      templateUrl: 'wxappd/doctor/my-patients.tpl.html',
      controller: 'wxMyPatientsCtrl'
    });
    $stateProvider.state('doctor-orders', {
      url: '/doctor/orders',
      templateUrl: 'wxappd/common/my-appointments.tpl.html',
      controller: 'wxOrdersCtrl'
    });
    $stateProvider.state('doctor-orders-history', {
      url: '/doctor/orders/history',
      templateUrl: 'wxappd/doctor/my-orders-history.tpl.html',
      controller: 'wxDoctorOrderHistoryCtrl'
    });
    $stateProvider.state('doctor-patients-cases', {
      url: '/doctor/patients/cases',
      templateUrl: 'wxappd/doctor/my-patients-cases.tpl.html',
      controller: 'wxMyPatientsCasesCtrl'
    });

    /* -- common -------------------------------------------------------------------- */
    $stateProvider.state('order-detail', {
      url: '/order/detail/:id',
      templateUrl: 'wxappd/common/order-detail.tpl.html',
      controller: 'wxOrderDetailCtrl'
    });
    $stateProvider.state('order-non-service-detail', {
      url: '/order/non-service/detail/:id',
      templateUrl: 'wxappd/common/order-non-service-detail.tpl.html',
      controller: 'wxOrderDetailCtrl'
    });
    $stateProvider.state('shop', {
      url: '/shop',
      templateUrl: 'wxappd/common/shop.tpl.html',
      controller: 'wxShopCtrl'
    });
    $stateProvider.state('goods-detail', {
      url: '/shop/goods/:id',
      templateUrl: 'wxappd/common/goods-detail.tpl.html',
      controller: 'wxGoodsCtrl'
    });
    $stateProvider.state('error-not-from-wechat', {
      template: '<div class="alert alert-danger" role="alert">请从微信访问此页面。</div>'
    });
    //$urlRouterProvider.otherwise('entry');
  }])
  .filter('localeDateTime', function () {
    return function (input) {
      var date = new Date(input);
      var year = 1900 + date.getYear();
      var month = date.getMonth() + 1;
      return year + '-' + month + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    }
  }).filter('localeDate', function () {
    return function (input) {
      var date = new Date(input);
      var year = 1900 + date.getYear();
      var month = date.getMonth() + 1;
      return year + '-' + month + '-' + date.getDate();
    }
  })
  .controller('rootCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$http', '$location', '$cookies', '$log', '$timeout', '$alert', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $state, $stateParams, $http, $location, $cookies, $log, $timeout, $alert, resources, commonUtils) {
    // some page will cache data to avoid retrieve new data when click 'back' of browser.
    $rootScope.dataCache = {};

    $rootScope.$on('$stateChangeSuccess',
      function (event, toState, toParams, fromState, fromParams) {
        console.log('$stateChangeSuccess: from: %s, to: %s', fromState.name, toState.name);
        // avoid wxindex.html create too many 'ui-view' when on entry page.
        $rootScope.stateName = toState.name;

        // change page title.
        for (var sub in $scope.doctorMenu) {
          var subMenu = $scope.doctorMenu[sub];
          for (var idx in subMenu) {
            if (toState.name == subMenu[idx].location) {
              $rootScope.pageTitle = subMenu[idx].text;
            }
          }
        }
        for (var subp in $scope.patientMenu) {
          var subMenup = $scope.patientMenu[subp];
          for (var i in subMenup) {
            if (toState.name == subMenup[i].location) {
              $rootScope.pageTitle = subMenup[i].text;
            }
          }
        }

        if (!fromState.name && toState.name != 'entry') {
          // when press 'f5' to refresh page, fromState.name will not be defined.
          onPageRefresh();
        }
      });


    $rootScope.verify = function (openid, access_token, redirect) {
      $http.get('/api/verify', {params: {openid: openid, access_token: access_token}})
        .success(function (resp) {
          // save user verification info to session.
          $cookies.putObject('currentUser', resp.data);
          $rootScope.currentUser = resp.data;
          $rootScope.setDefaultHeader();
          $rootScope.checkUserFirstTime(redirect);
          $rootScope.initWxJsSdk();
        }).error(function (resp, status) {
          $cookies.remove('currentUser');
          if (status == 404) {
            // user not registered
            $rootScope.alertError('', '用户尚未注册。');
          } else {
            $rootScope.alertError(null, resp.error.message, status);
          }
        });
    };

    $rootScope.setDefaultHeader = function () {
      // set default headers for $http service.
      var authorizationStr = 'wechatOAuth openid="' + $scope.currentUser.openid + '" access_token="' + $scope.currentUser.access_token + '"';
      if ($scope.currentUser.doctor) {
        authorizationStr += ' role="doctor"';
      } else if ($scope.currentUser.patient) {
        authorizationStr += ' role="patient"';
      }
      $http.defaults.headers.common.Authorization = authorizationStr;
    };

    $rootScope.checkUserFirstTime = function (redirect) {
      // User must activate before start to use any functions.
      if ($rootScope.currentUser.doctor && !$rootScope.currentUser.doctor.name) {
        $state.go('profile-edit', {openid: $scope.currentUser.openid, firstTime: true});
      } else if ($rootScope.currentUser.patient && !$rootScope.currentUser.patient.name) {
        $state.go('profile-patient-edit', {openid: $scope.currentUser.openid, firstTime: true});
      } else if (redirect) {
        $log.debug('redirect: %s', redirect);
        $state.go(redirect, {openid: $scope.currentUser.openid});
      }
    };

    $rootScope.initWxJsSdk = function () {
      $log.debug('init WX JS-SDK.');
      $http.get('/wechat/jssdkconfig')
        .success(function (resp) {
          wx.config(resp.data);
          wx.ready(function () {
            $log.debug('wx.ready. ', wx);

          });
          wx.error(function () {
            $log.debug('wx.error.', arguments);
          })
        });
    };

    /** -- load page ---------------------------------------------------------------*/
    var onPageRefresh = function () {
      console.log('onPageRefresh');
      var sessionUser = $cookies.getObject('currentUser');
      if (sessionUser) {
        $log.debug('read user from session');
        var openid = sessionUser.openid;
        var access_token = sessionUser.access_token;
        $rootScope.currentUser = sessionUser;
        $rootScope.setDefaultHeader();
        //$rootScope.checkUserFirstTime();
        $rootScope.initWxJsSdk();
      }
    };

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
        if (verifiedData.isPatient) {
          verifiedData.id = verifiedData.patient._id;
        } else {
          verifiedData.id = verifiedData.doctor._id;
        }
        return verifiedData;
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

    $rootScope.generatePatientDisplayData = function (patient) {
      if (patient instanceof Array) {
        for (var i = 0; i < patient.length; i++) {
          $rootScope.generatePatientDisplayData(patient[i]);
        }
      } else {
        if (patient._id) {
          patient.id = patient._id;
        }
        if (patient.birthday) {
          patient.age = commonUtils.calculateAge(patient.birthday);
        }
        if (patient.sex != undefined) {
          patient.displaySex = resources.sex[patient.sex];
        }
        if (patient.level != undefined) {
          patient.displayLevel = resources.patientLevel[patient.level];
        }
        if (patient.sickness) {
          patient.displaySickness = patient.sickness.join('<br>');
        }
      }
      return patient;
    };

    $rootScope.generateDoctorDisplayData = function (doctor) {
      if (doctor instanceof Array) {
        for (var i = 0; i < doctor.length; i++) {
          $rootScope.generateDoctorDisplayData(doctor[i]);
        }
      } else {
        if (doctor._id) {
          doctor.id = doctor._id;
        }
        if (doctor.birthday) {
          doctor.age = commonUtils.calculateAge(doctor.birthday);
        }
        if (doctor.sex != undefined) {
          doctor.displaySex = resources.sex[doctor.sex];
        }
        if (doctor.level != undefined) {
          doctor.displayLevel = resources.patientLevel[doctor.level];
        }
      }
      return doctor;
    };


    /**
     * Get the special type of service of doctor object.
     * @param doctor
     * @param serviceType
     * @returns {{}}
     */
    $rootScope.getDoctorServiceByType = function (doctor, serviceType) {
      var ret = {};
      if (doctor.services) {
        for (var i = 0; i < doctor.services.length; i++) {
          if (doctor.services[i].type == serviceType) {
            ret = doctor.services[i];
            break;
          }
        }
      }
      return ret;
    };
    ///**
    // * If doctor/patient doesn't have avatar set in wechat, use default.
    // * @param user
    // */
    //$rootScope.checkAvatar = function (user) {
    //  if (!user) {
    //    return;
    //  }
    //  if (user instanceof Array) {
    //    for (var i = 0; i < user.length; i++) {
    //      $rootScope.checkAvatar(user[i]);
    //    }
    //  } else {
    //    if (user.wechat && user.wechat.headimgurl) {
    //      user.displayAvatar = user.wechat.headimgurl;
    //    } else if (user.avatar) {
    //      user.displayAvatar = user.avatar;
    //    } else {
    //      user.displayAvatar = resources.defaultAvatar;
    //    }
    //  }
    //};

    $rootScope.checkCommentAvatar = function (comment) {
      if (comment instanceof Array) {
        for (var idx in comment) {
          if (!comment[idx].creator.avatar) {
            comment[idx].creator.avatar = resources.defaultAvatar;
          }
        }
      } else {
        if (!comment.creator.avatar) {
          comment.creator.avatar = resources.defaultAvatar;
        }
      }
    };

    $rootScope.setOrderIcon = function (order) {
      if (order instanceof Array) {
        for (var i = 0; i < order.length; i++) {
          $rootScope.setOrderIcon(order[i]);
        }
      } else {
        order.icon = resources.defaultIcon[order.serviceType];
      }
    };

    /**
     * Generate display booking time of order for showing on order list page and order detail page.
     * @param order
     */
    $rootScope.handleDisplayBookingTime = function (order, noLabel) {
      var sType = resources.doctorServices;
      if (order.serviceType == sType.suizhen.type) {
        if (noLabel) {
          order.displayBookingTime = order.quantity + '个月';
        } else {
          order.displayBookingTime = '预约周期：' + order.quantity + '个月';
        }

      } else {
        var bookingDate = order.bookingTime;
        if (bookingDate) {
          if (typeof(bookingDate) === 'string') {
            bookingDate = new Date(bookingDate);
          }
          var month = bookingDate.getMonth() + 1;
          var date = bookingDate.getDate();
          var hour = bookingDate.getHours();
          var time = ' 上午';
          if (hour > 12) {
            hour = hour - 12;
            time = ' 下午'
          }
          if (order.serviceType == sType.jiahao.type) {
            if (noLabel) {
              order.displayBookingTime = month + '月' + date + '日';
            } else {
              order.displayBookingTime = '预约时间：' + month + '月' + date + '日';
            }
          } else if (order.serviceType == sType.huizhen.type) {
            if (noLabel) {
              order.displayBookingTime = month + '月' + date + '日' + time + hour + '点';
            } else {
              order.displayBookingTime = '预约时间：' + month + '月' + date + '日' + time + hour + '点';
            }
          }
        } else {
          order.displayBookingTime = '尚未预约具体时间';
        }
      }
    };

    $rootScope.checkCommentDeletable = function (comments, currentUser) {
      for (var j = 0; j < comments.length; j++) {
        var comment = comments[j];
        if ((currentUser.doctor && currentUser.doctor._id == comment.creator.id) ||
          (currentUser.patient && currentUser.patient._id == comment.creator.id)) {
          comment.canDelete = true;
        }
      }
    };

    $rootScope.fillLinkText = function (curCase) {
      if (curCase.link) {
        curCase.link.text = resources.linkTypes[curCase.link.linkType].text;
      }
    };

    /**
     * Show the links content of patient cases.
     * @param linkObj
     */
    $rootScope.showLinkTarget = function (linkObj) {
      var target = linkObj.target;
      if (linkObj.linkType == resources.linkTypes.image.value) {
        var port = $location.port();
        var link = $location.protocol() + '://' + $location.host();
        if (port) {
          link = link + ':' + port;
        }
        wx.previewImage({
          current: link + target, // 当前显示图片的http链接
          urls: [link + target] // 需要预览的图片http链接列表
        });
      } else if (linkObj.linkType == resources.linkTypes.medicalImaging.value) {
        window.location.href = target;
      } else if (target.targetType == 'state') {
        $state.go(target.name, target.params);
      }
    };

    /**
     * Platform plus 10% on original price, and the price always be integer.
     * @param price
     */
    $rootScope.calculatePlatformPrice = function (price) {
      // 200 * 1.1 = 220.00000000000003
      return Math.ceil(Number.parseFloat((price * 1.1).toFixed(1)));
    };

    /**
     * Common method to filter patient cases by doctor friends.
     * @type {Array}
     */
    var hiddenCases = [];
    var displayCases = [];
    var hiddenCommentCases = [];
    $rootScope.hideNonFriendCases = function (cases, friendIds, currentUserId) {
      hiddenCases = [];
      displayCases = [];
      hiddenCommentCases = [];
      // filter cases
      for (var i = 0; i < cases.length; i++) {
        var curCase = cases[i];
        if (friendIds.indexOf(curCase.creator.id) == -1 && curCase.creator.id != currentUserId) {
          hiddenCases.push(curCase);
        } else {
          // filter comments
          var hiddenComments = [];
          var displayComments = [];
          for (var j = 0; j < curCase.comments.length; j++) {
            var comment = curCase.comments[j];
            if (friendIds.indexOf(comment.creator.id) == -1 && comment.creator.id != currentUserId) {
              hiddenComments.push(comment);
            } else {
              displayComments.push(comment);
            }
          }
          if (hiddenComments.length > 0) {
            hiddenCommentCases.push({'_id': curCase._id, comments: hiddenComments});
            curCase.comments = displayComments;
          }
          displayCases.push(curCase);
        }
      }
      return displayCases;
    };

    $rootScope.showNonFriendCases = function () {
      var allCases = displayCases.concat(hiddenCases);
      allCases.sort(function (c1, c2) {
        return Date.parse(c2.created) - Date.parse(c1.created);
      });

      for (var h = 0; h < allCases.length; h++) {
        for (var k = 0; k < hiddenCommentCases.length; k++) {
          if (allCases[h]._id == hiddenCommentCases[k]._id) {
            var newComments = allCases[h].comments.concat(hiddenCommentCases[k].comments);
            newComments.sort(function (c1, c2) {
              return Date.parse(c1.created) - Date.parse(c2.created);
            });
            allCases[h].comments = newComments;
            break;
          }
        }
      }
      return allCases;
    };

    var oStatus = resources.orderStatus;
    var finishStatus = [oStatus.finished.value, oStatus.expired.value, oStatus.cancelled.value];
    var warnStatus = [oStatus.init.value];
    var failStatus = [oStatus.rejected.value];
    var waitStatus4Doctor = [oStatus.paid.value];
    var waitStatus4Patient = [oStatus.doctorFinished.value];
    var successStatus4Doctor = [oStatus.confirmed.value];
    var successStatus4Patient = [oStatus.paid.value, oStatus.confirmed.value];
    $rootScope.applyStatusLabelStyle = function (order, isDoctor, isPatient) {
      if (order instanceof Array) {
        for (var idx in order) {
          $rootScope.applyStatusLabelStyle(order[idx]);
        }
      } else {
        order.displayStatus = oStatus[order.status].label;
        if (finishStatus.indexOf(order.status) != -1) {
          order.statusClass = 'label-default';
        } else if (warnStatus.indexOf(order.status) != -1) {
          order.statusClass = 'label-warning';
        } else if (failStatus.indexOf(order.status) != -1) {
          order.statusClass = 'label-danger';
        } else if (isDoctor) {
          if (successStatus4Doctor.indexOf(order.status) != -1) {
            order.statusClass = 'label-success';
          } else if (waitStatus4Doctor.indexOf(order.status) != -1) {
            order.statusClass = 'label-primary';
          }
        } else if (isPatient) {
          if (successStatus4Patient.indexOf(order.status) != -1) {
            order.statusClass = 'label-success';
          } else if (waitStatus4Patient.indexOf(order.status) != -1) {
            order.statusClass = 'label-primary';
          }
        }
      }
    };


    $scope.menu = [
      {label: 'dashboard', location: 'dashboard', icon: 'fa-tachometer'},
      {label: 'pomodoro', location: 'pomodoro', icon: 'fa-clock-o'},
      {label: 'todo', location: 'todo', icon: 'fa-tasks'},
      {label: 'profile', location: 'profile', icon: 'fa-user'}];


    $scope.doctorMenu = {
      sub1: [
        {
          "text": "全部患者",
          "href": "wxindex.html#/doctor/patients",
          "location": "doctor-my-patients"
        }, {
          "text": "随诊病历",
          "href": "wxindex.html#/doctor/patients/cases",
          "location": "doctor-patients-cases"
        }, {
          "text": "我的预约",
          "href": "wxindex.html#/doctor/orders",
          "location": "doctor-orders"
        }],
      sub2: [
        {
          "text": "医生搜索",
          "href": "wxindex.html#/search/doctor",
          "location": "search-doctor"
        }, {
          "text": "我的医友",
          "href": "wxindex.html#/doctor/friends",
          "location": "doctor-my-friends"
        }],
      sub3: [
        {
          "text": "商城",
          "href": "wxindex.html#/shop",
          "location": "shop"
        }, {
          "text": "交易记录",
          "href": "wxindex.html#/doctor/orders/history",
          "location": "doctor-orders-history"
        }, {
          "text": "个人设置",
          "href": "wxindex.html#/profile/doctor/",
          "location": "profile"
        }]
    };
    $scope.patientMenu = {
      sub1: [
        {
          "text": "搜索医生",
          "href": "wxindex.html#/search/doctor",
          "location": "search-patient"
        }, {
          "text": "我的医生",
          "href": "wxindex.html#/patient/doctors",
          "location": "patient-my-doctors"
        }, {
          "text": "我的预约",
          "href": "wxindex.html#/patient/orders",
          "location": "patient-orders"
        }],
      sub2: [
        {
          "text": "寻找病友",
          "href": "wxindex.html#/search/patient",
          "location": "search-patient"
        }, {
          "text": "我的病友",
          "href": "wxindex.html#/patient/friends",
          "location": "patient-my-friends"
        }, {
          "text": "病友病历",
          "href": "wxindex.html#/patient/friends/cases",
          "location": "patient-friends-cases"
        }, {
          "text": "我的病历",
          "href": "wxindex.html#/patient/cases/",
          "location": "patient-cases"
        }],
      sub3: [
        {
          "text": "商城",
          "href": "wxindex.html#/shop",
          "location": "shop"
        }, {
          "text": "交易记录",
          "href": "wxindex.html#/patient/orders/history",
          "location": "patient-orders-history"
        }, {
          "text": "个人设置",
          "href": "wxindex.html#/profile/patient/",
          "location": "profile-patient"
        }]
    };
  }
  ])
  .
  controller('entryCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$http', '$cookies', '$log', function ($scope, $rootScope, $state, $stateParams, $http, $cookies, $log) {
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
      $log.info('entryCtrl:verifyAndGetUserInfo()', $rootScope.stateName);
      //$cookies.remove('currentUser');
      var openid = $stateParams.openid;
      var access_token = $stateParams.token;
      var redirect = $stateParams.redirect;
      $log.debug('init page. openid: %s, access_token: %s, redirect: %s', openid, access_token, redirect);
      if (!openid || !access_token) {
        $log.debug('invalid openid or access_token');
        $rootScope.alertError('', 'invalid openid or access_token');
        return;
      } else {
        $rootScope.verify(openid, access_token, redirect);
      }
    };
    verifyAndGetUserInfo();
  }]);
