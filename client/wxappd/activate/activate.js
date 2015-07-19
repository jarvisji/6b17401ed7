/**
 * Created by Ting on 2015/7/11.
 */
angular.module('ylbWxApp')
  .controller('wxActivateCtrl', ['$scope', 'ylb.resources', function ($scope, resources) {

    var prepareDropDownData = function () {
      $scope.ddSex = [
        {'text': resources.sex.male, 'click': 'onSexSelected("male")'},
        {'text': resources.sex.female, 'click': 'onSexSelected("female")'}
      ];
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
    prepareDropDownData();

    $scope.doctor = {
      displaySex: resources.sex.male
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
    };

    $scope.onSexSelected = function (sex) {
      $scope.doctor.displaySex = resources.sex[sex];
    };

    $scope.onProvinceSelected = function (provinceKey) {
      $scope.doctor.province = resources.province[provinceKey];
      $scope.city = resources.city[provinceKey];
      // prepare city data.
      $scope.ddCity = [];
      angular.forEach($scope.city, function (value, key) {
        $scope.ddCity.push({'text': value, 'click': 'onCitySelected("' + key + '")'})
      });
    };

    $scope.onCitySelected = function (cityKey) {
      $scope.doctor.city = $scope.city[cityKey];
    };


  }]);
