/**
 * Created by Ting on 2015/7/20.
 */
angular.module('ylbWxApp')
  .controller('wxProfileEditCtrl', ['$scope', '$rootScope', '$stateParams', '$state', '$timeout', '$http', '$alert', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $stateParams, $state, $timeout, $http, $alert, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    var openid = $stateParams.openid ? $stateParams.openid : currentUser.openid;
    $scope.firstTime = $stateParams.firstTime;
    // load doctor data on page init.
    var loadDoctorData = function () {
      $http.get('/api/doctors', {params: {filter: {'wechat.openid': openid}}})
        .success(function (res) {
          if (res.count > 0) {
            var doctor = res.data[0];
            prepareDoctorData(doctor);
          }
          prepareDropDownData();
        }).error(function (err) {

        });
    };
    if (currentUser && currentUser.openid == openid) {
      loadDoctorData();
    } else {
      $rootScope.alertError('', '没有权限。');
    }

    /**
     * Copy wechat data if doctor data was not set.
     * Set some display data according to model data.
     * @param doctor
     */
    var prepareDoctorData = function (doctor) {
      $scope.doctor = angular.copy(doctor);
      if (!$scope.doctor.name) {
        $scope.doctor.name = doctor.wechat.nickname;
      }

      if (isNaN($scope.doctor.mobile)) {
        $scope.doctor.mobile = '';
      }

      if (!$scope.doctor.province) {
        $scope.doctor.province = doctor.wechat.province;
      }
      var provinceKey = commonUtils.getProvinceKey($scope.doctor.province);
      $scope.onProvinceSelected(provinceKey);

      // Upon 'onProvinceSelected' method will set $scope.doctor.city to ddCity[0], here need set it back..
      if (!doctor.city && doctor.wechat.city) {
        // wechat city is not always same to ours, for example, we defined '合肥市', but wechat is '合肥',
        // so cannot use wechat value directly.
        angular.forEach($scope.city, function (value, key) {
          if (value.indexOf(doctor.wechat.city) === 0) {
            $scope.doctor.city = value;
          }
        });
      } else {
        $scope.doctor.city = doctor.city;
      }

      if (!resources.sex[$scope.doctor.sex]) {
        if (doctor.wechat.sex) {
          $scope.doctor.sex = doctor.wechat.sex;
        } else {
          $scope.doctor.sex = 1;
        }
      }
      $scope.doctor.displaySex = resources.sex[$scope.doctor.sex];

      if ($scope.doctor.birthday) {
        var date = new Date($scope.doctor.birthday);
        $scope.doctor.birthdayYear = date.getFullYear();
        $scope.doctor.birthdayMonth = date.getMonth() + 1;
        $scope.doctor.birthdayDay = date.getDate();
      }

      $scope.doctor.displayLevel = resources.doctorLevel[doctor.level];
    };

    /**
     * Prepare meta-data for drop-down lists.
     */
    var prepareDropDownData = function () {
      $scope.ddSex = [];
      angular.forEach(resources.sex, function (value, key) {
        $scope.ddSex.push({'text': value, 'click': 'onSexSelected("' + key + '")'});
      });

      $scope.ddProvince = commonUtils.getDdProvince();

      $scope.ddYear = [];
      var currentYear = new Date().getFullYear();
      for (var year = currentYear - 100; year <= currentYear - 15; year++) {
        $scope.ddYear.push({'text': year, 'click': 'onYearSelected("' + year + '")'});
      }

      $scope.ddMonth = [];
      for (var month = 1; month <= 12; month++) {
        $scope.ddMonth.push({'text': month, 'click': 'onMonthSelected("' + month + '")'});
      }
    };

    $scope.onYearSelected = function (year) {
      $scope.doctor.birthdayYear = year;
      $scope.doctor.birthday = new Date(Date.UTC($scope.doctor.birthdayYear, $scope.doctor.birthdayMonth - 1, 1));
    };

    $scope.onMonthSelected = function (month) {
      $scope.doctor.birthdayMonth = month;
      //$scope.ddDay = [];
      //var days = 31;
      //if (month % 2 === 0) {
      //  if (month == 2) {
      //    if ($scope.doctor.birthdayYear % 4 === 0) {
      //      days = 29;
      //    } else {
      //      days = 28;
      //    }
      //  } else {
      //    days = 30;
      //  }
      //}
      //for (var day = 1; day <= days; day++) {
      //  $scope.ddDay.push({'text': day, 'click': 'onDaySelected("' + day + '")'});
      //}
      $scope.doctor.birthday = new Date(Date.UTC($scope.doctor.birthdayYear, $scope.doctor.birthdayMonth - 1, 1));
    };

    $scope.onDaySelected = function (day) {
      $scope.doctor.birthdayDay = day;
      $scope.doctor.birthday = new Date(Date.UTC($scope.doctor.birthdayYear, $scope.doctor.birthdayMonth - 1, $scope.doctor.birthdayDay));
      $scope.birthdayInvalid = false;
    };

    $scope.onSexSelected = function (sex) {
      $scope.doctor.displaySex = resources.sex[sex];
      $scope.doctor.sex = sex;
    };

    $scope.onProvinceSelected = function (provinceKey) {
      $scope.doctor.province = resources.province[provinceKey];
      $scope.city = resources.city[provinceKey];
      // prepare city data.
      $scope.ddCity = commonUtils.getDdCity(provinceKey);
      $scope.doctor.city = $scope.ddCity[0].text;
    };

    $scope.onCitySelected = function (cityKey) {
      $scope.doctor.city = $scope.city[cityKey];
    };

    $scope.save = function (form) {
      if (!$rootScope.validateForm(form))
        return;

      var doctor = $scope.doctor;
      $scope.birthdayInvalid = !doctor.birthday;
      $scope.provinceInvalid = !doctor.province;
      $scope.cityInvalid = !doctor.city;
      $scope.sexInvalid = !doctor.sex;
      if ($scope.birthdayInvalid || $scope.provinceInvalid || $scope.cityInvalid || $scope.sexInvalid) {
        return;
      }
      doctor.avatar = doctor.wechat.headimgurl ? doctor.wechat.headimgurl : resources.defaultAvatar;

      var openid = doctor.wechat.openid;
      delete doctor.wechat; // won't change wechat data.
      $http.put('/api/doctors/' + doctor._id, doctor)
        .success(function (res) {
          $alert({content: '保存成功。', placement: 'top', type: 'success', container: 'form'});
          $timeout(function () {
            $state.go('profile', {openid: openid});
          }, 1000);
        });
    };

    var uploadAvatar = function (localId) {
      wx.uploadImage({
        localId: localId, //$scope.doctor.avatar, // 需要上传的图片的本地ID，由chooseImage接口获得
        isShowProgressTips: 1, // 默认为1，显示进度提示
        success: function (res) {
          $scope.res = res;
          var serverId = res.serverId; // 返回图片的服务器端ID
          $timeout(function () {
            // use target to save serverId, in our server side, will download and replace it.
            $scope.doctor.avatarMediaId = serverId;
          }, 100);
        },
        fail: function (res) {
          $scope.fail = arguments;
          $rootScope.alertError('', res.errMsg);
        }
      });
    };

    $scope.changeAvatar = function () {
      // refer to: http://mp.weixin.qq.com/wiki/7/aaa137b55fb2e0456bf8dd9148dd613f.html#.E9.A2.84.E8.A7.88.E5.9B.BE.E7.89.87.E6.8E.A5.E5.8F.A3
      wx.chooseImage({
        count: 1, // 默认9
        sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        success: function (res) {
          $scope.res = res;
          var localId = res.localIds[0]; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
          $timeout(function () {
            // for some reason of wechat api, we need delay 100ms to update variable.
            $scope.doctor.avatar = localId;
            uploadAvatar(localId);
          }, 100);
        },
        fail: function (res) {
          $scope.fail = arguments;
          $rootScope.alertError('', res.errMsg);
        }
      });
    };
  }]);
