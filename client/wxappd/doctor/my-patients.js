/**
 * Created by jiting on 15/8/6.
 */
angular.module('ylbWxApp')
  .controller('wxMyPatientsCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    var rStatus = resources.relationStatus;
    $scope.uiFlags = {type: 'suizhen'};
    var putong = [];
    var jiwang = [];
    var suizhen = [];

    var getPatientRelations = function () {
      $http.get('/api/doctors/' + currentUser.id + '/patientRelations')
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            var data = resp.data[i];
            data.patient.relationCreated = data.created;
            if (data.status == rStatus.normal.value) {
              putong.push(data.patient);
            } else if (data.status == rStatus.jiwang.value) {
              jiwang.push(data.patient);
            } else if (data.status == rStatus.suizhen.value) {
              suizhen.push(data.patient);
            }
          }
          $rootScope.checkAvatar(putong);
          $rootScope.checkAvatar(jiwang);
          $rootScope.checkAvatar(suizhen);
          $scope.patients = suizhen;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    getPatientRelations();


    /**
     * Show doctor profile.
     * @param openid
     */
    $scope.showDetails = function (patientId) {
      //$state.go('profile-patient', {openid: openid});
      $http.get('/api/patients/' + patientId)
        .success(function (resp) {
          var patient = resp.data;
          $rootScope.generatePatientDisplayData(patient);
          $scope.patientDetail = patient;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.showCases = function (patient) {
      $state.go('patient-cases', {id: patient._id});
    };

    $scope.switchPatients = function (type) {
      $scope.uiFlags.type = type;
      if (type == 'suizhen') {
        $scope.patients = suizhen;
      } else if (type == 'jiwang') {
        $scope.patients = jiwang;
      } else if (type == 'putong') {
        $scope.patients = putong;
      }
    };
  }]);
