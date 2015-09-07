/**
 * Created by Ting on 2015/8/10.
 */
angular.module('ylbWxApp')
  .controller('wxMyPatientsCasesCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    $scope.uiFlags = {};
    var pageLimit = 20;

    $scope.getPatientCases = function (isShowMore) {
      var params = {limit: pageLimit};
      if (isShowMore) {
        params.createdBefore = $scope.cases[$scope.cases.length - 1].created;
      }
      $http.get('/api/doctors/' + currentUser.id + '/patients/cases', {params: params})
        .success(function (resp) {
          var cases = resp.data;
          for (var i = 0; i < cases.length; i++) {
            var curCase = cases[i];
            if (currentUser.id == curCase.creator.id) {
              curCase.canDelete = true;
            }
            $rootScope.checkCommentDeletable(curCase.comments, currentUser);
            $rootScope.fillLinkText(curCase);
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
    if (currentUser.isDoctor) {
      //if ($rootScope.dataCache.wxMyPatientsCasesCtrl) {
      //  $scope.cases = $rootScope.dataCache.wxMyPatientsCasesCtrl;
      //} else {
      $scope.getPatientCases();
      getFriends();
      getPatients();
      //}
    }

    var friendIds = [];

    function getFriends() {
      $http.get('/api/doctors/' + currentUser.id + '/friends')
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            friendIds.push(resp.data[i]._id);
          }
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    }

    function getPatients() {
      $http.get('/api/doctors/' + currentUser.id + '/patientRelations')
        .success(function (resp) {
          for (var i = 0; i < resp.data.length; i++) {
            friendIds.push(resp.data[i].patient.id);
          }
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
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
          //commonUtils.date.convert2FriendlyDate(resp.data);
          //$scope.cases[caseIndex] = resp.data;
          $scope.cases[caseIndex].comments.push(resp.data.comments[resp.data.comments.length - 1]);
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

    /**
     * Show detail page for creator.
     * @param user
     */
    $scope.showDetails = function (user) {
      if (user.role == resources.role.doctor) {
        $state.go('profile', {openid: user.id});
      } else {
        $state.go('profile-patient', {openid: user.id});
      }
    };

    $scope.hideNonFriendCases = function () {
      $scope.btnPressed = !$scope.btnPressed;
      //console.log(friendIds);
      if ($scope.btnPressed) {
        $scope.cases = $rootScope.hideNonFriendCases($scope.cases, friendIds, currentUser.id);
      } else {
        $scope.cases = $rootScope.showNonFriendCases();
      }
    };
  }]);
