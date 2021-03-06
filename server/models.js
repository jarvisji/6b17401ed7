/**
 Created by Ting on 2015/7/17.
 */
var mongoose = require('mongoose');
var schemas = require('./schemas')();

module.exports = {
  Doctor: mongoose.model('Doctor', schemas.doctorSchema),
  DoctorFriend: mongoose.model('DoctorFriend', schemas.doctorFriendSchema),
  Service: mongoose.model('Service', schemas.serviceSchema),
  ServiceStock: mongoose.model('ServiceStock', schemas.serviceStockSchema),
  ServiceOrder: mongoose.model('ServiceOrder', schemas.serviceOrderSchema),
  Order: mongoose.model('Order', schemas.orderSchema),
  Comment: mongoose.model('Comment', schemas.commentSchema),
  Patient: mongoose.model('Patient', schemas.patientSchema),
  PatientFriend: mongoose.model('PatientFriend', schemas.patientFriendSchema),
  CaseHistory: mongoose.model('CaseHistory', schemas.caseHistorySchema),
  DoctorPatientRelation: mongoose.model('DoctorPatientRelation', schemas.doctorPatientRelationSchema),
  WechatOAuth: mongoose.model('WechatOAuth', schemas.wechatOAuthSchema),
  AdminUser: mongoose.model('AdminUser', schemas.adminUserSchema),
  ShopItem: mongoose.model('ShopItem', schemas.shopItemSchema),
  Message: mongoose.model('Message', schemas.messageSchema),
  doctorExcludeFields: '-password -salt', // we don't want to show these fields in output result.
  patientExcludeFields: '-password -salt'
};
