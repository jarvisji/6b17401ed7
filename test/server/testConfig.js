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
    doctorService: [{
      "type": "jiahao",
      "price": 15,
      "weekQuantity": {
        "d5": 5,
        "d4": 6,
        "d3": 7,
        "d2": 8,
        "d1": 9
      }
    }, {
      "type": "huizhen",
      "price": 500
    }, {
      "type": "suizhen",
      "price": 200
    }],
    // doctors, patient for manual test, unitDoctors, unitPatients for unit test cases use.
    doctors: [{
      "name": "测试医生1",
      "mobile": "13810000001",
      "level": "3",
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
      "name": "测试医生2",
      "mobile": "13810000002",
      "level": "3",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "services": [],
      "doctorFriends": [],
      "wechat": {
        "openid": "openid_testDoctor2",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "测试医生3",
      "mobile": "13810000003",
      "level": "2",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "services": [],
      "doctorFriends": [],
      "wechat": {
        "openid": "openid_testDoctor3",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "测试医生4",
      "mobile": "13810000004",
      "level": "1",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "services": [],
      "doctorFriends": [],
      "wechat": {
        "openid": "openid_testDoctor4",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }],
    patients: [{
      "name": "测试患者1",
      "mobile": "13820000001",
      "level": "2",
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
      "name": "测试患者2",
      "mobile": "13820000002",
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
    }, {
      "name": "测试患者3",
      "mobile": "13820000003",
      "level": "2",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "doctorFollowed": [],
      "patientFriends": [],
      "wechat": {
        "openid": "openid_testPatient3",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "测试患者4",
      "mobile": "13820000004",
      "level": "1",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "doctorFollowed": [],
      "patientFriends": [],
      "wechat": {
        "openid": "openid_testPatient4",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }],
    unitDoctors: [{
      "name": "unitDoctor1",
      "mobile": "13910000001",
      "level": "3",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "services": [],
      "doctorFriends": [],
      "wechat": {
        "openid": "openid_unitDoctor1",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "unitDoctor2",
      "mobile": "13910000002",
      "level": "3",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "services": [],
      "doctorFriends": [],
      "wechat": {
        "openid": "openid_unitDoctor2",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "unitDoctor3",
      "mobile": "13910000003",
      "level": "2",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "services": [],
      "doctorFriends": [],
      "wechat": {
        "openid": "openid_unitDoctor3",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "unitDoctor4",
      "mobile": "13910000004",
      "level": "1",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "services": [],
      "doctorFriends": [],
      "wechat": {
        "openid": "openid_unitDoctor4",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }],
    unitPatients: [{
      "name": "unitPatient1",
      "mobile": "13920000001",
      "level": "2",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "doctorFollowed": [],
      "patientFriends": [],
      "wechat": {
        "openid": "openid_unitPatient1",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "unitPatient2",
      "mobile": "13920000002",
      "level": "2",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "doctorFollowed": [],
      "patientFriends": [],
      "wechat": {
        "openid": "openid_unitPatient2",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "unitPatient3",
      "mobile": "13920000003",
      "level": "2",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "doctorFollowed": [],
      "patientFriends": [],
      "wechat": {
        "openid": "openid_unitPatient3",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }, {
      "name": "unitPatient4",
      "mobile": "13920000004",
      "level": "1",
      "province": "北京",
      "city": "朝阳区",
      "password": "NotInUseNowJustForTest",
      "doctorFollowed": [],
      "patientFriends": [],
      "wechat": {
        "openid": "openid_unitPatient4",
        "headimgurl": "/assets/image/avatar-64.jpg"
      }
    }]
  }
};
