/**
 * Created by Ting on 2015/7/15.
 */
module.exports = {
  debugMongooseError: function (err, debug, message /* optional */) {
    if (message)
      debug(message, err);
    else
      debug('Mongoose error: ', err);
  },
  /**
   * Warp different result object to uniform JSON format before response..
   * @param result
   * @param [mix]
   * @returns {{data: Array}}
   */
  jsonResult: function (result, mix) {
    var jsonRet = {data: []};
    if (result instanceof Error) {
      jsonRet.error = {'message': result.message, 'name': result.name};
    } else if (typeof(result) == 'string') {
      jsonRet.message = result;
    } else {
      jsonRet.data = result;
      if (result instanceof Array) {
        jsonRet.count = result.length;
      }
    }
    if (mix && mix instanceof Object) {
      var keys = Object.keys(mix);
      for (var key in keys) {
        jsonRet[key] = mix[key];
      }
    }
    return jsonRet;
  }
};
