/**
 * Created by Ting on 2015/7/21.
 */
var stringUtils = require('../../../server/utils/string-utils');
var dateUtils = require('../../../server/utils/date-utils');
var should = require('should');

describe('Test utility functions.', function () {
  it('Test stringUtils.startWith().', function () {
    should(stringUtils.startWith('abc', 'a')).equal(true);
    should(stringUtils.startWith('abc', 'b')).equal(false);
    should(stringUtils.startWith('abc', 'c')).equal(false);
    should(stringUtils.startWith('abc', 'ab')).equal(true);
    should(stringUtils.startWith('abc', 'bc')).equal(false);
    should(stringUtils.startWith('abc', 'abc')).equal(true);
    should(stringUtils.startWith('', 'abc')).equal(false);
    should(stringUtils.startWith(undefined, 'abc')).equal(false);
  });

  it('Test stringUtils.endWith().', function () {
    should(stringUtils.endWith('abc', 'c')).equal(true);
    should(stringUtils.endWith('abc', 'b')).equal(false);
    should(stringUtils.endWith('abc', 'a')).equal(false);
    should(stringUtils.endWith('abc', 'bc')).equal(true);
    should(stringUtils.endWith('abc', 'ab')).equal(false);
    should(stringUtils.endWith('abc', 'abc')).equal(true);
    should(stringUtils.endWith('', 'abc')).equal(false);
    should(stringUtils.endWith(undefined, 'abc')).equal(false);
  });

  it('Test dateUtils.getCurrentWeekWorkingDate().', function() {
    // assume timezone is GMT+8.
    // cross month
    var ret = dateUtils.getCurrentWeekWorkingDate(new Date('2015/08/01'));
    should(ret.start.toISOString()).equal("2015-07-26T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-07-31T15:59:59.999Z");

    ret = dateUtils.getCurrentWeekWorkingDate(new Date('2015/08/02'));
    should(ret.start.toISOString()).equal("2015-08-02T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-07T15:59:59.999Z");

    ret = dateUtils.getCurrentWeekWorkingDate(new Date('2015/08/03'));
    should(ret.start.toISOString()).equal("2015-08-02T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-07T15:59:59.999Z");

    ret = dateUtils.getCurrentWeekWorkingDate(new Date('2015/08/04'));
    should(ret.start.toISOString()).equal("2015-08-02T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-07T15:59:59.999Z");

    ret = dateUtils.getCurrentWeekWorkingDate(new Date('2015/08/05'));
    should(ret.start.toISOString()).equal("2015-08-02T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-07T15:59:59.999Z");

    ret = dateUtils.getCurrentWeekWorkingDate(new Date('2015/08/06'));
    should(ret.start.toISOString()).equal("2015-08-02T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-07T15:59:59.999Z");

    ret = dateUtils.getCurrentWeekWorkingDate(new Date('2015/08/07'));
    should(ret.start.toISOString()).equal("2015-08-02T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-07T15:59:59.999Z");

    ret = dateUtils.getCurrentWeekWorkingDate(new Date('2015/08/08'));
    should(ret.start.toISOString()).equal("2015-08-02T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-07T15:59:59.999Z");

    // cross week
    ret = dateUtils.getCurrentWeekWorkingDate(new Date('2015/08/09'));
    should(ret.start.toISOString()).equal("2015-08-09T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-14T15:59:59.999Z");

    // cross year
    ret = dateUtils.getCurrentWeekWorkingDate(new Date('2016/01/01'));
    should(ret.start.toISOString()).equal("2015-12-27T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2016-01-01T15:59:59.999Z");
  });

  it('Test dateUtils.getNextWeekWorkingDate().', function() {
    // assume timezone is GMT+8.
    // cross month
    var ret = dateUtils.getNextWeekWorkingDate(new Date('2015/08/01'));
    should(ret.start.toISOString()).equal("2015-08-02T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-07T15:59:59.999Z");

    ret = dateUtils.getNextWeekWorkingDate(new Date('2015/08/02'));
    should(ret.start.toISOString()).equal("2015-08-09T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-14T15:59:59.999Z");

    ret = dateUtils.getNextWeekWorkingDate(new Date('2015/08/03'));
    should(ret.start.toISOString()).equal("2015-08-09T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-14T15:59:59.999Z");

    ret = dateUtils.getNextWeekWorkingDate(new Date('2015/08/04'));
    should(ret.start.toISOString()).equal("2015-08-09T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-14T15:59:59.999Z");

    ret = dateUtils.getNextWeekWorkingDate(new Date('2015/08/05'));
    should(ret.start.toISOString()).equal("2015-08-09T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-14T15:59:59.999Z");

    ret = dateUtils.getNextWeekWorkingDate(new Date('2015/08/06'));
    should(ret.start.toISOString()).equal("2015-08-09T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-14T15:59:59.999Z");

    ret = dateUtils.getNextWeekWorkingDate(new Date('2015/08/07'));
    should(ret.start.toISOString()).equal("2015-08-09T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-14T15:59:59.999Z");

    ret = dateUtils.getNextWeekWorkingDate(new Date('2015/08/08'));
    should(ret.start.toISOString()).equal("2015-08-09T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-14T15:59:59.999Z");

    // cross week
    ret = dateUtils.getNextWeekWorkingDate(new Date('2015/08/09'));
    should(ret.start.toISOString()).equal("2015-08-16T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2015-08-21T15:59:59.999Z");

    // cross year
    ret = dateUtils.getNextWeekWorkingDate(new Date('2015/12/31'));
    should(ret.start.toISOString()).equal("2016-01-03T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2016-01-08T15:59:59.999Z");

    ret = dateUtils.getNextWeekWorkingDate(new Date('2016/01/01'));
    should(ret.start.toISOString()).equal("2016-01-03T16:00:00.000Z");
    should(ret.end.toISOString()).equal("2016-01-08T15:59:59.999Z");
  });

  it('Test dateUtils.getDateInRange().', function() {
    // assume timezone is GMT+8.
    // cross month
    var range = dateUtils.getCurrentWeekWorkingDate(new Date('2015/08/01'));
    should(range.start.toISOString()).equal("2015-07-26T16:00:00.000Z");
    should(range.end.toISOString()).equal("2015-07-31T15:59:59.999Z");
    var dateArr = dateUtils.getDateInRange(range.start, range.end);
    should(dateArr.length).equal(5);
    should(dateArr[0].toISOString()).equal("2015-07-26T16:00:00.000Z");
    should(dateArr[1].toISOString()).equal("2015-07-27T16:00:00.000Z");
    should(dateArr[2].toISOString()).equal("2015-07-28T16:00:00.000Z");
    should(dateArr[3].toISOString()).equal("2015-07-29T16:00:00.000Z");
    should(dateArr[4].toISOString()).equal("2015-07-30T16:00:00.000Z");
  });
});
