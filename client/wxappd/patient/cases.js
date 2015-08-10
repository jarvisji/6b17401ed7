/**
 * Created by Ting on 2015/7/30.
 */
angular.module('ylbWxApp')
  .controller('wxPatientCasesCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$location', '$http', '$timeout', '$modal', 'ylb.resources', 'ylb.commonUtils', function ($scope, $rootScope, $state, $stateParams, $location, $http, $timeout, $modal, resources, commonUtils) {
    var currentUser = $rootScope.checkUserVerified();
    var patientId = $stateParams.id ? $stateParams.id : currentUser.isPatient ? currentUser.patient._id : undefined;
    if (!patientId) {
      $rootScope.alertError('', '输入错误，无法显示患者病历。');
    }
    $scope.newCase = $scope.newComment = {};


    //var checkViewCasePrivilege = function () {
    //  $http.get('/api/patients/' + patientId + '/cases/viewPrivilege')
    //    .success(function (resp) {
    //      getPatientCases();
    //      checkPostCasePrivilege();
    //    }).error(function (resp, status) {
    //      if (status === 403) {
    //        $rootScope.alertError('', '不能查看此患者病历。');
    //      } else {
    //        $rootScope.alertError(null, resp, status);
    //      }
    //    });
    //};

    var getPatientCases = function () {
      $http.get('/api/patients/' + patientId + '/cases')
        .success(function (resp) {
          checkPostCasePrivilege();
          var cases = resp.data;
          for (var i = 0; i < cases.length; i++) {
            var curCase = cases[i];
            if ((currentUser.doctor && currentUser.doctor._id == curCase.creator.id) ||
              (currentUser.patient && currentUser.patient._id == curCase.creator.id)) {
              curCase.canDelete = true;
            }
            $rootScope.checkCommentDeletable(curCase.comments, currentUser);
            $rootScope.checkAvatar(curCase.creator);
          }
          commonUtils.date.convert2FriendlyDate(cases);
          $scope.cases = cases;
        }).error(function (resp, status) {
          if (status == 403) {
            $rootScope.alertError('', '不能查看此患者病历');
          } else {
            $rootScope.alertError(null, resp, status);
          }
        });
    };
    getPatientCases();

    var checkPostCasePrivilege = function () {
      $http.get('/api/patients/' + patientId + '/cases/postPrivilege')
        .success(function (resp) {
          $scope.hasPostPrivilege = true;
        }).error(function (resp, status) {
          if (status !== 403)
            $rootScope.alertError(null, resp, status);
        });
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
      var callCreateApi = function () {
        $http.post('/api/patients/' + patientId + '/cases', $scope.newCase)
          .success(function (resp) {
            $scope.newCase = {};
            var createdCase = resp.data;
            createdCase.canDelete = true;
            commonUtils.date.convert2FriendlyDate(createdCase);
            $rootScope.checkAvatar(createdCase.creator);
            $scope.cases.unshift(createdCase);
          }).error(function (resp, status) {
            $rootScope.alertError(null, resp, status);
          });
      };

      // upload loacl image to wechat server before create case.
      if ($scope.newCase.link && $scope.newCase.link.linkType == resources.linkTypes.image.value) {
        wx.uploadImage({
          localId: $scope.newCase.link.avatar, // 需要上传的图片的本地ID，由chooseImage接口获得
          isShowProgressTips: 1, // 默认为1，显示进度提示
          success: function (res) {
            $scope.res = res;
            var serverId = res.serverId; // 返回图片的服务器端ID
            $timeout(function () {
              // use target to save serverId, in our server side, will download and replace it.
              $scope.newCase.link.target = serverId;
              callCreateApi();
            }, 100);
          },
          fail: function (res) {
            $scope.fail = arguments;
            $rootScope.alertError('', res.errMsg);
          }
        });
      } else if ($scope.newCase.link && $scope.newCase.link.order) {
        // for jiahao, huizhen, suizhen such service link, we need create order first, then save link with created orderId.
        var newOrder = $scope.newCase.link.order;
        $http.post('/api/orders', newOrder)
          .success(function (resp) {
            console.log(resp);
            $scope.newCase.link.target.params.id = resp.data._id;
            callCreateApi();
          }).error(function (resp, status) {
            $rootScope.alertError(null, resp, status);
          });
      } else {
        callCreateApi();
      }
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
          $rootScope.checkCommentDeletable(resp.data.comments, currentUser);
          commonUtils.date.convert2FriendlyDate(resp.data.comments);
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
    };

    /* -- add links ------------------------------------------------------------------------------- */
    var prepareLinkTypesData = function () {
      var ddLinkTypes = [];
      angular.forEach(resources.linkTypes, function (value, key) {
        if (currentUser.isPatient && (value.forPatient && currentUser.isPatient)) {
          ddLinkTypes.push({'text': value.label, 'click': 'onLinkTypeSelected("' + key + '")'});
        }
        if (currentUser.isDoctor && (value.forDoctor && currentUser.isDoctor)) {
          ddLinkTypes.push({'text': value.label, 'click': 'onLinkTypeSelected("' + key + '")'});
        }
      });
      $scope.ddLinkTypes = ddLinkTypes;
      $scope.selectedLink = {label: '插入链接'};
    };
    prepareLinkTypesData();

    // Pre-fetch an external template populated with a custom scope
    var addLinkModal = $modal({scope: $scope, template: 'wxappd/patient/add-link-modal.tpl.html', show: false});
    // Show when some event occurs (use $promise property to ensure the template has been loaded)
    var showAddLinkModal = function () {
      addLinkModal.$promise.then(addLinkModal.show);
    };

    var addJiahaoModal = $modal({scope: $scope, template: 'wxappd/doctor/add-jiahao-modal.tpl.html', show: false});
    $scope.showAddJiahaoModal = function (doctorId) {
      $http.get('/api/doctors/' + doctorId + '/serviceStock')
        .success(function (resp) {
          $scope.serviceStock = [];
          if (resp.data.jiahao) {
            var today = commonUtils.date.getTodayStartDate();
            var thisWeek = resp.data.jiahao.thisWeek;
            for (var i = 0; i < thisWeek.length; i++) {
              if (new Date(thisWeek[i].date) < today) {
                thisWeek[i].isPast = true;
              }
            }
            $scope.serviceStock = resp.data.jiahao;
          }
          addJiahaoModal.$promise.then(addJiahaoModal.show);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
    $scope.buyJiahao = function (item) {
      if (item.stock <= 0 || item.isPast) {
        return;
      }
      var newOrder = {
        serviceId: item.serviceId,
        serviceType: resources.doctorServices.jiahao.type,
        doctorId: item.doctorId,
        patientId: patientId,
        price: $scope.serviceStock.price,
        quantity: 1,
        bookingTime: item.date,
        referee: {
          id: currentUser.doctor._id,
          name: currentUser.doctor.name,
          effectDate: new Date()
        }
      };

      var newLink = $scope.newLink;
      newLink.avatar = resources.iconJiahao;
      newLink.title += '的加号';
      newLink.target = {targetType: 'state', name: 'order-detail', params: {}};
      newLink.order = newOrder;
      $scope.newCase.link = newLink;
      addJiahaoModal.$promise.then(addJiahaoModal.hide);
    };

    var addSuizhenModal = $modal({scope: $scope, template: 'wxappd/doctor/add-suizhen-modal.tpl.html', show: false});
    $scope.showAddSuizhenModal = function (doctorId) {
      $http.get('/api/doctors/' + doctorId)
        .success(function (resp) {
          var services = resp.data.services;
          var suizhen;
          for (var idx in services) {
            if (services[idx].type == resources.doctorServices.suizhen.type) {
              suizhen = services[idx];
              break;
            }
          }

          $scope.modalData = {price: suizhen.price, quantity: 1};
          $scope.suizhen = suizhen;
          $scope.suizhenDoctor = resp.data;
          addSuizhenModal.$promise.then(addSuizhenModal.show);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });

    };
    $scope.buySuizhen = function () {
      if ($scope.modalData.quantity < 1 || $scope.modalData.quantity > 12) {
        $rootScope.alertWarn('', '清输入1-12的数字');
        return;
      }
      var newOrder = {
        serviceId: $scope.suizhen._id,
        serviceType: resources.doctorServices.suizhen.type,
        doctorId: $scope.suizhenDoctor._id,
        patientId: patientId,
        price: $scope.modalData.price,
        quantity: $scope.modalData.quantity,
        referee: {
          id: currentUser.doctor._id,
          name: currentUser.doctor.name,
          effectDate: new Date()
        }
      };
      var newLink = $scope.newLink;
      newLink.avatar = resources.iconSuizhen;
      newLink.title += '的随诊';
      newLink.target = {targetType: 'state', name: 'order-detail', params: {}};
      newLink.order = newOrder;
      $scope.newCase.link = newLink;
      addSuizhenModal.$promise.then(addSuizhenModal.hide);
    };

    /********************************************************************************
     * When user select item on the dialog of add link, we generate target data.
     * @param linkType
     * @param item
     */
    $scope.onLinkItemSelected = function (linkType, item) {
      console.log('onLinkItemSelected(), ', item);

      var target;
      var newLink = {linkType: linkType, avatar: item.displayAvatar, title: item.name};

      if (linkType == resources.linkTypes.patient.value) {
        target = {targetType: 'state', name: 'profile-patient', params: {openid: item.id}};
      }
      if (linkType == resources.linkTypes.doctor.value) {
        target = {targetType: 'state', name: 'profile', params: {openid: item.id}};
      }
      if (linkType == resources.linkTypes.shop.value) {
      }
      if (linkType == resources.linkTypes.medicalImaging.value) {
        if (!item.url) {
          $scope.modalData.isShowWarning = true;
          //$rootScope.alertWarn('', '请输入完整的URL（以HTTP或HTTPS开头）');
          return;
        }
        $scope.modalData.isShowWarning = false;
        if (!item.name) {
          newLink.title = resources.defaultMedicalImagingTitle;
        }
        target = item.url;
        addLinkModal.$promise.then(addLinkModal.hide);
      }
      if (linkType == resources.linkTypes.serviceJiahao.value) {
        var doctorId = item.id;
        $scope.showAddJiahaoModal(doctorId);
        $scope.newLink = newLink;
      }
      if (linkType == resources.linkTypes.serviceSuizhen.value) {
        var doctorId = item.id;
        $scope.showAddSuizhenModal(doctorId);
        $scope.newLink = newLink;
      }
      if (linkType == resources.linkTypes.serviceHuizhen.value) {
      }
      newLink.target = target;
      $scope.newCase.link = newLink;
      console.log('new case object:', $scope.newCase);
    };

    /********************************************************************************
     * Show modal when user select to add a link of any type.
     * @param linkType
     */
    $scope.onLinkTypeSelected = function (linkType) {
      var modalData = {type: linkType, title: '', data: []};
      if (linkType == resources.linkTypes.image.value) {
        // refer to: http://mp.weixin.qq.com/wiki/7/aaa137b55fb2e0456bf8dd9148dd613f.html#.E9.A2.84.E8.A7.88.E5.9B.BE.E7.89.87.E6.8E.A5.E5.8F.A3
        wx.chooseImage({
          count: 1, // 默认9
          sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
          sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
          success: function (res) {
            $scope.res = res;
            var localId = res.localIds[0]; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
            $timeout(function () {
              // for some reason of wechat api, we need delay 100ms to update variable.
              $scope.newCase.link = {linkType: linkType, avatar: localId, title: '照片', target: ''};
            }, 100);
          },
          fail: function (res) {
            $scope.fail = arguments;
            $rootScope.alertError('', res.errMsg);
          }
        });
      }
      if (linkType == resources.linkTypes.patient.value) {
        modalData.title = '选择患者';
        if (currentUser.isPatient) {
          $http.get('/api/patients/' + currentUser.id + '/friends')
            .success(function (resp) {
              modalData.data = $rootScope.generatePatientDisplayData(resp.data);
              $scope.modalData = modalData;
              showAddLinkModal();
            }).error(function (resp, status) {
              $rootScope.alertError(null, resp, status);
            });
        }
        if (currentUser.isDoctor) {
          $http.get('/api/doctors/' + currentUser.id + '/patientRelations')
            .success(function (resp) {
              var patients = [];
              for (var i = 0; i < resp.data.length; i++) {
                var relation = resp.data[i];
                patients.push(relation.patient);
              }
              modalData.data = $rootScope.generatePatientDisplayData(patients);
              $scope.modalData = modalData;
              showAddLinkModal();
            }).error(function (resp, status) {
              $rootScope.alertError(null, resp, status);
            });
        }
      }
      if (linkType == resources.linkTypes.doctor.value) {
        modalData.title = '选择医生';
        if (currentUser.isPatient) {
          var currentUserId = currentUser.patient._id;
          $http.get('/api/patients/' + currentUserId + '/doctorRelations')
            .success(function (resp) {
              var doctors = [];
              for (var i = 0; i < resp.data.length; i++) {
                var relation = resp.data[i];
                doctors.push(relation.doctor);
              }
              modalData.data = $rootScope.generateDoctorDisplayData(doctors);
              $scope.modalData = modalData;
              showAddLinkModal();
            }).error(function (resp, status) {
              $rootScope.alertError(null, resp, status);
            });
        }
        // doctor friends
        if (currentUser.isDoctor) {
          _getDoctorFriends(function (resp) {
            modalData.data = $rootScope.generatePatientDisplayData(resp.data);
            $scope.modalData = modalData;
            showAddLinkModal();
          })
        }
      }
      if (linkType == resources.linkTypes.shop.value) {
        modalData.title = '选择商品';
      }
      if (linkType == resources.linkTypes.medicalImaging.value) {
        modalData.title = '输入影像链接';
        modalData.data = {name: '', url: '', displayAvatar: '/assets/image/icon-medical-imaging.png'};
        $scope.modalData = modalData;
        showAddLinkModal();
      }
      if (linkType == resources.linkTypes.serviceJiahao.value) {
        modalData.title = '选择加号服务';
        _getDoctorFriends(function (resp) {
          resp.data.unshift(currentUser.doctor);
          modalData.data = $rootScope.generatePatientDisplayData(resp.data);
          $scope.modalData = modalData;
          showAddLinkModal();
        })
      }
      if (linkType == resources.linkTypes.serviceSuizhen.value) {
        modalData.title = '选择随诊服务';
        _getDoctorFriends(function (resp) {
          resp.data.unshift(currentUser.doctor);
          modalData.data = $rootScope.generatePatientDisplayData(resp.data);
          $scope.modalData = modalData;
          showAddLinkModal();
        })
      }
      if (linkType == resources.linkTypes.serviceHuizhen.value) {
        modalData.title = '选择会诊服务';
      }
    };

    var _getDoctorFriends = function (callback) {
      var currentUserId = currentUser.doctor._id;
      $http.get('/api/doctors/' + currentUserId + '/friends')
        .success(function (resp) {
          callback(resp);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    //var handleUserDisplayData = function (users) {
    //  angular.forEach(users, function (user) {
    //    user.age = commonUtils.calculateAge(user.birthday);
    //    user.displaySex = resources.sex[user.sex];
    //    user.avatar = user.wechat.headimgurl ? user.wechat.headimgurl : resources.defaultAvatar;
    //  });
    //  return users;
    //};
  }]);
