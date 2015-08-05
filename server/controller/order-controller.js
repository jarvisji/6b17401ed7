/**
 * Created by Ting on 2015/8/4.
 */

var debug = require('debug')('ylb.orderCtrl');
var utils = require('../middleware/utils');
var stringUtils = require('../utils/string-utils');
var dateUtils = require('../utils/date-utils');

module.exports = function (app) {
  var ServiceOrder = app.models.ServiceOrder;
  var ServiceStock = app.models.ServiceStock;
  var Patient = app.models.Patient;
  var Doctor = app.models.Doctor;

  var orderStatus = app.consts.orderStatus;
  var finalStatus = [orderStatus.rejected, orderStatus.finished, orderStatus.expired, orderStatus.cancelled];
  /**
   * POST '/api/orders'
   * Create service order. Check service stock before create, update service stock after created.
   * @param req
   * @param res
   */
  var createOrder = function (req, res) {
    var newOrder = req.body;
    debug('createOrder(), receive new order data: %o', newOrder);
    if (!newOrder || !newOrder.serviceId || !newOrder.doctorId || !newOrder.patientId || newOrder.price == undefined || newOrder.quantity == undefined || !newOrder.serviceType) {
      debug('createOrder(), invalid data. serviceId: %s, serviceType: %s, doctorId: %s, patientId: %s, price: %s, quantity: %s.', !newOrder.serviceId, !newOrder.serviceType, !newOrder.doctorId, !newOrder.patientId, newOrder.price == undefined, newOrder.quantity == undefined);
      return res.status(400).json(utils.jsonResult(new Error('invalid data')));
    }

    var validServiceTypes = [app.consts.doctorServices.jiahao.type, app.consts.doctorServices.suizhen.type, app.consts.doctorServices.huizhen.type];
    if (validServiceTypes.indexOf(newOrder.serviceType) == -1) {
      debug('createOrder(), invalid service type.');
      return res.status(400).json(utils.jsonResult(new Error('invalid data')));
    }

    if (newOrder.serviceType == app.consts.doctorServices.jiahao.type && !newOrder.bookingTime) {
      debug('createOrder(), missed bookingTime for jiahao service.');
      return res.status(400).json(utils.jsonResult(new Error('invalid data')));
    }

    // fill doctor/patient information to order.
    if (typeof(newOrder.doctorId) === 'string') {
      newOrder.doctorId = [newOrder.doctorId];
    }
    debug('createOrder(), fill doctor information for ids: %o', newOrder.doctorId);
    Doctor.find({_id: {'$in': newOrder.doctorId}}).exec()
      .then(function (doctors) {
        if (doctors.length != newOrder.doctorId.length) {
          throw new Error('doctor not found');
        }
        var orderDoctors = [];
        for (var i = 0; i < doctors.length; i++) {
          var tmpDoctor = doctors[i];
          orderDoctors.push({id: tmpDoctor.id, name: tmpDoctor.name, avatar: tmpDoctor.wechat.headimgurl});
        }
        newOrder.doctors = orderDoctors;
        return Patient.findById(newOrder.patientId).exec();
      }).then(function (patient) {
        if (!patient) {
          throw new Error('patient not found');
        }
        newOrder.patient = {id: patient.id, name: patient.name, avatar: patient.wechat.headimgurl};

        if (newOrder.serviceType == app.consts.doctorServices.jiahao.type) {
          createJiahao();
        } else {
          ServiceOrder.create(newOrder, function (err, createdOrder) {
            if (err) return utils.handleError(err, 'createOrder()', debug, res);
            res.json(createdOrder);
          });
        }
      }).then(null, function (err) {
        utils.handleError(err, 'createOrder()', debug, res);
      });


    var createJiahao = function () {
      var date = newOrder.bookingTime;
      debug('createOrder(), createJiahao(), checking service stock, serviceId: %s, date: %s', newOrder.serviceId, date);
      var serviceStockQuery = {serviceId: newOrder.serviceId, date: date};
      ServiceStock.find(serviceStockQuery).exec()
        .then(function (serviceStock) {
          // check service stock.
          if (!serviceStock) {
            throw new Error('service stock unavailable');
          }
          if (serviceStock.stock <= 0) {
            throw new Error('service sold out');
          }

          // create new order
          return ServiceOrder.create(newOrder);
        }).then(function (createdOrder) {
          res.json(utils.jsonResult(createdOrder));

          // update service stock.
          return ServiceStock.update(serviceStockQuery, {'$inc': {stock: -1}}).exec();
        }).then(null, function (err) {
          if (err) return utils.handleError(err, 'createOrder()', debug, res);
        });
    };


    //// get doctor, check what type of service is going to create.
    //Doctor.findById(newOrder.doctorId, function (err, doctor) {
    //  if (err) return utils.handleError(err, 'createOrder()', debug, res);
    //
    //  if (!doctor) return utils.handleError(new Error('doctor not found'), 'createOrder()', debug, res, 404);
    //
    //  var services = doctor.services;
    //  var serviceType;
    //  for (var idx in services) {
    //    if (newOrder.serviceId == services[idx].id) {
    //      serviceType = services[idx].type;
    //      break;
    //    }
    //  }
    //
    //});


  };
  /**
   * PUT '/api/orders/:id'
   * @param req
   * @param res
   */
  var updateOrder = function (req, res) {
    var orderId = req.params.id;
    var newOrder = req.body;
    var openid = req.query.openid; // operator
    var role = req.query.role; // operator
    debug('updateOrder(), find user by openid: %s, role: %s', openid, role);
    var currentUserId;
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (!user) {
          throw new Error('user not found');
        }
        currentUserId = user.id;
        debug('updateOrder(), find service order: %s', orderId);
        return ServiceOrder.findById(orderId).exec();
      }).then(function (order) {
        if (!order) {
          throw new Error('order not found');
        }
        if (_getOrderDoctorIds(order).indexOf(currentUserId) == -1 && order.patientId != currentUserId) {
          debug('updateOrder(), user: %s hasn\'t privilege to update order: %s', currentUserId, orderId);
          throw new Error('no privilege');
        }
        return ServiceOrder.findByIdAndUpdate(orderId, newOrder).exec();
      }).then(function (result) {
        debug('updateOrder(), order updated.');
        res.json(utils.jsonResult(result));
      }).then(null, function (err) {
        utils.handleError(err, 'updateOrder()', debug, res);
      })
  };

  /**
   * PUT '/api/orders/:id/status/:status'
   * @param req
   * @param res
   */
  var updateOrderStatus = function (req, res) {
    var orderId = req.params.id;
    var newStatus = req.params.status;
    var role = req.query.role; // operator
    var openid = req.query.openid; // operator
    debug('updateOrderStatus(), new status: %s, user role: %s, openid: %s, updating order: %s', newStatus, role, openid, orderId);
    var validStatus = Object.keys(app.consts.orderStatus);
    if (validStatus.indexOf(newStatus) == -1) {
      debug('updateOrderStatus(), invalid status.');
      return res.status(400).json(utils.jsonResult(new Error('invalid status')));
    }

    getUserByOpenid(openid, role, res, function (user) {
      var currentUserId = user.id;
      debug('updateOrderStatus(), find order: %s', orderId);
      ServiceOrder.findById(orderId).exec()
        .then(function (order) {
          if (!order) {
            throw new Error('order not found');
          }
          if (_getOrderDoctorIds(order).indexOf(currentUserId) == -1 && currentUserId != order.patient.id) {
            throw new Error('no privilege');
          }
          if (order.status == newStatus) {
            debug('updateOrderStatus(), newStatus is same to current status: %s, do not change anything.', newStatus);
            return res.json('success');
          } else {
            if (order.status == orderStatus.confirmed && newStatus == orderStatus.cancelled) {
              debug('updateOrderStatus(), confirmed order cannot be cancelled.');
              return res.status(400).json(utils.jsonResult(new Error('order already confirmed')));
            }
            if (finalStatus.indexOf(order.status) != -1) {
              debug('updateOrderStatus(), order status is final, cannot change again.');
              return res.status(400).json(utils.jsonResult(new Error('order status is final')));
            }
          }
          order.status = newStatus;
          order.save(function (err) {
            if (err) return utils.handleError(err, 'updateOrderStatus()', debug, res);
            res.json('success');

            // after order status changed.
            updateServiceStock(order.serviceId);
            updatePatientDoctorRelation(order);
          });
        }).then(null, function (err) {
          utils.handleError(err, 'updateOrderStatus()', debug, res);
        });
    });

    var updateServiceStock = function (serviceId) {
      if (newStatus == orderStatus.cancelled) {
        // increase stock
        var date = dateUtils.getTodayStartDate();
        debug('updateOrderStatus(), updateServiceStock(), new status is %s, increase stock for %s', newStatus, date.toISOString());
        ServiceStock.update({
          serviceId: serviceId,
          date: date
        }, {'$inc': {stock: 1}}, function (err, result) {
          if (err) debug('updateServiceStock(), error: %o', err);
        });
      }
    };

    var updatePatientDoctorRelation = function (order) {
      var patientId = order.patient.id;
      var doctorIds = _getOrderDoctorIds(order);
      if (newStatus == orderStatus.confirmed) {
        debug('updateOrderStatus(), updatePatientDoctorRelation(), new status is %s, add doctorId %s to doctorInService', newStatus, doctorId);
        // add doctorId to 'doctorInService'
        Patient.findByIdAndUpdate(patientId, {'$addToSet': {doctorInService: doctorId}}, function (err) {
          if (err) debug('updatePatientDoctorRelation(), error: %o', err);
        })
      }
      if (newStatus == orderStatus.finished || newStatus == orderStatus.expired) {
        for (var idx in doctorIds) {
          var doctorId = doctorIds[idx];
          ServiceOrder.count({
            'doctors.id': doctorId,
            'patient.id': patientId,
            status: orderStatus.confirmed
          }, function (err, count) {
            if (err)  return debug('updatePatientDoctorRelation(), get order count error: %o', err);
            debug('updateOrderStatus(), updatePatientDoctorRelation(), new status is %s, check order count is: %d', newStatus, count);
            // if no other orders between this patient and doctor, remove doctorId from 'doctorInService'.
            if (count == 0) {
              debug('updateOrderStatus(), updatePatientDoctorRelation(), no more orders, move doctorId: %s from doctorInService to doctorPast.', doctorId);
              Patient.findById(patientId, function (err, patient) {
                if (err)  return debug('updatePatientDoctorRelation(), get patient error: %o', err);
                if (patient) {
                  // remove from 'doctorInService'
                  var idx = patient.doctorInService.indexOf(doctorId);
                  patient.doctorInService.splice(idx, 1);

                  // add doctorId to 'doctorPast'
                  if (patient.doctorPast.indexOf(doctorId) == -1) {
                    patient.doctorPast.push(doctorId);
                  }

                  patient.save(function (err) {
                    if (err)  return debug('updatePatientDoctorRelation(), save patient error: %o', err);
                  })
                }
              });
            }
          });
        }

        //// add doctorId to 'doctorPast'
        //Patient.findByIdAndUpdate(patientId, {'$addToSet': {doctorPast: doctorId}}, function (err) {
        //  if (err) debug('updatePatientDoctorRelation(), error: %o', err);
        //})
      }
    };
  };

  /**
   * GET '/api/orders/my'
   * @param req
   * @param res
   */
  var getOrders = function (req, res) {
    var role = req.query.role; // operator
    _getCommonQueryOfOrder(req, function (err, query) {
      if (err) return utils.handleError(err, 'getOrders()', debug, res);
      query.nin('status', finalStatus).exec()
        .then(function (orders) {
          debug('getOrders(), found %d orders.', orders.length);
          //_appendOrderUsers(role, orders, function (err, newOrders) {
          //  if (err) throw err;
          //  res.json(utils.jsonResult(newOrders));
          //});
          res.json(utils.jsonResult(orders));
        }).then(null, function (err) {
          utils.handleError(err, 'getOrders()', debug, res);
        });
    });
  };

  var getHistoryOrders = function (req, res) {
    var role = req.query.role; // operator
    _getCommonQueryOfOrder(req, function (err, query) {
      if (err) return utils.handleError(err, 'getHistoryOrders()', debug, res);
      query.in('status', finalStatus).exec()
        .then(function (orders) {
          debug('getHistoryOrders(), found %d orders.', orders.length);
          //_appendOrderUsers(role, orders, function (err, newOrders) {
          //  if (err) throw err;
          //  res.json(utils.jsonResult(newOrders));
          //});
          res.json(utils.jsonResult(orders));
        }).then(null, function (err) {
          utils.handleError(err, 'getHistoryOrders()', debug, res);
        });
    });
  };

  var getAllOrders = function (req, res) {
    var role = req.query.role; // operator
    _getCommonQueryOfOrder(req, function (err, query) {
      if (err) return utils.handleError(err, 'getAllOrders()', debug, res);
      query.exec().then(function (orders) {
        debug('getAllOrders(), found %d orders.', orders.length);
        //_appendOrderUsers(role, orders, function (err, newOrders) {
        //  if (err) throw err;
        //  res.json(utils.jsonResult(newOrders));
        //});
        res.json(utils.jsonResult(orders));
      }).then(null, function (err) {
        utils.handleError(err, 'getAllOrders()', debug, res);
      });
    });
  };

  /**
   * Append doctor/patient information (name) to each order in list.
   * @param role
   * @param orders
   * @param callback
   * @private
   */
  var _appendOrderUsers = function (role, orders, callback) {
    if (role == app.consts.role.doctor) {
      var patientIds = [];
      // get unique patient ids from orders
      for (var i = 0; i < orders.length; i++) {
        if (patientIds.indexOf(orders[i].patientId) == -1) {
          patientIds.push(orders[i].patientId);
        }
      }
      debug('_appendOrderUsers(), find patients in %o', patientIds);
      Patient.find({_id: {'$in': patientIds}}, 'name', function (err, patients) {
        var p = {};
        for (var i = 0; i < patients.length; i++) {
          p[patients[i].id] = patients[i].name;
        }
        var retOrders = [];
        for (var j = 0; j < orders.length; j++) {
          var newOrder = orders[j].toObject();
          newOrder.patientName = p[newOrder.patientId];
          retOrders.push(newOrder);
        }

        callback(err, retOrders);
      });
    } else {
      var doctorIds = [];
      // get unique doctor ids from orders
      for (var i = 0; i < orders.length; i++) {
        for (var j = 0; j < orders[i].doctorId.length; j++) {
          if (doctorIds.indexOf(orders[i].doctorId[j]) == -1) {
            doctorIds.push(orders[i].doctorId[j]);
          }
        }
      }
      debug('_appendOrderUsers(), find doctors in %o', doctorIds);
      Doctor.find({_id: {'$in': doctorIds}}, 'name', function (err, doctors) {
        var d = {};
        for (var i = 0; i < doctors.length; i++) {
          d[doctors[i].id] = doctors[i].name;
        }
        var retOrders = [];
        for (var j = 0; j < orders.length; j++) {
          var newOrder = orders[j].toObject();
          // TODO: may have more than one doctor.
          newOrder.doctorName = p[newOrder.doctorId];
          retOrders.push(newOrder);
        }
        callback(err, retOrders);
      });
    }
  };

  var _getCommonQueryOfOrder = function (req, callback) {
    var role = req.query.role; // operator
    var openid = req.query.openid; // operator
    debug('_getCommonOrderQuery(), find user by openid: %s, role: %s', openid, role);
    var currentUserId;
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (!user) {
          throw new Error('user not found');
        }
        currentUserId = user.id;
        debug('_getCommonOrderQuery(), find service orders of user: %s', currentUserId);
        var query;
        if (role == app.consts.role.doctor) {
          query = ServiceOrder.find({'doctors.id': currentUserId}).sort({lastModified: -1});
        } else {
          query = ServiceOrder.find({'patient.id': currentUserId}).sort({lastModified: -1});
        }
        callback(null, query);
      }).then(null, function (err) {
        callback(err);
      });
  };

  /**
   * GET '/api/orders/:id'
   * @param req
   * @param res
   */
  var getOrderDetail = function (req, res) {
    var orderId = req.params.id;
    var role = req.query.role; // operator
    var openid = req.query.openid; // operator
    debug('getOrderDetail(), find user by openid: %s, role: %s', openid, role);
    var currentUserId;
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (!user) {
          throw new Error('user not found');
        }
        currentUserId = user.id;
        debug('getOrderDetail(), find service order: %s', orderId);
        return ServiceOrder.findById(orderId).exec();
      }).then(function (order) {
        if (!order) {
          throw new Error('order not found');
        }

        if (_getOrderDoctorIds(order).indexOf(currentUserId) == -1 && currentUserId != order.patient.id) {
          throw new Error('no privilege');
        }
        res.json(utils.jsonResult(order));
      }).then(null, function (err) {
        utils.handleError(err, 'getOrderDetail()', debug, res);
      });
  };

  /**
   * POST '/api/orders/:id/comments'
   * @param req
   * @param res
   */
  var createOrderComment = function (req, res) {
    var orderId = req.params.id;
    var newComment = req.body;
    var role = req.query.role; // operator
    var openid = req.query.openid; // operator

    getUserByOpenid(openid, role, res, function (user) {
      var currentUserId = user.id;
      debug('createOrderComment(), find order: %s', orderId);
      ServiceOrder.findById(orderId).exec()
        .then(function (order) {
          if (!order) {
            throw new Error('order not found');
          }
          if (_getOrderDoctorIds(order).indexOf(currentUserId) == -1 && currentUserId != order.patient.id) {
            throw new Error('no privilege');
          }
          createComment(order, user);
        }).then(null, function (err) {
          utils.handleError(err, 'createOrderComment()', debug, res);
        });
    });

    var createComment = function (order, opUser) {
      newComment.creator = {id: opUser.id, name: opUser.name, avatar: opUser.wechat.headimgurl, role: role};
      order.comments.push(newComment);
      order.save(function (err) {
        if (err) return utils.handleError(err, 'createOrderComment()', debug, res);
        res.json(utils.jsonResult(order));
      });
    }
  };


  /**
   * DELETE '/api/orders/:id/comments/:commentId'
   * @param req
   * @param res
   */
  var deleteOrderComment = function (req, res) {
    var orderId = req.params.id;
    var commentId = req.params.commentId;
    var role = req.query.role; // operator
    var openid = req.query.openid; // operator
    getUserByOpenid(openid, role, res, function (user) {
      var currentUserId = user.id;
      debug('deleteOrderComment(), find order: %s', orderId);
      ServiceOrder.findById(orderId).exec()
        .then(function (order) {
          if (!order) {
            throw new Error('order not found');
          }
          deleteComment(order, user);
        }).then(null, function (err) {
          utils.handleError(err, 'deleteOrderComment()', debug, res);
        });
    });

    var deleteComment = function (order, opUser) {
      var comment = order.comments.id(commentId);
      if (comment.creator.id != opUser.id) {
        debug('deleteOrderComment(), cannot delete comment created by others. comment creator: %s, opUser: %s', comment.creator.id, opUser.id);
        return res.status(403).json(utils.jsonResult(new Error('no privilege')));
      }
      comment.remove();
      order.save(function (err) {
        if (err) return utils.handleError(err, 'createOrderComment()', debug, res);
        debug('deleteOrderComment(), deleted order comment: %s', commentId);
        res.json(utils.jsonResult(order));
      });
    };
  };

  var getUserByOpenid = function (openid, role, res, callback) {
    utils.getUserByOpenid(openid, role, function (err, user) {
      if (err) return utils.handleError(err, 'orderCtrl.getUserByOpenid()', debug, res);
      if (!user) {
        var error = new Error('user not found');
        return utils.handleError(error, 'orderCtrl.getUserByOpenid()', debug, res, 404);
      }
      callback(user);
    })
  };

  var _getOrderDoctorIds = function (order) {
    var retIds = [];
    for (var i = 0; i < order.doctors.length; i++) {
      retIds.push(order.doctors[i].id);
    }
    return retIds;
  };

  return {
    createOrder: createOrder,
    updateOrder: updateOrder,
    updateOrderStatus: updateOrderStatus,
    getOrders: getOrders,
    getHistoryOrders: getHistoryOrders,
    getAllOrders: getAllOrders,
    getOrderDetail: getOrderDetail,
    createComment: createOrderComment,
    deleteComment: deleteOrderComment
  }
};
