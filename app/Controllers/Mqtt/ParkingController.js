'use strict'

const Parking = use('App/Models/Parking')
const Setting = use('App/Models/Setting')
const Property = use('App/Models/Property')
const Car = use('App/Models/Car')
const UserCar = use('App/Models/UserCar')

const Validations = use('App/Libs/Validations')
const _ = require('lodash')

class ParkingController {
  static async register(params, user) {
    const rules = {
      car_id: 'required',
      parking_id: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let userProperty = await Property.query().where('user_id', user.id).first()
    if(!userProperty) {
      return [{
        status: 0,
        messages: [{
          code: "UserNotFound",
          message: "کاربر مورد نظر پیدا نشد",
        }],
        data: {}
      }]
    }

    let parking = await Parking.query().where('id', params.parking_id).first()
    if(!parking) {
      return [{
        status: 0,
        messages: [{
          code: "ParkingNotFound",
          message: "پارکینگ مورد نظر پیدا نشد",
        }],
        data: {}
      }]
    }

    let car = await Car.query().where('id', params.car_id).first()
    if(!car) {
      return [{
        status: 0,
        messages: [{
          code: "CarNotFound",
          message: "خودرو مورد نظر پیدا نشد",
        }],
        data: {}
      }]
    }

    let userCar = await UserCar.query().where('user_id', user.id).where('vehicle_id', car.id).first()
    if(!userCar) {
      return [{
        status: 0,
        messages: [{
          code: "CarNotYours",
          message: "خودرو مورد نظر متعلق به شما نیست",
        }],
        data: {}
      }]
    }

    if(userProperty.bronze_coin<parking.reserve_bronze_coin) {
      return [{
        status: 0,
        messages: [{
          code: "BronzeCoinNotEnough",
          message: "سکه برنز شما برای رزرو کافی نمی باشد",
        }],
        data: {}
      }]
    }

    // Fake Output
    if(true) {
      return [{
        status: 0,
        messages: [{
          code: "ParkingFull",
          message: "ظرفیت پارکینگ پر شده است",
        }],
        data: {}
      }]
    }

    return [{
      status: 1,
      messages: [],
      data: {
      }
    }]
  }

  static async around(params, user) {
    const rules = {
      lon_gps: 'required',
      lat_gps: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    try{
      let settings = await Setting.get()
      let results = await Parking.getParkingsAround(params.lon_gps, params.lat_gps, settings.parking_lookup_distance)

      return [{
        status: 1,
        messages: [],
        data: {
          founds: results,
        }
      }]
    }catch(e){
      return [{
        status: 0,
        messages: [{
          code: 'SpatialError',
          message: e.message
        }],
        data: {}
      }]
    }
  }
}

module.exports = ParkingController
