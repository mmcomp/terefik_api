'use strict'

const Car = use('App/Models/Car')
const User = use('App/Models/User')
const UserCar = use('App/Models/UserCar')
const RangerWork = use('App/Models/RangerWork')
const Setting = use('App/Models/Setting')
const Transaction = use('App/Models/Transaction')
const UserTerefik = use('App/Models/UserTerefik')

const DiscountController = use('App/Controllers/Mqtt/DiscountController')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const Validations = use('App/Libs/Validations')
const _ = require('lodash')

class CarController {
  static async shield(params, user) {
    const rules = {
      car_id: 'required',
      lon_gps: 'required',
      lat_gps: 'required',
      units: 'required',
      use_discount: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let settings = await Setting.get()
    let units = parseInt(params.units, 10)
    let car_id = params.car_id
    await user.loadMany(['property'])
    let userData = user.toJSON()

    let userCar = await UserCar.query().where('user_id', user.id).where('vehicle_id', car_id).first()
    if(!userCar) {
      return [{
        status: 0,
        messages: [{
          code: "CarNotYours",
          message: "خودرو متعلق به شما نمی باشد"
        }],
        data: {}
      }]
    }

    let shieldFinish = Time(userCar.shield_start).add(userCar.shield_duration, 'minutes')
    
    let shieldDiff = shieldFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')

    if(shieldDiff>0) {
      return [{
        status: 0,
        messages: [{
          code: "AlreadyShielded",
          message: "خودرو شما تا " + shieldDiff + " ثانیه شیلد است "
        }],
        data: {
          shield_remained: shieldDiff
        }
      }]
    }

    let userDiscounter, discountPercent = 0
    if(params.use_discount===true) {
      userDiscounter = await UserTerefik.query().where('user_id', user.id).where('ttype', 'discounter').first()
      if(userDiscounter) {
        discountPercent = DiscountController.cal(userDiscounter, settings)
      }
    }

    discountPercent = (100 - discountPercent)/100

    let totalPay = parseInt(settings.unit_to_bronze_coin * units * discountPercent, 10)

    if(totalPay > userData.property.bronze_coin) {
      return [{
        status: 0,
        messages: [{
          code: "ShortOnBronze",
          message: "سکه شما کافی نمی باشد"
        }],
        data: {}
      }]
    }

    let transaction = new Transaction
    transaction.user_id = user.id
    transaction.type = 'shield'
    transaction.type_id = -1
    transaction.price_type = 'bronze_coin'
    transaction.price = totalPay
    transaction.status = 'success'
    await transaction.save()

    await user.property().update({
      bronze_coin: userData.property.bronze_coin - totalPay
    })

    if(discountPercent < 1) {
      userDiscounter.gasoline = userDiscounter.gasoline * (100 - settings.dicounter_usage_percent) / 100
      userDiscounter.health = userDiscounter.health * (100 - settings.dicounter_usage_percent) / 100
      userDiscounter.clean = userDiscounter.clean * (100 - settings.dicounter_usage_percent) / 100
      await userDiscounter.save()
    }

    user.is_sheild = 1
    await user.save()

    userCar.shield_start = Moment.now("YYYY-MM-DD HH:mm:ss")
    userCar.shield_duration = units * settings.unit_to_minute
    userCar.lon = params.lon_gps
    userCar.lat = params.lat_gps
    await userCar.save()

    return [{
      status: 1,
      messages: [],
      data: {
        total_pay: totalPay,
        end_time: Time(userCar.shield_start).add(userCar.shield_duration, 'minutes').format("YYYY-MM-DD HH:mm:ss")
      }
    }]
  }

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

    return [{
      status: 1,
      messages: [],
      data: {
        cars: cars
      }
    }]
  }

  static async arrest(params, user) {
    let settings = await Setting.get() 

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

    let carOwner = {}, rangerSilver = 0, isNotReDone = 1

    let carStatus = 'NotRegistered'

    await user.loadMany(['property'])
    let userData = user.toJSON()

    let car = await Car.query().where('number_2', params.number_2).where('number_ch', params.number_ch).where('number_3', params.number_3).where('number_ir', params.number_ir).where('number_extra', params.number_extra).first()

    if(!car) {
      let car= new Car
      car.number_2 = params.number_2
      car.number_ch = params.number_ch
      car.number_3 = params.number_3
      car.number_ir = params.number_ir
      car.number_extra = params.number_extra
      await car.save()

      params['car_id'] = car.id

      rangerSilver += isNotReDone * settings.silver_when_not_reported


      await user.property().update({
        silver_coin: userData.property.silver_coin + rangerSilver
      })

      return this._arrest(params, user)
    }

    params['car_id'] = car.id
    
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
      }else {
        isNotReDone = 0
      }

      rangerSilver += isNotReDone * settings.silver_when_not_reported


      await user.property().update({
        silver_coin: userData.property.silver_coin + rangerSilver
      })

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

    params['car_id'] = car.id
    return this._arrest(params, user)
  }

  static async _arrest(params, user) {   
    let settings = await Setting.get() 
    
    let userData = user.toJSON()

    let loot = {
      silver_coin: 0,
      gasoline: 0,
      health: 0,
      cleaning: 0
    }
    let isNotReDone = 1, rangerWork = await RangerWork.query().where('vehicle_id', params.car_id).orderBy('created_at', 'DESC').first()
    if(rangerWork) {
      let settings = await Setting.get()
      let lastArrestTime = Time(rangerWork.created_at)
      if(settings.arrest_timeout >= Time().diff(lastArrestTime, 'minutes')) {
        isNotReDone = 0
        return [{
          status: 0,
          messages: [{
            code: "AlreadyArrested",
            message: "این خودرو قبلا گزارش شده است"
          }],
          data: {}
        }]
      }
    }

    await user.property().update({
      silver_coin: userData.property.silver_coin + isNotReDone * settings.silver_when_not_reported
    })

    rangerWork = new RangerWork
    rangerWork.ranger_id = user.id
    rangerWork.vehicle_id = params.car_id
    rangerWork.lon_gps = params.lon_gps
    rangerWork.lat_gps = params.lat_gps
    rangerWork.image_path = params.image_path
    rangerWork.silver_coin = isNotReDone * settings.silver_when_not_reported
    loot.silver_coin = rangerWork.silver_coin

    let driver, userCar = await UserCar.query().where('vehicle_id', params.car_id).with('user').first()
    if(userCar) {
      driver = userCar.toJSON().user
      let shieldFinish = Time(userCar.shield_start).add(userCar.shield_duration, 'minutes')
  
      let shieldDiff = shieldFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')

      let theOwner = await User.query().where('id', driver.id).with('property').first()
      let theOwnerData = theOwner.toJSON()

      if(shieldDiff<=0) {
        rangerWork.user_vehicle_id = userCar.id

        await user.property().update({
          silver_coin: userData.property.silver_coin + isNotReDone * settings.silver_when_not_shield
        })

        rangerWork.silver_coin += settings.silver_when_not_shield
        rangerWork.gasoline = settings.arrest_loot * theOwnerData.property.gasoline / 100
        rangerWork.health = settings.arrest_loot * theOwnerData.property.health_oil / 100
        rangerWork.cleaning = settings.arrest_loot * theOwnerData.property.cleaning_soap / 100
        await rangerWork.save()

        loot.silver_coin = rangerWork.silver_coin
        loot.gasoline = rangerWork.gasoline
        loot.health = rangerWork.health
        loot.cleaning = rangerWork.cleaning

        theOwner.is_sheild = 0
        await theOwner.save()

        return [{
          status: 1,
          messages: [],
          data: {
            car_status: 'NotShielded',
            loot: loot
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
          car_status: 'RegisteredByRanger',
          loot: loot
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

  static async arrestList(params, user) {
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

    let rangerWorks = await RangerWork.query().where('ranger_id', user.id).groupBy('vehicle_id').with('cars').fetch()

    let cars = []
    let jsonData = rangerWorks.toJSON()

    for(let i = 0;i < jsonData.length;i++) {
      cars.push(jsonData[i].cars)
    }

    return [{
      status: 1,
      messages: [],
      data: {
        cars: cars
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

  static async remove(params, user) {
    const rules = {
      car_id: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let car = await Car.find(params.car_id)
    if(car){
      await car.delete()

      return [{
        status: 1,
        messages: [],
        data: {}
      }]
    }

    return [{
      status: 0,
      messages: [{
        code: "CarNotFound",
        message: "خودرو مورد نظر پیدا نشد"
      }],
      data: {}
    }]
  }
}

module.exports = CarController
