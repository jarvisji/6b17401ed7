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
  var DPRelation = app.models.DoctorPatientRelation;
  var ShopItem = app.models.ShopItem;
  var Order = app.models.Order;

  var orderStatus = app.consts.orderStatus;
  var serviceTypes = app.consts.doctorServices;
  var orderTypes = app.consts.orderTypes;
  var finalStatus = [orderStatus.rejected, orderStatus.finished, orderStatus.expired, orderStatus.cancelled];
  /**
   * POST '/api/orders'
   * Create service order. Check service stock before create, update service stock after created.
   * @param req
   * @param res
   */
  var createOrder = function (req, res) {
    var newOrder = req.body;
    if (newOrder.serviceType) {
      createServiceOrder(newOrder, res);
    } else {
      createNonServiceOrder(newOrder, res);
    }
  };

  var createNonServiceOrder = function (newOrder, res) {
    debug('createNonServiceOrder(), receive new order data: %o', newOrder);
    if (!newOrder || !newOrder.buyer || !newOrder.buyer.id || newOrder.orderPrice == undefined || newOrder.quantity == undefined || !newOrder.orderType) {
      debug('createNonServiceOrder(), invalid data. buyer: %s, orderPrice: %s, quantity: %s, orderType: %s.', !newOrder.buyer || !newOrder.buyer.id, newOrder.orderPrice == undefined, newOrder.quantity == undefined, !newOrder.orderType);
      return res.status(400).json(utils.jsonResult(new Error('invalid data')));
    }

    var validServiceTypes = Object.keys(orderTypes);
    if (validServiceTypes.indexOf(newOrder.orderType) == -1) {
      debug('createNonServiceOrder(), invalid order type.');
      return res.status(400).json(utils.jsonResult(new Error('invalid data')));
    }

    Order.create(newOrder, function (err, created) {
      if (err) return utils.handleError(err, 'createNonServiceOrder()', debug, res);
      res.json(utils.jsonResult(created));
    });
  };

  var createServiceOrder = function (newOrder, res) {
    debug('createServiceOrder(), receive new order data: %o', newOrder);
    if (!newOrder || !newOrder.serviceId || !newOrder.doctorId || !newOrder.patientId || newOrder.price == undefined || newOrder.quantity == undefined || !newOrder.serviceType) {
      debug('createServiceOrder(), invalid data. serviceId: %s, serviceType: %s, doctorId: %s, patientId: %s, price: %s, quantity: %s.', !newOrder.serviceId, !newOrder.serviceType, !newOrder.doctorId, !newOrder.patientId, newOrder.price == undefined, newOrder.quantity == undefined);
      return res.status(400).json(utils.jsonResult(new Error('invalid data')));
    }

    var validServiceTypes = Object.keys(serviceTypes);
    if (validServiceTypes.indexOf(newOrder.serviceType) == -1) {
      debug('createServiceOrder(), invalid service type.');
      return res.status(400).json(utils.jsonResult(new Error('invalid data')));
    }

    if (newOrder.serviceType == app.consts.doctorServices.jiahao.type && !newOrder.bookingTime) {
      debug('createServiceOrder(), missed bookingTime for jiahao service.');
      return res.status(400).json(utils.jsonResult(new Error('invalid data')));
    }


    // fill doctor/patient information to order.
    if (typeof(newOrder.doctorId) === 'string') {
      newOrder.doctorId = [newOrder.doctorId];
    }
    // set bookingTime of 'suizhen'
    if (newOrder.serviceType == app.consts.doctorServices.suizhen.type && !newOrder.bookingTime) {
      newOrder.bookingTime = new Date();
    }


    debug('createServiceOrder(), fill doctor information for ids: %o', newOrder.doctorId);
    Doctor.find({_id: {'$in': newOrder.doctorId}}).exec()
      .then(function (doctors) {
        if (doctors.length != newOrder.doctorId.length) {
          throw new Error('doctor not found');
        }
        /**
         * There are some conditions or price:
         * 1. For jiahao order, orderPrice = servicePrice;
         * 2. For suizhen order, orderPrice = servicePrice * 1.1 * quantity;
         * 3. For huizhen order, orderPrice = sum(servicePrice of doctors) * 1.1;
         * 4. For extracted order, orderPrice = extracted amount, servicePrice = undefined.
         */
        var orderDoctors = [];
        var orderPrice = 0;
        for (var i = 0; i < doctors.length; i++) {
          var tmpDoctor = doctors[i];
          var servicePrice;
          for (var j = 0; j < tmpDoctor.services.length; j++) {
            if (tmpDoctor.services[j].type == newOrder.serviceType) {
              servicePrice = tmpDoctor.services[j].price;
              orderPrice += tmpDoctor.services[j].billingPrice;
              break;
            }
          }
          orderDoctors.push({
            id: tmpDoctor.id,
            name: tmpDoctor.name,
            avatar: tmpDoctor.avatar,
            title: tmpDoctor.title,
            department: tmpDoctor.department,
            hospital: tmpDoctor.hospital,
            servicePrice: servicePrice
          });
        }
        newOrder.doctors = orderDoctors;
        // if orderPrice still 0, means the order is not one of 'jiahao', 'huizhen' and 'suizhen',
        // it should be 'extracted', use price in data to create order.
        newOrder.orderPrice = orderPrice ? (orderPrice * newOrder.quantity).toFixed(2) : newOrder.price;
        debug('createServiceOrder(), calculated orderPrice is %d', newOrder.orderPrice);
        return Patient.findById(newOrder.patientId).exec();
      }).then(function (patient) {
        if (!patient) {
          throw new Error('patient not found');
        }
        newOrder.patient = {id: patient.id, name: patient.name, avatar: patient.avatar};

        if (newOrder.serviceType == app.consts.doctorServices.jiahao.type) {
          createJiahao();
        } else {
          ServiceOrder.create(newOrder, function (err, createdOrder) {
            if (err) return utils.handleError(err, 'createServiceOrder()', debug, res);
            res.json(utils.jsonResult(createdOrder));
          });
        }
      }).then(null, function (err) {
        utils.handleError(err, 'createServiceOrder()', debug, res);
      });


    var createJiahao = function () {
      var date = newOrder.bookingTime;
      debug('createServiceOrder(), createJiahao(), checking service stock, serviceId: %s, date: %s', newOrder.serviceId, date);
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
          if (err) return utils.handleError(err, 'createServiceOrder()', debug, res);
        });
    };


    //// get doctor, check what type of service is going to create.
    //Doctor.findById(newOrder.doctorId, function (err, doctor) {
    //  if (err) return utils.handleError(err, 'createServiceOrder()', debug, res);
    //
    //  if (!doctor) return utils.handleError(new Error('doctor not found'), 'createServiceOrder()', debug, res, 404);
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
        if (_getOrderDoctorIds(order).indexOf(currentUserId) == -1 && order.patient.id != currentUserId) {
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
   * 1. 'paid' status cannot be set through this API, there is another payment callback method.
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
    // TODO: uncomment following validStatus when development finished.
    //var validStatus = [orderStatus.confirmed, orderStatus.rejected, orderStatus.doctorFinished, orderStatus.finished, orderStatus.cancel()];
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

          /* --------------- deal with new status ------------------------------------ */
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

          /* --------------- deal with service type ------------------------------------ */
          if (order.serviceType == serviceTypes.jiahao.type) {
            if (newStatus == orderStatus.paid) {
              order.status = orderStatus.confirmed;
            }
          } else if (order.serviceType == serviceTypes.huizhen.type) {
            // for 'huizhen' orders, one doctor 'confirmed' will not update order status.
            debug('updateOrderStatus(), update status of "huizhen" order.');
            if (newStatus == orderStatus.confirmed) {
              // Only when all doctors 'confirmed', order status become 'confirmed'.
              var checkAllDoctorsConfirmed = true;
              for (var i = 0; i < order.doctors.length; i++) {
                console.log('idx:', i);
                var tmpDoctor = order.doctors[i];
                if (tmpDoctor.id == currentUserId) {
                  debug('updateOrderStatus(), doctor confirmed. doctorId: %s', currentUserId);
                  tmpDoctor.isConfirmed = true;
                }
                console.log(tmpDoctor.id, tmpDoctor.isConfirmed);
                checkAllDoctorsConfirmed = checkAllDoctorsConfirmed && tmpDoctor.isConfirmed;
              }
              if (checkAllDoctorsConfirmed) {
                debug('updateOrderStatus(), all doctor confirmed, update order status.');
                order.status = newStatus;
              }
            } else if (newStatus == orderStatus.rejected) {
              // one doctor 'rejected', the order status will be rejected.
              for (var idx in order.doctors) {
                if (order.doctors[idx].id == currentUserId) {
                  debug('updateOrderStatus(), doctor rejected, the order was rejected too. doctorId: %s', currentUserId);
                  order.doctors[idx].isConfirmed = false;
                  order.status = newStatus;
                  break;
                }
              }
            } else {
              order.status = newStatus;
            }
          } else {
            order.status = newStatus;
          }

          // calculate order income for doctor.
          if (newStatus == orderStatus.confirmed) {
            calculateDoctorIncome(order);
          }

          order.save(function (err) {
            if (err) return utils.handleError(err, 'updateOrderStatus()', debug, res);
            res.json(utils.jsonResult(order));

            // after order status changed.
            if (newStatus == orderStatus.cancelled) {
              restoreServiceStock(order.serviceId);
            } else if (newStatus == orderStatus.paid) {
              //TODO: this should be invoke when wechat server callback.
              handleRelations4PaymentSuccess(order);
            } else if (newStatus == orderStatus.finished) {

            } else if (newStatus == orderStatus.confirmed && order.serviceType == serviceTypes.suizhen.type) {
              handleRelations4SuizhenConfirmed(order);
              //TODO:
              // 1. send wechat message to doctor and patient.

            }
          });
        }
      ).
        then(null, function (err) {
          utils.handleError(err, 'updateOrderStatus()', debug, res);
        });
    });

    /**
     * 订单确认时计算收益。
     * （因为在要显示交易中的金额给医生，所以所有订单类型的收益都立即计算。但是随诊收益立即可得，其它订单收益完成时可得， 这个逻辑在summary中计算）
     * @param order
     */
    var calculateDoctorIncome = function (order) {
      var totalServicePrice = 0;
      var refereeId;
      if (order.referee && order.referee.id) {
        refereeId = order.referee.id;
      }
      for (var i = 0; i < order.doctors.length; i++) {
        var doctor = order.doctors[i];
        var servicePrice = doctor.servicePrice;
        if (refereeId) {
          // 有推荐人
          if (refereeId != doctor.id) {
            // 推荐人不是医生自己，医生得80%，累加订单服务金额，最后推荐人得20%，
            totalServicePrice += servicePrice;
            doctor.income = (servicePrice * 0.8).toFixed(2);
          } else {
            // 推荐人是医生自己，不计算推荐所得，医生得100%。
            doctor.income = servicePrice.toFixed(2);
          }
        } else {
          // 无推荐人，每个医生得100%
          doctor.income = servicePrice.toFixed(2);
        }
      }
      if (refereeId) {
        order.referee.income = (totalServicePrice * 0.2).toFixed(2);
      }
    };

    var restoreServiceStock = function (serviceId) {
      // increase stock
      var date = dateUtils.getTodayStartDate();
      debug('updateOrderStatus(), updateServiceStock(), new status is %s, increase stock for %s', newStatus, date.toISOString());
      ServiceStock.update({
        serviceId: serviceId,
        date: date
      }, {'$inc': {stock: 1}}, function (err, result) {
        if (err) debug('updateServiceStock(), error: %o', err);
      });
    };

    /**
     * 随诊订单以医生确认为节点，转为关系状态为随诊。
     * @param order
     */
    var handleRelations4SuizhenConfirmed = function (order) {
      debug('handleSuizhenConfirmed(), update patient and doctor relations for order: %o', order);
      var orderDoctorIds = _getOrderDoctorIds(order);
      DPRelation.find({'doctor.id': {'$in': orderDoctorIds}, 'patient.id': order.patient.id}).exec()
        .then(function (relations) {
          // Suizhen confirmed should always after order was paid, so if cannot get relation data, will trade it as error instead of create new one.
          if (relations.length == 0) {
            debug('handleSuizhenConfirmed(), error, relation not exist.');
            throw new Error('relation not found');
          }
          for (var i = 0; i < relations.length; i++) {
            var relation = relations[i];
            debug('handleSuizhenConfirmed(), updating relation: %s status to 3', relation.id);
            relation.status = app.consts.relationStatus.suizhen.value;
            relation.save(function (err) {
              if (err) throw err;
            });
          }
        }).then(null, function (err) {
          if (err) return utils.handleError(err, 'handleSuizhenConfirmed()', debug);
        })
    };

    /**
     * When patient payment success, we should:
     * 1. update patient and doctor relationship.
     *    所有订单以支付成功为节点：
     *    ○ 如果没有关系存在，创建新的关系，状态为既往。
     *    ○ 如果已有普通关系，转换关系状态为既往。
     *    ○ 如果已有既往关系，保持关系状态不变。
     *    ○ 如果已有随诊关系，保持关系状态不变。
     * 2. send wechat message to doctor and patient.
     * @param order
     */
    var handleRelations4PaymentSuccess = function (order, callback) {
      var error = null;
      debug('handlePaymentSuccess(), update patient and doctor relations for order: %o', order);
      var orderDoctorIds = _getOrderDoctorIds(order);
      DPRelation.find({'doctor.id': {'$in': orderDoctorIds}, 'patient.id': order.patient.id}).exec()
        .then(function (relations) {
          // find out the doctors has no relations to the patient.
          var doctorsOfNewRelations = [];
          var doctorIdsOfNewRelations = [];
          if (relations.length != orderDoctorIds.length) {
            for (var i = 0; i < orderDoctorIds.length; i++) {
              var exist = false;
              for (var j = 0; j < relations.length; j++) {
                if (relations[j].doctor.id == orderDoctorIds[i]) {
                  exist = true;
                  break;
                }
              }
              if (!exist) {
                doctorIdsOfNewRelations.push(orderDoctorIds[i]);
                doctorsOfNewRelations.push(order.doctors[i]);
              }
            }
          }

          if (doctorsOfNewRelations.length > 0) {
            debug('handlePaymentSuccess(), some doctors has no relations exist, create new: %o', doctorIdsOfNewRelations);
            var newDpr = [];
            for (var i = 0; i < doctorsOfNewRelations.length; i++) {
              newDpr.push({
                doctor: doctorsOfNewRelations[i].toObject(),
                patient: order.patient.toObject(),
                status: app.consts.relationStatus.jiwang.value
              });
            }
            DPRelation.create(newDpr, function (err, created) {
              if (err) {
                debug('handlePaymentSuccess(), crate relation error: %o', err);
                if (callback) callback(err);
              } else {
                debug('handlePaymentSuccess(), create relation success: %s', created);
                if (callback) callback(null);
              }
            });
          }

          for (var i = 0; i < relations.length; i++) {
            var relation = relations[i];
            debug('handlePaymentSuccess(), updating relation: %s status to 2', relation.id);
            if (relation.status == app.consts.relationStatus.putong.value) {
              relation.status = app.consts.relationStatus.jiwang.value;
              relation.save(function (err) {
                if (err) {
                  debug('handlePaymentSuccess(), update relation status error: %o', err);
                  if (callback) callback(err);
                } else {
                  debug('handlePaymentSuccess(), update relation status success');
                  if (callback) callback(null);
                }
              });
            }
          }
        }).then(null, function (err) {
          debug('handlePaymentSuccess(), error: %o', err);
          if (callback) callback(err);
        });
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

      query.nin('status', finalStatus);
      if (role == app.consts.role.doctor) {
        // don't display not paid orders for doctor.
        query.nin('status', finalStatus.concat(orderStatus.init)).exec();
      }
      query.exec().then(function (orders) {
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

  /**
   * GET '/api/orders/shop'
   * @param req
   * @param res
   */
  var getShopOrders = function (req, res) {
    var role = req.query.role; // operator
    var openid = req.query.openid; // operator
    debug('getShopOrders(), find user by openid: %s, role: %s', openid, role);
    var currentUserId;
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (!user) {
          throw new Error('user not found');
        }
        currentUserId = user.id;
        debug('getShopOrders(), finding orders of user: %s', currentUserId);
        return Order.find({'buyer.id': currentUserId, orderType: orderTypes.shop.type}).sort({created: -1}).exec();
      }).then(function (orders) {
        debug('getShopOrders(), found %d orders.', orders.length);
        res.json(utils.jsonResult(orders));
      }).then(null, function (err) {
        utils.handleError(err, 'getShopOrders()', debug, res);
      });
  };

  /**
   * GET '/api/orders/withdraw'
   * Get withdraws of current user, need verify openid and token.
   * @param req
   * @param res
   */
  var getWithdrawOrders = function (req, res) {
    var role = req.query.role; // operator
    var openid = req.query.openid; // operator
    debug('getWithdrawOrders(), find user by openid: %s, role: %s', openid, role);
    var currentUserId;
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (!user) {
          throw new Error('user not found');
        }
        currentUserId = user.id;
        debug('getWithdrawOrders(), finding orders of user: %s', currentUserId);
        return Order.find({'buyer.id': currentUserId, orderType: orderTypes.withdraw.type}).sort({created: -1}).exec();
      }).then(function (orders) {
        debug('getWithdrawOrders(), found %d orders.', orders.length);
        res.json(utils.jsonResult(orders));
      }).then(null, function (err) {
        utils.handleError(err, 'getWithdrawOrders()', debug, res);
      });
  };

  /**
   * GET '/api/orders/non-service/:id'
   * @param req
   * @param res
   */
  var getNonServiceOrderDetail = function (req, res) {
    var orderId = req.params.id;
    var role = req.query.role; // operator
    var openid = req.query.openid; // operator
    debug('getNonServiceOrderDetail(), find user by openid: %s, role: %s', openid, role);
    var currentUserId;
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (!user) {
          throw new Error('user not found');
        }
        currentUserId = user.id;
        debug('getNonServiceOrderDetail(), find non service order: %s', orderId);
        return Order.findById(orderId).exec();
      }).then(function (order) {
        if (!order) {
          throw new Error('order not found');
        }

        if (currentUserId != order.buyer.id) {
          throw new Error('no privilege');
        }
        res.json(utils.jsonResult(order));
      }).then(null, function (err) {
        utils.handleError(err, 'getNonServiceOrderDetail()', debug, res);
      });
  };

  /**
   * DELETE '/api/orders/shop/:id'
   * @param req
   * @param res
   */
  var deleteShopOrder = function (req, res) {
    var orderId = req.params.id;
    var role = req.query.role; // operator
    var openid = req.query.openid; // operator
    debug('deleteShopOrder(), find user by openid: %s, role: %s', openid, role);
    var currentUserId;
    utils.getUserByOpenid(openid, role)
      .then(function (user) {
        if (!user) {
          throw new Error('user not found');
        }
        currentUserId = user.id;
        debug('deleteShopOrder(), find non service order: %s', orderId);
        return Order.findById(orderId).exec();
      }).then(function (order) {
        if (!order) {
          throw new Error('order not found');
        }

        if (currentUserId != order.buyer.id) {
          throw new Error('no privilege');
        }
        return order.remove();
      }).then(function (ret) {
        res.json(utils.jsonResult('success'));
      }).then(null, function (err) {
        utils.handleError(err, 'deleteShopOrder()', debug, res);
      });
  };

  //var getHistoryOrders = function (req, res) {
  //  var role = req.query.role; // operator
  //  _getCommonQueryOfOrder(req, function (err, query) {
  //    if (err) return utils.handleError(err, 'getHistoryOrders()', debug, res);
  //    query.in('status', finalStatus).exec()
  //      .then(function (orders) {
  //        debug('getHistoryOrders(), found %d orders.', orders.length);
  //        //_appendOrderUsers(role, orders, function (err, newOrders) {
  //        //  if (err) throw err;
  //        //  res.json(utils.jsonResult(newOrders));
  //        //});
  //        res.json(utils.jsonResult(orders));
  //      }).then(null, function (err) {
  //        utils.handleError(err, 'getHistoryOrders()', debug, res);
  //      });
  //  });
  //};

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
      newComment.creator = {id: opUser.id, name: opUser.name, avatar: opUser.avatar, role: role};
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
    //getHistoryOrders: getHistoryOrders,
    getAllOrders: getAllOrders,
    getOrderDetail: getOrderDetail,
    createComment: createOrderComment,
    deleteComment: deleteOrderComment,
    getShopOrders: getShopOrders,
    getWithdrawOrders: getWithdrawOrders,
    //getNonServiceOrderDetail: getNonServiceOrderDetail,
    deleteShopOrder: deleteShopOrder
  }
};
