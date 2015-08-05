/**
 * Created by Ting on 2015/8/5.
 */
angular.module('ylbWxApp')
  .controller('wxOrderDetailCtrl', ['$scope', '$rootScope', '$http', '$state', '$stateParams', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, $stateParams, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();

    var getPatientInfo = function () {
      var patientId = $rootScope.order.patient.id;
      if (patientId) {
        $http.get('/api/patients/' + patientId)
          .success(function (resp) {
            var patient = resp.data;
            patient.age = commonUtils.calculateAge(patient.birthday);
            patient.displaySex = resources.sex[patient.sex];
            patient.displayLevel = resources.patientLevel[patient.level];
            patient.displaySickness = patient.sickness.join('<br>');
            $rootScope.checkAvatar(patient);
            $scope.patient = patient;
          }).error(function (resp, status) {
            $rootScope.alertError(null, resp, status);
          });
      }
    };
    getPatientInfo();


  }]);
