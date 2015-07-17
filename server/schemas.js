/**
 Created by Ting on 2015/7/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function () {
  var serviceSchema = new Schema({
    type: {type: String, index: true}, // jiahao, suizhen, huizhen
    price: Number,
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
    level: String, // 1-normal, 2-regular, 3-real
    province: String,
    city: String,
    hospital: String,
    department: String,
    introduction: String,
    mobile: {type: String, index: true, unique: true},
    birthday: Date,
    sex: String, // male, female
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
    doctorFriends: [String], // doctorId
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  doctorSchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  doctorSchema.index({province: 1, city: 1, hospital: 1, department: 1});


  var serviceStockSchema = new Schema({
    doctorId: String,
    serviceId: String,
    date: Date,
    stock: Number
  });
  serviceStockSchema.index({doctorId: 1, date: -1, serviceId: 1});


  var commentSchema = new Schema({
    creator: {
      id: String,
      name: String,
      role: String // doctor, patient
    },
    comment: String,
    created: {type: Date, default: Date.now}
  });
  commentSchema.index({created: 1});


  var serviceOrderSchema = new Schema({
    serviceId: {type: String, index: true},
    doctorId: [{type: String, index: true}],
    patientId: {type: String, index: true},
    quantity: Number,
    bookingTime: Date,
    status: String, // 1-init, 2-payed, 3-confirmed, 4-finished, 5-expired
    referee: {
      id: String,
      name: String,
      effectDate: Date
    },
    comments: [commentSchema],
    rank: Number,
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  serviceOrderSchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });


  var patientSchema = new Schema({
    name: String,
    number: {type: Number, index: true, unique: true},
    level: String, // 1-normal, 2-regular
    province: String,
    city: String,
    sickness: [String],
    mobile: {type: String, index: true, unique: true},
    birthday: Date,
    sex: String, // male, female
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
    doctorFollowed: [String], // doctorId
    patientFriends: [String], // patientId
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  patientSchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  patientSchema.index({province: 1, city: 1, sickness: 1});


  var caseHistorySchema = new Schema({
    patientId: String,
    content: String,
    link: {
      type: String, // image, doctor, patient, shop, medicalImaging, serviceJiahao, serviceSuizhen, serviceHuizhen
      target: String
    },
    creator: {
      id: String,
      name: String,
      role: String // doctor, patient
    },
    comments: [commentSchema],
    created: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now}
  });
  caseHistorySchema.pre('update', function () {
    this.update({}, {$set: {lastModified: new Date()}});
  });
  caseHistorySchema.index({patientId: 1, created: -1});


  return {
    doctorSchema: doctorSchema,
    serviceSchema: serviceSchema,
    serviceStockSchema: serviceStockSchema,
    serviceOrderSchema: serviceOrderSchema,
    commentSchema: commentSchema,
    patientSchema: patientSchema,
    caseHistorySchema: caseHistorySchema
  }
};
