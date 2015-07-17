/**
 Created by Ting on 2015/7/17.
 */
var mongoose = require('mongoose');
var schemas = require('./schemas')();

module.exports = {
  Doctor: mongoose.model('Doctor', schemas.doctorSchema),
  Service: mongoose.model('Service', schemas.serviceSchema),
  ServiceStock: mongoose.model('ServiceStock', schemas.serviceStockSchema),
  ServiceOrder: mongoose.model('ServiceOrder', schemas.serviceOrderSchema),
  Comment: mongoose.model('Comment', schemas.commentSchema),
  Patient: mongoose.model('Patient', schemas.patientSchema),
  CaseHistory: mongoose.model('CaseHistory', schemas.caseHistorySchema)
};
