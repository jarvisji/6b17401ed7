/**
 * Created by Ting on 2015/8/5.
 */
angular.module('ylbWxApp')
  .controller('wxOrderDetailCtrl', ['$scope', '$rootScope', '$http', '$state', '$stateParams', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, $stateParams, resources, commonUtils) {
    var currentUser = $scope.currentUser = $rootScope.checkUserVerified();
    var orderId = $stateParams.id;

    var getOrderInfo = function () {
      $http.get('/api/orders/' + orderId)
        .success(function (resp) {
          var order = resp.data;
          $rootScope.checkCommentAvatar(order.comments);
          checkCommentCanBeDelete(order.comments);
          commonUtils.date.convert2FriendlyDate(order.comments);
          $scope.order = order;
          getPatientInfo();
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    getOrderInfo();

    var getPatientInfo = function () {
      var patientId = $scope.order.patient.id;
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
    $scope.newComment = {};
    $scope.createComment = function () {
      $http.post('/api/orders/' + orderId + '/comments', $scope.newComment)
        .success(function (resp) {
          var comments = resp.data.comments;
          checkCommentCanBeDelete(comments);
          $rootScope.checkCommentAvatar(comments);
          commonUtils.date.convert2FriendlyDate(comments);
          $scope.order.comments = comments;
          $scope.newComment = {};
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.deleteComment = function (index) {
      var commentId = $scope.order.comments[index]._id;
      $http.delete('/api/orders/' + orderId + '/comments/' + commentId)
        .success(function (resp) {
          $scope.order.comments.splice(index, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    var checkCommentCanBeDelete = function (comments) {
      for (var idx in comments) {
        if (comments[idx].creator.id == currentUser.id) {
          comments[idx].canDelete = true;
        }
      }
    }
  }]);
