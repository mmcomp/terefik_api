'use strict'

const Car = use('App/Models/Car')
const User = use('App/Models/User')
const UserCar = use('App/Models/UserCar')
const RangerWork = use('App/Models/RangerWork')
const Setting = use('App/Models/Setting')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const Validations = use('App/Libs/Validations')
const _ = require('lodash')

class CarController {
  static async add(params, user) {
    const rules = {
      color_id: 'required',
      model_id: 'required',
      number_2: 'required',
      number_ch: 'required',
      number_3: 'required',
      number_ir: 'required',
      number_extra: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let car = new Car
    for(let i in params) {
      car[i] = params[i]
    }
    await car.save()

    let userCar = new UserCar
    userCar.user_id = user.id
    userCar.vehicle_id = car.id
    await userCar.save()

    return [{
      status: 1,
      messages: [],
      data: {}
    }]
  }

  static async list(params, user) {
    await user.loadMany(['cars'])
    let userData = user.toJSON()
    let cars = userData.cars

    // console.log(user.toJSON())

    return [{
      status: 1,
      messages: [],
      data: {
        cars: cars
      }
    }]
  }

  static async arrest(params, user) {
    const rules = {
      number_2: 'required',
      number_ch: 'required',
      number_3: 'required',
      number_ir: 'required',
      number_extra: 'required',
      lon_gps: 'required',
      lat_gps: 'required',
      image_path: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    if(user.is_parking_ranger!=4) {
      return [{
        status: 0,
        messages: [{
          code: 'NotRanger',
          message: 'شما پارکیار نمی باشید'
        }],
        data: {}
      }]
    }

    let carOwner = {}
    let carStatus = 'NotRegistered'

    let car = await Car.query().where('number_2', params.number_2).where('number_ch', params.number_ch).where('number_3', params.number_3).where('number_ir', params.number_ir).where('number_extra', params.number_extra).first()

    if(!car) {
      let car= new Car
      car.number_2 = params.number_2
      car.number_ch = params.number_ch
      car.number_3 = params.number_3
      car.number_ir = params.number_ir
      car.number_extra = params.number_extra
      await car.save()

      return this._arrest(params, user)
    }

    carStatus = 'RegisteredByRanger'
    let userCar = await UserCar.query().where('vehicle_id', car.id).with('user').first()
    if(!userCar) {
      return this._arrest(params, user)
    }

    carStatus = 'NotShielded'

    carOwner = userCar.toJSON().user
    let shieldFinish = Time(userCar.shield_start).add(userCar.shield_duration, 'minutes')
    
    let shieldDiff = shieldFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')

    let theOwner = await User.find(carOwner.id)

    if(shieldDiff>0) {
      carStatus = 'Shielded'

      theOwner.is_sheild = 1
      await theOwner.save()

      let settings = await Setting.get()
      let checkFinish = Time(userCar.check_time).add(settings.check_timeout, 'minutes')

      let checkDiff = checkFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')
      let theStat = 0

      if(checkDiff<0) {
        // Reward Ranger
        theStat = 1

        userCar.check_time = Moment.now('YYYY-MM-DD HH:mm:ss')
        await userCar.save()
      }


      return [{
        status: theStat,
        messages: [],
        data: {
          car_status: carStatus
        }
      }]
    }

    userCar.check_time = Moment.now('YYYY-MM-DD HH:mm:ss')
    await userCar.save()

    theOwner.is_sheild = 0
    await theOwner.save()

    return this._arrest(params, user)
  }

  static async _arrest(params, user) {

    let rangerWork = await RangerWork.query().where('vehicle_id', params.car_id).orderBy('created_at', 'DESC').first()
    if(rangerWork) {
      let settings = await Setting.get()
      let lastArrestTime = Time(rangerWork.created_at)
      if(settings.arrest_timeout >= Time().diff(lastArrestTime, 'minutes')) {
        return [{
          status: 0,
          messages: [{
            code: "AlreadyArrested",
            message: "خودرو به تازگی ثبت شده است"
          }],
          data: {}
        }]
      }
    }

    rangerWork = new RangerWork
    rangerWork.ranger_id = user.id
    rangerWork.vehicle_id = params.car_id
    rangerWork.lon_gps = params.lon_gps
    rangerWork.lat_gps = params.lat_gps
    rangerWork.image_path = params.image_path

    let driver, userCar = await UserCar.query().where('vehicle_id', params.car_id).with('user').first()
    if(userCar) {
      driver = userCar.toJSON().user
      let shieldFinish = Time(userCar.shield_start).add(userCar.shield_duration, 'minutes')
  
      let shieldDiff = shieldFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')

      let theOwner = await User.find(driver.id)

      if(shieldDiff<=0) {
        rangerWork.user_vehicle_id = userCar.id
        await rangerWork.save()

        
        theOwner.is_sheild = 0
        await theOwner.save()

        return [{
          status: 1,
          messages: [],
          data: {
            car_status: 'NotShielded'
          }
        }]
      }
      theOwner.is_sheild = 1
      await theOwner.save()
    }else {
      await rangerWork.save()

      return [{
        status: 1,
        messages: [],
        data: {
          car_status: 'RegisteredByRanger'
        }
      }]
    }



    return [{
      status: 0,
      messages: [{
        code: "CarShielded",
        message: "خودرو شیلد می باشد"
      }],
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

    if(user.is_parking_ranger!=4) {
      return [{
        status: 0,
        messages: [{
          code: 'NotRanger',
          message: 'شما پارکیار نمی باشید'
        }],
        data: {}
      }]
    }

    try{
      let settings = await Setting.get()
      let results = await Car.getCarsAround(params.lon_gps, params.lat_gps, settings.arrest_lookup_distance)
      let theCar, cars = []
      for(let i = 0;i < results.length;i++) {
          theCar = await Car.find(results[i].vehicle_id)
          theCar = theCar.toJSON()
          theCar['distance'] = parseInt(results[i].dis, 10)
          cars.push(theCar)
      }
      return [{
        status: 1,
        messages: [],
        data: {
          founds: cars
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

module.exports = CarController
