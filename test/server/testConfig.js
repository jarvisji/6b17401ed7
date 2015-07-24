/**
 * Created by Ting on 2015/7/17.
 */
var echostr = '2152790343655210619';
module.exports = {
  serverUrl: 'http://localhost:3001',
  doctorWxProxyUrl: '/wxproxy-doctor/?signature=32db9dfb58aa2ff2da44d09e6c0d4c6c1e03a0c5&timestamp=1433481275&nonce=1552612961&echostr=' + echostr,
  patientWxProxyUrl: '/wxproxy-patient/?signature=32db9dfb58aa2ff2da44d09e6c0d4c6c1e03a0c5&timestamp=1433481275&nonce=1552612961&echostr=' + echostr,
  echostr: echostr,
  doctorOpenId: 'oWTqJs8SEbDON98vMor20rnXh9UQ',
  patientOpenId: 'oWTqJs_isFdwO0vesXACDsELhiLI',
  testData: {
    doctors: [{
      "name": "test1 doctor",
      "mobile": "testDoctor1",
      "level": "1",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "services": [],
      "doctorFriends": [],
      "wechat": {
        "openid": "openid_testDoctor1",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "test2 doctor",
      "mobile": "testDoctor2",
      "level": "2",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "services": [{
        "type": "jiahao",
        "price": 8,
        "weekQuantity": {
          "d5": 7,
          "d4": 6,
          "d3": 5,
          "d2": 4,
          "d1": 2
        }
      }, {
        "type": "huizhen",
        "price": 496
      }, {
        "type": "suizhen",
        "price": 93
      }],
      "doctorFriends": [],
      "wechat": {
        "openid": "openid_testDoctor2",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "test3 doctor",
      "mobile": "testDoctor3",
      "level": "3",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "services": [{
        "type": "jiahao",
        "price": 8,
        "weekQuantity": {
          "d5": 7,
          "d4": 6,
          "d3": 5,
          "d2": 4,
          "d1": 2
        }
      }, {
        "type": "huizhen",
        "price": 496
      }, {
        "type": "suizhen",
        "price": 93
      }],
      "doctorFriends": [],
      "wechat": {
        "openid": "openid_testDoctor3",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }],
    patients: [{
      "name": "test1 patient",
      "mobile": "testPatient1",
      "level": "1",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "doctorFollowed": [],
      "patientFriends": [],
      "wechat": {
        "openid": "openid_testPatient1",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "test2 patient",
      "mobile": "testPatient2",
      "level": "2",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "doctorFollowed": [],
      "patientFriends": [],
      "wechat": {
        "openid": "openid_testPatient2",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }]
  }
};
