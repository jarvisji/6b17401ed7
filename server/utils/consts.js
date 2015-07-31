/**
 * Created by Ting on 2015/7/29.
 */
module.exports = {
  caseLinkTypes: ['image', 'doctor', 'patient', 'shop', 'medicalImaging', 'serviceJiahao', 'serviceSuizhen', 'serviceHuizhen'],
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
  }
};
