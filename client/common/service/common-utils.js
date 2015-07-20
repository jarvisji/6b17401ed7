/**
 * Common utility methods.
 * Created by Ting on 2015/7/20.
 */

angular.module('ylbWxApp')
  .factory('ylb.commonUtils', function () {
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
      }
    }
  });
