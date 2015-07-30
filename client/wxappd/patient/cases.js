/**
 * Created by Ting on 2015/7/30.
 */
angular.module('ylbWxApp')
  .controller('wxPatientCasesCtrl', ['$scope', '$rootScope', '$stateParams', '$http', '$popover', '$modal', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $stateParams, $http, $popover, $modal, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    var patientId = $stateParams.id ? $stateParams.id : currentUser.isPatient ? currentUser.patient._id : undefined;
    if (!patientId) {
      $rootScope.alertError('', '输入错误，无法显示患者病历。');
    }
    $scope.newCase = $scope.newComment = {};


    var checkViewCasePrivilege = function () {
      $http.get('/api/patients/' + patientId + '/cases/viewPrivilege')
        .success(function (resp) {
          getPatientCases();
          checkPostCasePrivilege();
        }).error(function (resp, status) {
          if (status === 403) {
            $rootScope.alertError('', '不能查看此患者病历。');
          } else {
            $rootScope.alertError(null, resp, status);
          }
        });
    };
    checkViewCasePrivilege();


    var getPatientCases = function () {
      $http.get('/api/patients/' + patientId + '/cases')
        .success(function (resp) {
          $scope.cases = resp.data;
          for (var i = 0; i < $scope.cases.length; i++) {
            var curCase = $scope.cases[i];
            if ((currentUser.doctor && currentUser.doctor._id == curCase.creator.id) ||
              (currentUser.patient && currentUser.patient._id == curCase.creator.id)) {
              curCase.canDelete = true;
            }
            checkCommentDeletable(curCase.comments);
          }
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    var checkPostCasePrivilege = function () {
      $http.get('/api/patients/' + patientId + '/cases/postPrivilege')
        .success(function (resp) {
          $scope.hasPostPrivilege = true;
        }).error(function (resp, status) {
          if (status !== 403)
            $rootScope.alertError(null, resp, status);
        });
    };

    var checkCommentDeletable = function (comments) {
      for (var j = 0; j < comments.length; j++) {
        var comment = comments[j];
        if ((currentUser.doctor && currentUser.doctor._id == comment.creator.id) ||
          (currentUser.patient && currentUser.patient._id == comment.creator.id)) {
          comment.canDelete = true;
        }
      }
    };

    $scope.deleteCase = function (index) {
      $http.delete('/api/patients/' + patientId + '/cases/' + $scope.cases[index]._id)
        .success(function (resp) {
          $scope.cases.splice(index, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };


    $scope.createCase = function () {
      $http.post('/api/patients/' + patientId + '/cases', $scope.newCase)
        .success(function (resp) {
          $scope.newCase = {};
          var createdCase = resp.data;
          createdCase.canDeleteCase = true;
          $scope.cases.unshift(createdCase);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.showCommentInput = function (index) {
      for (var i = 0; i < $scope.cases.length; i++) {
        $scope.cases[i].isShowCommentInput = false;
      }
      $scope.cases[index].isShowCommentInput = true;
    };

    $scope.createComment = function (caseIndex) {
      var curCase = $scope.cases[caseIndex];
      $http.post('/api/patients/' + patientId + '/cases/' + curCase._id + '/comments', $scope.newComment)
        .success(function (resp) {
          // return data is the updated case.
          checkCommentDeletable(resp.data.comments);
          $scope.cases[caseIndex] = resp.data;
          $scope.newComment = {};
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.deleteComment = function (theCase, commentIdx) {
      $http.delete('/api/patients/' + patientId + '/cases/' + theCase._id + '/comments/' + theCase.comments[commentIdx]._id)
        .success(function (resp) {
          theCase.comments.splice(commentIdx, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    }
  }]);
