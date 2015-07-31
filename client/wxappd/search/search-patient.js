/**
 * Search patients.
 * Created by Ting on 2015/7/28.
 */
angular.module('ylbWxApp')
  .controller('wxSearchPatientCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    $scope.matchLevelToSearch = currentUser.isPatient && currentUser.patient.level > 1;
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
      if ($scope.search.province) {
        filter.province = $scope.search.province;
        filter.city = $scope.search.city;
      }
      if ($scope.search.sickness) {
        filter.sickness = '*' + $scope.search.sickness + '*';
      }
      filter.level = {'$gt': 1}; // search result will only include 'regular' patients..
      var params = {filter: filter, limit: 20};
      $http.get('/api/patients', {params: params})
        .success(function (resp) {
          if (resp.count > 0) {
            // remove current user from search list.
            if (currentUser.isPatient) {
              for (var i = 0; i < resp.data.length; i++) {
                if (resp.data[i]._id == currentUser.patient._id) {
                  resp.data.splice(i, 1);
                  break;
                }
              }
            }

            $rootScope.searchPatientParams = params;
            $rootScope.searchPatientResult = resp.data;
            $state.go('search-patient-result');
          } else {
            $rootScope.alertWarn('', '找不到符合条件的患者。');
          }
        }).error(function (err, status) {
          $rootScope.alertError(null, err, status);
        });
    };
  }]);
