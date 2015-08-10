/**
 * Created by Ting on 2015/8/10.
 */
angular.module('ylbWxApp')
  .controller('wxMyFriendsCasesCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    $scope.uiFlags = {};
    var pageLimit = 20;

    $scope.getPatientCases = function (isShowMore) {
      var params = {limit: pageLimit};
      if (isShowMore) {
        params.createdBefore = $scope.cases[$scope.cases.length - 1].created;
      }
      $http.get('/api/patients/' + currentUser.id + '/friends/cases', {params: params})
        .success(function (resp) {
          var cases = resp.data;
          for (var i = 0; i < cases.length; i++) {
            var curCase = cases[i];
            if (currentUser.id == curCase.creator.id) {
              curCase.canDelete = true;
            }
            $rootScope.checkCommentDeletable(curCase.comments, currentUser);
            $rootScope.checkAvatar(curCase.creator);
          }
          commonUtils.date.convert2FriendlyDate(cases);
          if (isShowMore) {
            $scope.cases = $scope.cases.concat(cases);
          } else {
            $scope.cases = cases;
          }
          //$rootScope.dataCache.wxMyPatientsCasesCtrl = $scope.cases;
          if (resp.count < pageLimit) {
            $scope.uiFlags.isNoMoreCases = true;
          }
        }).error(function (resp, status) {
          if (status == 403) {
            $rootScope.alertError('', '没有权限');
          } else {
            $rootScope.alertError(null, resp, status);
          }
        });
    };

    // $rootScope.dataCache.wxMyPatientsCasesCtrl saves retrieved data, if user back from next level page
    // (for example link target page), load data from cache will help to keep page displaying same to before.
    if (currentUser.isPatient) {
      //if ($rootScope.dataCache.wxMyPatientsCasesCtrl) {
      //  $scope.cases = $rootScope.dataCache.wxMyPatientsCasesCtrl;
      //} else {
      $scope.getPatientCases();
      //}
    }

    /** ---------------------------------------------------------------------------------------
     * logic should same to case.js
     */
    $scope.showCommentInput = function (index) {
      $scope.newComment = {};
      for (var i = 0; i < $scope.cases.length; i++) {
        $scope.cases[i].isShowCommentInput = false;
      }
      $scope.cases[index].isShowCommentInput = true;
    };

    $scope.createComment = function (caseIndex) {
      var patientId = $scope.cases[caseIndex].patientId;
      var caseId = $scope.cases[caseIndex]._id;
      $http.post('/api/patients/' + patientId + '/cases/' + caseId + '/comments', $scope.newComment)
        .success(function (resp) {
          // return data is the updated case.
          $rootScope.checkCommentDeletable(resp.data.comments, currentUser);
          $rootScope.checkAvatar(resp.data.creator);
          commonUtils.date.convert2FriendlyDate(resp.data);
          $scope.cases[caseIndex] = resp.data;
          $scope.newComment = {};
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.deleteComment = function (theCase, commentIdx) {
      var patientId = theCase.patientId;
      $http.delete('/api/patients/' + patientId + '/cases/' + theCase._id + '/comments/' + theCase.comments[commentIdx]._id)
        .success(function (resp) {
          theCase.comments.splice(commentIdx, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.deleteCase = function (index) {
      var patientId = $scope.cases[index].patientId;
      var caseId = $scope.cases[index]._id;
      $http.delete('/api/patients/' + patientId + '/cases/' + caseId)
        .success(function (resp) {
          $scope.cases.splice(index, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
  }]);
