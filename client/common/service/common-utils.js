/**
 * Common utility methods.
 * Created by Ting on 2015/7/20.
 */

angular.module('ylbWxApp')
  .factory('ylb.commonUtils', ['ylb.resources', function (resources) {
    return {
      calculateAge: function (birthday) {
        var birthdayDate = birthday;
        if (!(birthday instanceof Date)) {
          birthdayDate = new Date(birthday);
          if (isNaN(birthdayDate.getTime())) {
            // invalid date, return original value.
            return birthday;
          }
        }

        var currentDate = new Date();
        var age = currentDate.getFullYear() - birthdayDate.getFullYear();
        if (currentDate.getMonth() < birthdayDate.getMonth()) {
          age = age - 1;
        } else if (currentDate.getMonth() == birthdayDate.getMonth()) {
          if (currentDate.getDate() < birthdayDate.getDate()) {
            age = age - 1;
          }
        }
        return age;
      },
      /**
       * Get drop-down data for Provinces.
       * @returns {Array}
       */
      getDdProvince: function () {
        var scopeVar = [];
        angular.forEach(resources.province, function (value, key) {
          scopeVar.push({'text': value, 'click': 'onProvinceSelected("' + key + '")'});
        });
        return scopeVar;
      },
      /**
       * Get province key by name.
       * @param provinceName
       * @returns {*}
       */
      getProvinceKey: function (provinceName) {
        var ret;
        angular.forEach(resources.province, function (value, key) {
          if (value == provinceName) {
            ret = key;
          }
        });
        return ret;
      },
      /**
       * Get drop-down data for Cities of special Province.
       * @param provinceKey
       * @returns {Array}
       */
      getDdCity: function (provinceKey) {
        var scopeVar = [];
        var city = resources.city[provinceKey];
        angular.forEach(city, function (value, key) {
          scopeVar.push({'text': value, 'click': 'onCitySelected("' + key + '")'})
        });
        return scopeVar;
      }
    }
  }]);
