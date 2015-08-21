/**
 Created by Ting on 2015/7/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Mixed = mongoose.Schema.Types.Mixed;

module.exports = function () {
  var serviceSchema = new Schema({
    type: {type: String, index: true}, // jiahao, suizhen, huizhen
    price: Number, // price that doctor set.
    billingPrice: Number, // price for patient, added rate of platform.
    weekQuantity: {
      d1: Number,
      d2: Number,
      d3: Number,
      d4: Number,
      d5: Number
    }
  });


  var doctorSchema = new Schema({
    name: String,
    number: {type: Number, index: true, unique: true},
    level: {type: String, default: 1}, // 1-normal, 2-regular, 3-real
    province: String,
    city: String,
    hospital: String,
    department: String,
    title: String,
    introduction: String,
    mobile: {type: String, index: true, unique: true},
    birthday: Date,
    sex: String, // 1-male, 2-female, same to wechat
    avatar: String,
    password: String,
    salt: String,
    services: [serviceSchema],
    wechat: {
      subscribe: Number,
      openid: {type: String, index: true, unique: true},
      nickname: String,
      sex: Number,
      language: String,
      city: String,
      province: String,
      country: String,
      headimgurl: String,
      subscribe_time: Date,
      unionid: String,
      remark: String,
      groupid: Number
    },
    //doctorFriends: [String], // doctorId
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  doctorSchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  doctorSchema.index({province: 1, city: 1, hospital: 1, department: 1});

  var doctorFriendSchema = new Schema({
    from: String, // from user id
    fromName: String,
    fromAvatar: String,
    fromOpenid: String,
    to: String, // to user id
    status: {type: String, default: 'requested'}, // requested, accepted, rejected
    message: String,
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  doctorFriendSchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  doctorFriendSchema.index({from: 1, to: 1, status: 1, created: -1});


  var serviceStockSchema = new Schema({
    doctorId: {type: String, index: true},
    serviceId: String,
    date: Date,
    stock: Number
  });
  serviceStockSchema.index({serviceId: 1, date: -1});


  var commentSchema = new Schema({
    creator: {
      id: String,
      name: String,
      avatar: String,
      role: String // doctor, patient
    },
    comment: String,
    created: {type: Date, default: Date.now}
  });
  commentSchema.index({created: 1});


  /**
   * There are some conditions or price:
   * 1. For jiahao order, orderPrice = servicePrice;
   * 2. For suizhen order, orderPrice = servicePrice * quantity * 1.1;
   * 3. For huizhen order, orderPrice = sum(servicePrice of doctors) * 1.1;
   * 4. For extracted order, orderPrice = extracted amount, servicePrice = undefined.
   */
  var serviceOrderSchema = new Schema({
    serviceId: {type: String, index: true, required: true},
    serviceType: String, //jiahao, huizhen, suizhen
    doctors: [{
      id: {type: String, required: true},
      name: String,
      avatar: String,
      title: String,
      department: String,
      hospital: String,
      servicePrice: Number, // for 'huizhen', we need each doctor's service price.
      isConfirmed: Boolean, // for 'huizhen', order will be confirmed only when all doctor confirmed.
      income: {type: Number, default: 0}  // in most cases, income equals servicePrice. Only except there is referee, income = servicePrice * 0.8
    }],
    patient: {
      id: {type: String, required: true},
      name: String,
      avatar: String
    },
    quantity: {type: Number, required: true},
    orderPrice: {type: Number, required: true}, // for patient payment.
    bookingTime: Date,
    status: {type: String, default: 'init'}, // check consts.orderStatus
    referee: {
      id: String,
      name: String,
      effectDate: Date,
      income: {type: Number, default: 0}
    },
    comments: [commentSchema],
    rank: {
      stars: Number,
      memo: String
    },
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  serviceOrderSchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  serviceOrderSchema.index({'doctors.id': 1, 'patient.id': 1, 'referee.id': 1, lastModified: -1, status: 1});


  var patientSchema = new Schema({
    name: String,
    number: {type: Number, index: true, unique: true},
    level: {type: String, default: 1}, // 1-normal, 2-regular
    province: String,
    city: String,
    sickness: [String],
    mobile: {type: String, index: true, unique: true},
    birthday: Date,
    sex: String, // male, female
    avatar: String,
    password: String,
    salt: String,
    wechat: {
      subscribe: Number,
      openid: {type: String, index: true, unique: true},
      nickname: String,
      sex: Number,
      language: String,
      city: String,
      province: String,
      country: String,
      headimgurl: String,
      subscribe_time: Date,
      unionid: String,
      remark: String,
      groupid: Number
    },
    //doctorFollowed: [String], // doctorId
    //doctorInService: [String], // doctorId
    //doctorPast: [String], // doctorId
    //patientFriends: [String], // patientId
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  patientSchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  patientSchema.index({province: 1, city: 1, sickness: 1});

  var patientFriendSchema = new Schema({
    from: String, // from user id
    fromName: String,
    fromAvatar: String,
    fromOpenid: String,
    to: String, // to user id
    status: {type: String, default: 'requested'}, // requested, accepted, rejected
    message: String,
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  patientFriendSchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  patientFriendSchema.index({from: 1, to: 1, status: -1, created: -1});

  var caseHistorySchema = new Schema({
    patientId: String,
    content: String,
    creator: {
      id: String,
      name: String,
      avatar: String,
      role: String // doctor, patient
    },
    link: {
      linkType: String, // image, doctor, patient, shop, medicalImaging, serviceJiahao, serviceSuizhen, serviceHuizhen
      title: String,
      avatar: String,
      target: Mixed
    },
    comments: [commentSchema],
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  caseHistorySchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  caseHistorySchema.index({patientId: 1, created: -1});

  var doctorPatientRelationSchema = new Schema({
    patient: {
      id: String,
      name: String,
      avatar: String
    },
    doctor: {
      id: String,
      name: String,
      avatar: String,
      hospital: String
    },
    status: {
      type: Number, required: true
    }, // 1-putong, 2-jiwang, 3-suizhen, they have priority.
    memo: String,
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  doctorPatientRelationSchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  doctorPatientRelationSchema.index({'patient.id': 1, 'doctor.id': 1, status: 1, 'created': -1});

  var wechatOAuthSchema = new Schema({
    access_token: String,
    expires_in: Number,
    refresh_token: String,
    openid: {type: String, index: true, unique: true},
    scope: String,
    unionid: String,
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  wechatOAuthSchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  wechatOAuthSchema.pre('findOneAndUpdate', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  wechatOAuthSchema.index({openid: 1, access_token: 1});

  var adminUserSchema = new Schema({
    username: String,
    password: String,
    salt: String,
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  adminUserSchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });

  var shopItemSchema = new Schema({
    name: {type: String, required: true},
    //category_id: String,
    //brief: String,
    pic_url: String,
    detail: String,
    //detail_enabled: Boolean,
    price: {type: Number, required: true},
    //original_price: Number,
    //inventory: Number,
    is_in_sale: {type:Boolean, default: true},
    //status: String,
    //spec: String
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });

  return {
    doctorSchema: doctorSchema,
    doctorFriendSchema: doctorFriendSchema,
    serviceSchema: serviceSchema,
    serviceStockSchema: serviceStockSchema,
    serviceOrderSchema: serviceOrderSchema,
    commentSchema: commentSchema,
    patientSchema: patientSchema,
    patientFriendSchema: patientFriendSchema,
    caseHistorySchema: caseHistorySchema,
    doctorPatientRelationSchema: doctorPatientRelationSchema,
    wechatOAuthSchema: wechatOAuthSchema,
    adminUserSchema: adminUserSchema,
    shopItemSchema: shopItemSchema
  };
}
;
