/**
 *
 * Created by Ting on 2015/7/22.
 */
angular.module('ylbWxApp')
  .controller('wxProfilePatientEditCtrl', ['$scope', '$rootScope', '$stateParams', '$state', '$timeout', '$http', '$alert', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $stateParams, $state, $timeout, $http, $alert, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    var openid = $stateParams.openid ? $stateParams.openid : currentUser.openid;
    $scope.firstTime = $stateParams.firstTime;

    var loadPatientData = function () {
      // load patient data on page init.
      $http.get('/api/patients', {params: {filter: {'wechat.openid': openid}}})
        .success(function (res) {
          if (res.count > 0) {
            var patient = res.data[0];
            preparePatientData(patient);
          } else {
            $rootScope.alertError('', '用户没有注册。');
          }
          prepareDropDownData();
        }).error(function (err, status) {
          $rootScope.alertError(null, err, status);
        });
    };
    if (currentUser && currentUser.openid == openid) {
      loadPatientData();
    } else {
      $rootScope.alertError('', '没有权限。');
    }

    /**
     * Copy wechat data if patient data was not set.
     * Set some display data according to model data.
     * @param patient
     */
    var preparePatientData = function (patient) {
      $scope.patient = angular.copy(patient);
      if (!$scope.patient.name) {
        $scope.patient.name = patient.wechat.nickname;
      }

      if (isNaN($scope.patient.mobile)) {
        $scope.patient.mobile = '';
      }

      if (!$scope.patient.province) {
        $scope.patient.province = patient.wechat.province;
      }
      var provinceKey = commonUtils.getProvinceKey($scope.patient.province);
      $scope.onProvinceSelected(provinceKey);

      // Upon 'onProvinceSelected' method will set $scope.patient.city to ddCity[0], here need set it back..
      if (!patient.city && patient.wechat.city) {
        // wechat city is not always same to ours, for example, we defined '合肥市', but wechat is '合肥',
        // so cannot use wechat value directly.
        angular.forEach($scope.city, function (value, key) {
          if (value.indexOf(patient.wechat.city) === 0) {
            $scope.patient.city = value;
          }
        });
      } else {
        $scope.patient.city = patient.city;
      }

      if (!resources.sex[$scope.patient.sex]) {
        if (patient.wechat.sex) {
          $scope.patient.sex = patient.wechat.sex;
        } else {
          $scope.patient.sex = 1;
        }
      }
      $scope.patient.displaySex = resources.sex[$scope.patient.sex];

      if ($scope.patient.birthday) {
        var date = new Date($scope.patient.birthday);
        $scope.patient.birthdayYear = date.getFullYear();
        $scope.patient.birthdayMonth = date.getMonth() + 1;
        $scope.patient.birthdayDay = date.getDate();
      }

      $scope.patient.displayLevel = resources.patientLevel[patient.level];
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
      $scope.patient.birthdayYear = year;
      $scope.ddMonth = [];
      for (var month = 1; month <= 12; month++) {
        $scope.ddMonth.push({'text': month, 'click': 'onMonthSelected("' + month + '")'});
      }
    };

    $scope.onMonthSelected = function (month) {
      $scope.patient.birthdayMonth = month;
      $scope.ddDay = [];
      var days = 31;
      if (month % 2 === 0) {
        if (month == 2) {
          if ($scope.patient.birthdayYear % 4 === 0) {
            days = 29;
          } else {
            days = 28;
          }
        } else {
          days = 30;
        }
      }
      for (var day = 1; day <= days; day++) {
        $scope.ddDay.push({'text': day, 'click': 'onDaySelected("' + day + '")'});
      }
    };

    $scope.onDaySelected = function (day) {
      $scope.patient.birthdayDay = day;
      $scope.patient.birthday = new Date(Date.UTC($scope.patient.birthdayYear, $scope.patient.birthdayMonth - 1, $scope.patient.birthdayDay));
      $scope.birthdayInvalid = false;
    };

    $scope.onSexSelected = function (sex) {
      $scope.patient.displaySex = resources.sex[sex];
      $scope.patient.sex = sex;
    };

    $scope.onProvinceSelected = function (provinceKey) {
      $scope.patient.province = resources.province[provinceKey];
      $scope.city = resources.city[provinceKey];
      // prepare city data.
      $scope.ddCity = commonUtils.getDdCity(provinceKey);
      if ($scope.ddCity.length > 0)
        $scope.patient.city = $scope.ddCity[0].text;
    };

    $scope.onCitySelected = function (cityKey) {
      $scope.patient.city = $scope.city[cityKey];
    };

    $scope.save = function (form) {
      if (!$rootScope.validateForm(form))
        return;

      var patient = $scope.patient;
      $scope.birthdayInvalid = !patient.birthday;
      $scope.provinceInvalid = !patient.province;
      $scope.cityInvalid = !patient.city;
      $scope.sexInvalid = !patient.sex;
      if ($scope.birthdayInvalid || $scope.provinceInvalid || $scope.cityInvalid || $scope.sexInvalid) {
        return;
      }
      patient.avatar = patient.wechat.headimgurl ? patient.wechat.headimgurl : resources.defaultAvatar;

      var openid = patient.wechat.openid;
      delete patient.wechat; // won't change wechat data.
      $http.put('/api/patients/' + patient._id, patient)
        .success(function (res) {
          $alert({content: '保存成功。', placement: 'top', type: 'success', container: 'form'});
          $timeout(function () {
            $state.go('profile-patient', {openid: openid});
          }, 1000);
        });
    };
  }
  ])
;
