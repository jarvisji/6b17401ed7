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
  serviceOrderStatus: {
    init: 'init',
    payed: 'payed',
    confirmed: 'confirmed',
    finished: 'finished',
    expired: 'expired'
  },
  doctorServices: {
    jiahao: {type: 'jiahao'},
    huizhen: {type: 'huizhen'},
    suizhen: {type: 'suizhen'}
  }
};
