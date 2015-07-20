/**
 * Created by Ting on 2015/7/11.
 */
angular.module('ylbWxApp')
  .controller('wxProfileCtrl', ['$scope', '$rootScope', '$stateParams', '$http', '$alert', 'ylb.resources', function ($scope, $rootScope, $stateParams, $http, $alert, resources) {

    var openid = $stateParams.openid;
    if (openid) {
      // load doctor data.
      $http.get('/api/doctors', {params: {filter: {'wechat.openid': openid}}})
        .success(function (res) {
          if (res.count > 0) {
            var doctor = res.data[0];
            $scope.doctor = angular.copy(doctor);
            delete $scope.doctor.wechat; // won't change wechat data.
            if (!$scope.doctor.name) {
              $scope.doctor.name = doctor.wechat.nickname;
            }
            if ($scope.doctor.mobile.indexOf('openid_') == 0) {
              $scope.doctor.mobile = '';
            }
            if (!$scope.doctor.province) {
              angular.forEach(resources.province, function (value, key) {
                if (value == doctor.wechat.province) {
                  $scope.onProvinceSelected(key);
                }
              });
              $scope.doctor.city = doctor.wechat.city;
            }
            if (!$scope.doctor.sex) {
              $scope.doctor.displaySex = resources.sex[doctor.wechat.sex];
              $scope.doctor.sex = doctor.wechat.sex;
            } else {
              $scope.doctor.displaySex = resources.sex[doctor.sex];
            }
            $scope.doctor.displayLevel = resources.doctorLevel[doctor.level];
          }
          prepareDropDownData();
        }).error(function (err) {

        });
    } else {
      $alert({title: '页面加载错误：', content: '请从微信访问此页面。', placement: 'top', type: 'danger', container: '#alert'});
      return;
    }

    var initTabs = function () {
      $scope.tabs = [
        {"title": "基本信息", "content": ""},
        {"title": "加号设置", "content": ""},
        {"title": "会诊设置", "content": ""},
        {"title": "随诊设置", "content": ""}];
      $scope.tabs.activeTab = "基本信息";
    };
    initTabs();

    var prepareDropDownData = function () {
      $scope.ddSex = [];
      angular.forEach(resources.sex, function (value, key) {
        $scope.ddSex.push({'text': value, 'click': 'onSexSelected("' + key + '")'});
      });

      $scope.ddProvince = [];
      angular.forEach(resources.province, function (value, key) {
        $scope.ddProvince.push({'text': value, 'click': 'onProvinceSelected("' + key + '")'});
      });

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
      $scope.ddCity = [];
      angular.forEach($scope.city, function (value, key) {
        $scope.ddCity.push({'text': value, 'click': 'onCitySelected("' + key + '")'})
      });
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
      $http.put('/api/doctors/' + $scope.doctor._id, $scope.doctor)
        .success(function (res) {
          $alert({content: '保存成功。', placement: 'top', type: 'success', container: 'form'});
        });
    };
  }]);
