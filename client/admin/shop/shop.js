/**
 * Created by Ting on 2015/8/20.
 */
angular.module('ylbAdmin')
  .controller('adminShopCtrl', ['$scope', '$rootScope', '$http', '$log', '$timeout', 'FileUploader', function ($scope, $rootScope, $http, $log, $timeout, FileUploader) {
    $log.log('init adminShopCtrl');
    var editingItemCopy;


    loadItems();
    createUmEditor();


    /* ************************ init uploader */
    var uploader = $scope.uploader = new FileUploader({
      //queueLimit: 1,
      url: '/admin/upload'
    });
    uploader.filters.push({
      name: 'imageFilter',
      fn: function (item /*{File|FileLikeObject}*/, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });
    uploader.onWhenAddingFileFailed = function (item /*{File|FileLikeObject}*/, filter, options) {
      console.info('onWhenAddingFileFailed', item, filter, options);
      if (filter.name == 'imageFilter') {
        $rootScope.alertError('', '请选择图片文件。');
      } else {
        $rootScope.alertError('', filter);
      }
    };
    uploader.onAfterAddingFile = function (fileItem) {
      console.info('onAfterAddingFile', fileItem);
      if (uploader.queue.length > 1) {
        // only can upload one image.
        uploader.queue.splice(0, 1);
      }
    };
    uploader.onCompleteItem = function (fileItem, response, status, headers) {
      console.info('onCompleteItem', fileItem, response, status, headers);
      doSaveItem(response.url);
    };
    /* ************************* init uploader end */


    var umEditor;
    window.UMEDITOR_HOME_URL = "/common/umeditor/";
    function createUmEditor() {
      umEditor = UM.getEditor("itemEditor", {
        'toolbar': [
          'undo redo | bold italic underline strikethrough | justifyleft justifycenter justifyright justifyjustify |',
          'forecolor backcolor | link unlink | removeformat |',
          'insertorderedlist insertunorderedlist | selectall cleardoc paragraph | fontfamily fontsize |',
          'emotion image | horizontal preview fullscreen'
        ],//superscript subscript | video | map | 'drafts', 'formula'
        'imageUrl': "/admin/upload",
        'imageFieldName': "file",
        'isShow': false,
        'initialFrameWidth': '100%',
        'initialFrameHeight': 200
      });
      umEditor.ready(function () {
        console.log("Created instance of UMEditor:", umEditor);
      });
    }

    function appendUmEditor(item) {
      var itemId = (item._id == undefined ? "" : item._id);
      var editorPlaceholder = $("#itemEditorPlaceholder_" + itemId);
      $log.debug("Editing item:", item);
      console.log("editorPlaceholder:", editorPlaceholder);
      editorPlaceholder.html() == "" && editorPlaceholder.append(umEditor.$container);
      //item.detailEnabled ? umEditor.show() : umEditor.hide();
      umEditor.show();
      item.detail ? umEditor.setContent(item.detail) : umEditor.setContent("");
    }

    function loadItems() {
      $http.get('/admin/goods')
        .success(function (resp) {
          $scope.items = resp.data;
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    }

    $scope.createItem = function () {
      var newItem = {};
      $scope.items.unshift(newItem);
      uploader.queue = [];
      $scope.editingItemIndex = 0;

      // when create item, editorPlaceholder is not exist, so wait for a while for editorPlaceholder dom created.
      var timer = $timeout(
        function () {
          appendUmEditor($scope.items[0]);
        },
        300
      );
    };

    var savingItem;
    $scope.saveItem = function (index, formItem) {
      if (!$rootScope.validateForm(formItem))
        return;

      //savingItem = angular.copy($scope.items[index]);
      savingItem = $scope.items[index];

      if (umEditor != undefined) {
        savingItem.detail = umEditor.getContent();
        //$log.debug("saveItem(), get content of editor:", $scope.items[index].detail);
      }

      $scope.errMsg = {};
      if (!savingItem.pic_url && uploader.queue.length == 0) {
        $scope.errMsg.pic = true;
        return;
      } else if (!savingItem.detail) {
        $scope.errMsg.detail = true;
        return;
      }

      $log.debug("saveItem(), index: " + index + ", item:", savingItem);

      if (uploader.queue.length > 0) {
        // upload image, then will callback to 'doSaveItem()'.
        uploader.uploadAll();
      } else {
        doSaveItem();
      }
    };

    function doSaveItem(fileUrl) {
      if (fileUrl) {
        savingItem.pic_url = fileUrl;
      }
      $log.debug('doSaveItem(), after file uploaded: ', savingItem);
      if (savingItem._id) {
        $http.put('/admin/goods/' + savingItem._id, savingItem)
          .success(function (resp) {
            $scope.editingItemIndex = undefined;
          }).error(function (resp, status) {
            $rootScope.alertError(null, resp, status);
          });
      } else {
        $http.post('/admin/goods', savingItem)
          .success(function (resp) {
            $scope.items[0] = resp.data;
            $scope.editingItemIndex = undefined;
          }).error(function (resp, status) {
            $rootScope.alertError(null, resp, status);
          });
      }
    }

    $scope.editItem = function (index) {
      if ($scope.editingItemIndex != undefined && $scope.editingItemIndex != index) {
        $scope.cancelItem();
      }
      uploader.queue = [];
      $scope.editingItemIndex = index;
      editingItemCopy = angular.copy($scope.items[index]); // backup item for cancel use.
      appendUmEditor($scope.items[index]);
    };

    $scope.cancelItem = function () {
      var index = $scope.editingItemIndex;
      if (index != undefined && $scope.items[index]) {
        var itemId = $scope.items[index]._id;
        if (itemId) {
          $scope.items[index] = angular.copy(editingItemCopy); // copy backup back.
        } else {
          // delete editing item which is just created.
          $scope.items.shift();
        }
      }
      $scope.errMsg = {};
      $scope.editingItemIndex = undefined;
      editingItemCopy = null;
    };

    $scope.deleteItem = function (index) {
      var itemId = $scope.items[index]._id;
      $http.delete('/admin/goods/' + itemId)
        .success(function (resp) {
          $scope.items.splice(index, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };

    $scope.updateItemInSell = function (index, inSell) {
      var item = $scope.items[index];
      item.is_in_sale = inSell;
      $http.put('/admin/goods/' + item._id, item)
        .success(function (resp) {
          $rootScope.alertSuccess('', '更新成功', null, 1);
        }).error(function (resp, status) {
          $rootScope.alertError(null, resp, status);
        });
    };
  }]);
