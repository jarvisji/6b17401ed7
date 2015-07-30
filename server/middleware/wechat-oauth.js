/**
 * Middleware to verify 'Authorization' header:
 * Authorization: wechatOAuth openid="", access_token="", role="patient|doctor".
 *
 * If 'openid' and 'access_token' pair is not found in DB, return 401.
 * Else, if access_token is expired, try to refresh it.
 *
 * If refresh success, set refreshed_access_token in res.
 * If refresh failed, return 401.
 *
 * Last, set 'openid' and 'role' as request query parameters, and call next router.
 * Created by Ting on 2015/7/29.
 */

//TODO: to be implemented.
