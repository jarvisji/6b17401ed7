/**
 * Created by Ting on 2015/8/3.
 */
module.exports = {

  /**
   * Get the start and end dates of current week.
   * Note, this is calculating working day, now calendar day.
   *
   * @param [date] if date is provided, will use it to calculate week. Otherwise, use current date.
   * @returns {{start: Date, end: Date}}. Date of Monday and Friday of this week.
   */
  getCurrentWeekWorkingDate: function (date) {
    // assume input date is the same timezone to running environment.
    var weekStartDay = 1;
    var weekEndDay = 5;

    var baseDate = date ? date : new Date();
    var weekStartDate = new Date(baseDate.valueOf() - (baseDate.getDay() - weekStartDay) * 86400000);
    weekStartDate.setHours(0, 0, 0, 0);

    var weekEndDate = new Date(baseDate.valueOf() + (weekEndDay - baseDate.getDay()) * 86400000);
    weekEndDate.setHours(23, 59, 59, 999);

    /* setDate(negative value) doesn't work as setDate(positive value) */
    //
    //var weekStartDate = date ? date : new Date();
    //weekStartDate.setDate(weekStartDate.getDate() - (weekStartDate.getDay() - weekStartDay));
    //weekStartDate.setHours(0, 0, 0, 0);
    //
    //var weekEndDate = date ? date : new Date();
    //weekEndDate.setDate(weekEndDate.getDate() + (weekEndDay - weekEndDate.getDay()));
    //weekEndDate.setHours(23, 59, 59, 999);
    return {start: weekStartDate, end: weekEndDate};
  },
  /**
   * Get the start and end dates of next week.
   * Note, this is calculating working day, now calendar day.
   * @returns {{start: Date, end: Date}}. Date of Monday and Friday of next week.
   */
  getNextWeekWorkingDate: function (baseDate) {
    var currentWeek = this.getCurrentWeekWorkingDate(baseDate);
    var nextWeekStartDate = new Date(currentWeek.start);
    var nextWeekEndDate = new Date(currentWeek.end);
    nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 7);
    nextWeekEndDate.setDate(nextWeekEndDate.getDate() + 7);
    return {start: nextWeekStartDate, end: nextWeekEndDate};
  },

  /**
   * Get array of date which 'gte' start and 'lte' end.
   * @param start
   * @param end
   */
  getDateInRange: function (start, end) {
    var daysInRange = (end.valueOf() - start.valueOf()) / 86400000;
    var ret = [];
    for (var i = 0; i < daysInRange; i++) {
      var tmpDate = new Date(start);
      tmpDate.setDate(tmpDate.getDate() + i);
      ret.push(tmpDate);
    }
    return ret;
  },

  /**
   * This is corresponding function to getCurrentWeekWorkingDate() and getDateInRange().
   * We generated date in week which has special value points to the start of a day,
   * so we need this method to get start of today.
   * @returns {Date}
   */
  getTodayStartDate: function () {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
};
