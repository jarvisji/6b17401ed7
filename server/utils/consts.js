/**
 * Created by Ting on 2015/7/29.
 */
module.exports = {
  caseLinkTypes: {
    image: 'image',
    doctor: 'doctor',
    patient: 'patient',
    shop: 'shop',
    medicalImaging: 'medicalImaging',
    serviceJiahao: 'serviceJiahao',
    serviceSuizhen: 'serviceSuizhen',
    serviceHuizhen: 'serviceHuizhen'
  },
  role: {
    doctor: 'doctor',
    patient: 'patient'
  },
  friendStatus: {
    requested: 'requested',
    accepted: 'accepted',
    rejected: 'rejected'
  },
  doctorServices: {
    jiahao: {type: 'jiahao'},
    huizhen: {type: 'huizhen'},
    suizhen: {type: 'suizhen'}
  },
  orderTypes: {
    shop: {type: 'shop'},
    withdraw: {type: 'withdraw'}
  },
  orderStatus: {
    init: 'init',
    paid: 'paid',
    confirmed: 'confirmed', // doctor confirmed
    rejected: 'rejected',   //doctor rejected
    doctorFinished: 'doctorFinished',
    finished: 'finished',   // patient accept 'doctorFinished' status.
    expired: 'expired',
    cancelled: 'cancelled',  // only can be cancel before 'confirmed'.
    extracted: 'extracted'  // user extracted from account balance.
  },
  // for doctor and patient relation.
  relationStatus: {
    putong: {value: 1},
    jiwang: {value: 2},
    suizhen: {value: 3}
  },
  messageStatus: {
    unread: 'unread',
    read: 'read'
  }
};
