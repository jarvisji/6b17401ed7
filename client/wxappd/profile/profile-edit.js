/**
 * Created by Ting on 2015/7/20.
 */
angular.module('ylbWxApp')
  .controller('wxProfileEditCtrl', ['$scope', '$rootScope', '$stateParams', '$state', '$timeout', '$http', '$alert', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $stateParams, $state, $timeout, $http, $alert, resources, commonUtils) {

    var openid = $stateParams.openid;
    // load doctor data on page init.
    if (openid) {
      $http.get('/api/doctors', {params: {filter: {'wechat.openid': openid}}})
        .success(function (res) {
          if (res.count > 0) {
            var doctor = res.data[0];
            prepareDoctorData(doctor);
          }
          prepareDropDownData();
        }).error(function (err) {

        });
    } else {
      $alert({title: '页面加载错误：', content: '请从微信访问此页面。', placement: 'top', type: 'danger', container: '#alert'});
      return;
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

      if ($scope.doctor.mobile.indexOf('openid_') == 0) {
        $scope.doctor.mobile = '';
      }

      if (!$scope.doctor.province) {
        $scope.doctor.province = doctor.wechat.province;
      }
      var provinceKey = commonUtils.getProvinceKey($scope.doctor.province);
      $scope.onProvinceSelected(provinceKey);

      // Upon 'onProvinceSelected' method will set $scope.doctor.city to ddCity[0], here need set it back..
      if (!doctor.city) {
        $scope.doctor.city = doctor.wechat.city;
      } else {
        $scope.doctor.city = doctor.city;
      }


      if (!$scope.doctor.sex) {
        $scope.doctor.displaySex = resources.sex[doctor.wechat.sex];
        $scope.doctor.sex = doctor.wechat.sex;
      } else {
        $scope.doctor.displaySex = resources.sex[doctor.sex];
      }

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
    };

    $scope.onYearSelected = function (year) {
      $scope.doctor.birthdayYear = year;
      $scope.ddMonth = [];
      for (var month = 1; month <= 12; month++) {
        $scope.ddMonth.push({'text': month, 'click': 'onMonthSelected("' + month + '")'});
      }
    };

    $scope.onMonthSelected = function (month) {
      $scope.doctor.birthdayMonth = month;
      $scope.ddDay = [];
      var days = 31;
      if (month % 2 == 0) {
        if (month == 2) {
          if ($scope.doctor.birthdayYear % 4 == 0) {
            days = 29;
          } else {
            days = 28;
          }
        } else {
          days = 30
        }
      }
      for (var day = 1; day <= days; day++) {
        $scope.ddDay.push({'text': day, 'click': 'onDaySelected("' + day + '")'});
      }
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
      if (!$scope.doctor.birthday) {
        $scope.birthdayInvalid = true;
        return;
      }
      var openid = $scope.doctor.wechat.openid;
      delete $scope.doctor.wechat; // won't change wechat data.
      $http.put('/api/doctors/' + $scope.doctor._id, $scope.doctor)
        .success(function (res) {
          $alert({content: '保存成功。', placement: 'top', type: 'success', container: 'form'});
          $timeout(function () {
            $state.go('profile', {openid: openid});
          }, 1000)
        });
    };
  }]);
