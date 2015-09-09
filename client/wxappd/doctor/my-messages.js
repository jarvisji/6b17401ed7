/**
 * Created by jiting on 15/9/8.
 */
angular.module('ylbWxApp')
  .controller('wxDoctorMessagesCtrl', ['$scope', '$rootScope', '$http', '$state', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $state, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();

    getMyMessages();

    function getMyMessages() {
      $http.get('/api/messages/groups')
        .success(function (resp) {
          $scope.groups = resp.data;
          for (var i = 0; i < $scope.groups.length; i++) {
            // check messageSchema, we hasn't save user name, avatar etc for 'to'.
            // if the only message in group is current user send to the relative user, we cannot display avatar unless we get it separately.
            if (!$scope.groups[i].user.name) {
              loadDoctorData($scope.groups[i]);
            }
          }
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    }

    var loadDoctorData = function (group) {
      $http.get('/api/doctors/' + group.user.id)
        .success(function (res) {
          var user = res.data;
          var userInfo = {
            id: user._id,
            name: user.name,
            avatar: user.avatar,
            openid: user.wechat.openid
          };
          group.user = userInfo;
        }).error(function (err) {
          $rootScope.alertError(null, err, status);
        });
    };

    $scope.showDetails = function (relUserId) {
      $state.go('doctor-messages-user', {userId: relUserId});
    };
  }])
  .controller('wxDoctorMessagesUserCtrl', ['$scope', '$rootScope', '$http', '$stateParams', '$timeout', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $http, $stateParams, $timeout, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    var userId = $stateParams.userId;
    var timer;
    $scope.newMessage = {to: userId};

    getMessages();

    function getMessages() {
      $http.get('/api/messages/group/' + userId)
        .success(function (res) {
          var hasUnreadMessages = false;
          for (var i = 0; i < res.data.length; i++) {
            var message = res.data[i];
            if (message.from.id == currentUser.id) {
              message.isSendBySelf = true;
            }
            if (message.status == resources.messageStatus.unread.value && !hasUnreadMessages) {
              hasUnreadMessages = true;
            }
          }
          $scope.messages = res.data;

          if (hasUnreadMessages) {
            timer = $timeout(changeMessagesStatus2Read, 3000);
          }

        }).error(function (err) {
          $rootScope.alertError(null, err, status);
        });
    }


    function changeMessagesStatus2Read() {
      $http.put('/api/messages/group/' + userId)
        .error(function (err) {
          $rootScope.alertError(null, err, status);
        });
    }

    $scope.createMessage = function () {
      console.log($scope.newMessage);
      if ($scope.newMessage.message) {
        $http.post('/api/messages', $scope.newMessage)
          .success(function (res) {
            res.data.isSendBySelf = true;
            $scope.messages.push(res.data);
            $scope.newMessage.message = '';
          }).error(function (err) {
            $rootScope.alertError(null, err, status);
          });
      }
    };

    $scope.$on("$destroy", function (event) {
        $timeout.cancel(timer);
      }
    );

  }]);
