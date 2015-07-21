/**
 * Created by Ting on 2015/7/21.
 */
var stringUtils = require('../../../server/utils/string-utils');
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
});
