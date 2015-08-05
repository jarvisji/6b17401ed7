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
          scopeVar.push({'text': value, 'click': 'onCitySelected("' + key + '")'});
        });
        return scopeVar;
      },

      /**
       * If doctor's level is 3 (real name), should display 'v' icon on his avatar.
       * @param doctors
       */
      checkDoctorVIcon: function (doctors) {
        if (doctors instanceof Array) {
          angular.forEach(doctors, function (doctor) {
            if (doctor.level == 3) {
              doctor.isShowVIcon = true;
            }
          });
        } else if (typeof(doctors) == 'object') {
          if (doctors.level == 3) {
            doctors.isShowVIcon = true;
          }
        }
      },
      date: {
        /*
         * We generated date in service stock which has special value points to the start of a day,
         * so we need this method to get start of today corresponding.
         * @returns {Date}
         */
        getTodayStartDate: function () {
          var today = new Date();
          today.setHours(0, 0, 0, 0);
          return today;
        },
        /**
         * We need display comments created date in special format, like: x秒前， x分前，x小时前
         * @param comments
         */
        convert2FriendlyDate: function (comments) {
          var convertDate = function (date) {
            var tDate = date;
            if (typeof(date) === 'string') {
              tDate = new Date(date);
            }
            var secondsPast = (new Date().getTime() - tDate.getTime()) / 1000;
            var second = 1;
            var secondsInMin = 60;
            var secondsInHour = 3600;
            var secondsInDay = 24 * 3600;
            var ret;
            if (secondsPast < second) {
              ret = '刚刚';
            } else if (secondsPast < secondsInMin) {
              ret = Math.round(secondsPast) + '秒前';
            } else if (secondsPast < secondsInHour) {
              ret = Math.round(secondsPast / secondsInMin) + '分钟前';
            } else if (secondsPast < secondsInDay) {
              ret = Math.round(secondsPast / secondsInHour) + '小时前';
            } else {
              ret = tDate.toLocaleDateString();
            }
            return ret;
          };

          if (comments instanceof Array) {
            for (var idx in comments) {
              comments[idx].displayCreated = convertDate(comments[idx].created);
            }
          } else {
            comments.displayCreated = convertDate(comments.created);
          }
        }
      }
    };
  }]);
