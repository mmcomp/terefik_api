'use strict'

const Parking = use('App/Models/Parking')
const ParkingRegister = use('App/Models/ParkingRegister')
const Setting = use('App/Models/Setting')
const Property = use('App/Models/Property')
const Car = use('App/Models/Car')
const UserCar = use('App/Models/UserCar')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()
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
      // return [{
      //   status: 0,
      //   messages: [{
      //     code: "ParkingFull",
      //     message: "ظرفیت پارکینگ پر شده است",
      //   }],
      //   data: {}
      // }]
      let regTime = Time().format("YYYY-MM-DD HH:mm:ss")
      let parkingRegister = await ParkingRegister.query().with('car').with('parking').where('vehicle_id', params.car_id).where('parkings_id', params.parking_id).where('expired_at', '>', Time().format('YYYY-MM-DD HH:mm:ss')).first()
      if(!parkingRegister) {
        return [{
          status: 0,
          messages: [{
            code: "HaveRegistration",
            message: "شما در پارکینگ دیگری رزرو دارید",
          }],
          data: {
            parkingRegister
          }
        }]
      }

      parkingRegister = new ParkingRegister
      parkingRegister.vehicle_id = params.car_id
      parkingRegister.parkings_id = params.parking_id
      parkingRegister.expired_at = Time(regTime).add(parking.minimum_reserve_minutes, 'minutes').format('YYYY-MM-DD HH:mm:ss')
      await parkingRegister.save()
      parkingRegister.loadMany(['car', 'parking'])

      return [{
        status: 1,
        messages: [],
        data: {
          parkingRegister
        }
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
          search_radius: settings.parking_lookup_distance,
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
