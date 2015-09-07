/**
 * Search doctors.
 * Created by Ting on 2015/7/21.
 */
angular.module('ylbWxApp')
  .controller('wxSearchDoctorCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();

    $scope.search = {};
    $scope.ddProvince = commonUtils.getDdProvince();

    $scope.onProvinceSelected = function (provinceKey) {
      $scope.search.province = resources.province[provinceKey];
      $scope.city = resources.city[provinceKey];
      // prepare city data.
      $scope.ddCity = commonUtils.getDdCity(provinceKey);
      $scope.search.city = $scope.ddCity[0].text;
    };

    $scope.onCitySelected = function (cityKey) {
      $scope.search.city = $scope.city[cityKey];
    };

    $scope.performSearch = function () {
      var filter = {};
      if ($scope.search.number !== undefined && $scope.search.number !== '') {
        filter.number = $scope.search.number;
        filter.level = {'$gt': 1}; // search result will only include 'regular' and 'real' doctors.
      } else {
        if ($scope.search.province) {
          filter.province = $scope.search.province;
          filter.city = $scope.search.city;
        }
        if ($scope.search.hospital) {
          filter.hospital = '*' + $scope.search.hospital + '*';
        }
        if ($scope.search.department) {
          filter.department = '*' + $scope.search.department + '*';
        }
        if ($scope.search.title) {
          filter.title = '*' + $scope.search.title + '*';
        }
        if ($scope.search.name) {
          filter.name = '*' + $scope.search.name + '*';
        }
        if ($scope.search.introduction) {
          filter.introduction = '*' + $scope.search.introduction + '*';
        }
        filter.level = {'$gt': 2}; // search result will only include 'real' doctors.
      }

      var params = {filter: filter, limit: 20};
      $http.get('/api/doctors', {params: params})
        .success(function (resp) {
          if (resp.count > 0) {
            // remove current user from search list.
            //if (currentUser.isDoctor) {
            //  for (var i = 0; i < resp.data.length; i++) {
            //    if (resp.data[i]._id == currentUser.doctor._id) {
            //      resp.data.splice(i, 1);
            //      break;
            //    }
            //  }
            //}
            commonUtils.checkDoctorVIcon(resp.data);
            $rootScope.searchDoctorParams = params;
            $rootScope.searchDoctorResult = resp.data;
            $state.go('search-doctor-result');
          } else {
            $rootScope.alertWarn('', '找不到符合条件的医生。');
          }
        }).error(function (err, status) {
          $rootScope.alertError(null, err, status);
        });
    };
  }]);
