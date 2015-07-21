/**
 * Created by Ting on 2015/7/21.
 */

module.exports = {
  /**
   * Check given string is end with finding string or not.
   * @param string
   * @param find
   * @returns {boolean}
   */
  endWith: function (string, find) {
    if (!string)
      return false;
    return string.substr(-1 * find.length) == find;
  },
  /**
   * Check given string is start with finding string or not.
   * @param string
   * @param find
   * @returns {boolean}
   */
  startWith: function (string, find) {
    if (!string)
      return false;
    return string.substr(0, find.length) == find;
  }
};
