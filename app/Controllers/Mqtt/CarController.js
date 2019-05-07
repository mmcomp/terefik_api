'use strict'

const Car = use('App/Models/Car')
const CarFake = use('App/Models/CarFake')
const User = use('App/Models/User')
const UserCar = use('App/Models/UserCar')
const RangerWork = use('App/Models/RangerWork')
const RangerSilverTime = use('App/Models/RangerSilverTime')
const Property = use('App/Models/Property')
const Setting = use('App/Models/Setting')
const Transaction = use('App/Models/Transaction')
const UserTerefik = use('App/Models/UserTerefik')
const Notification = use('App/Models/Notification')
const InspectorDailyReport = use('App/Models/InspectorDailyReport')
const Achievment = use('App/Models/Achievment')
const Zone = use('App/Models/Zone')
const UserZone = use('App/Models/UserZone')
const ParkingRegister = use('App/Models/ParkingRegister')
const UserFindableGift = use('App/Models/UserFindableGift')
const UserPfindableGift = use('App/Models/UserPfindableGift')
const PfindableGift = use('App/Models/PfindableGift')
const InspectorTrafficOffence = use('App/Models/InspectorTrafficOffence')
const Database = use('Database')

const Env = use('Env')

const DiscountController = use('App/Controllers/Mqtt/DiscountController')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const Validations = use('App/Libs/Validations')
const _ = require('lodash')

class CarController {
  static unitCost(units, settings) {
    let unitCosts = parseInt(settings.unit_to_bronze_coin_10, 10)
    let unitsTotal = parseInt(settings.unit_to_bronze_coin, 10)

    for(let i = 2;i <= Math.min(units, 10);i++) {
      unitsTotal += parseInt(settings['unit_to_bronze_coin_' + i], 10)
    }
    if(units>10) {
      unitsTotal += unitCosts * (units - 10)
    }

    return unitsTotal
  }

  static p2e(inp) {
    let out = String(inp).replace(/۰/g, '0')
    out = out.replace(/۱/g, '1')
    out = out.replace(/۲/g, '2')
    out = out.replace(/۳/g, '3')
    out = out.replace(/۴/g, '4')
    out = out.replace(/۵/g, '5')
    out = out.replace(/۶/g, '6')
    out = out.replace(/۷/g, '1')
    out = out.replace(/۸/g, '1')
    out = out.replace(/۹/g, '1')
    return out
  }

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

    let extraDiamond = 0
    console.log('5 Min age', Time(Moment.now("YYYY-MM-DD HH:mm:ss")).subtract(settings.reshielding_time, 'minutes').format('YYYY-MM-DD HH:mm:ss'))
    let rangerWork = await RangerWork.query().where('user_vehicle_id', userCar.id).where('created_at', '>=', Time(Moment.now("YYYY-MM-DD HH:mm:ss")).subtract(settings.reshielding_time, 'minutes').format('YYYY-MM-DD HH:mm:ss')).first()
    if(rangerWork) {
      extraDiamond = settings.diamond_earn_on_reshielding
    }
    console.log('Extra Diamond', extraDiamond)
    console.log('Total Diamond', settings.diamond_earn_on_shielding + extraDiamond)

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

    /*
    let unitCost = parseInt(settings.unit_to_bronze_coin_10, 10)
    let unitsTotal = parseInt(settings.unit_to_bronze_coin, 10)
    for(let i = 2;i <= Math.min(units, 10);i++) {
      unitsTotal += parseInt(settings['unit_to_bronze_coin_' + i], 10)
    }
    if(units>10) {
      unitsTotal += unitCost * (units - 10)
    }
    */
    let unitsTotal = CarController.unitCost(units, settings)

    let totalPay = Math.ceil(unitsTotal * discountPercent, 10)

    if(totalPay > userData.property.bronze_coin) {
      if(userData.property.bronze_coin<0) {
        return [{
          status: 0,
          messages: [{
            code: "ShortOnBronzeEvenWithExtra",
            message: "سکه شما کافی نمی باشد و اعتبار سکه شما منفی شده است"
          }],
          data: {}
        }]
      }

      if(settings.max_bronze_negative + userData.property.bronze_coin < totalPay) {
        return [{
          status: 0,
          messages: [{
            code: "ShortOnBronze",
            message: "سکه شما کافی نمی باشد"
          }],
          data: {}
        }]
      }
    }

    let transaction = new Transaction
    transaction.user_id = user.id
    transaction.type = 'shield'
    transaction.type_id = -1
    transaction.price_type = 'bronze_coin'
    transaction.price = totalPay
    transaction.status = 'success'
    transaction.save()

    let transactions = Transaction.query().where('user_id', user.id).where('type', 'shield').where('status', 'success').getCount()
    let gift = (transactions % settings.park_count_for_gift == 0) 

    let loot = {
      diamond: settings.diamond_earn_on_shielding + extraDiamond,
      gasoline: settings.park_gasoline,
      health: settings.park_health,
      clean: settings.park_clean,
      water: settings.park_water,
    }
    await user.property().update({
      bronze_coin: userData.property.bronze_coin - totalPay,
      diamond: userData.property.diamond + settings.diamond_earn_on_shielding + extraDiamond,
      experience_score: userData.property.experience_score + settings.car_park_exp,
      gasoline: userData.property.gasoline + settings.park_gasoline,
      health_oil: userData.property.health_oil + settings.park_health,
      cleaning_soap: userData.property.cleaning_soap + settings.park_clean,
      water: userData.property.water + settings.park_water,
    })

    if(discountPercent < 1) {
      userDiscounter.gasoline = userDiscounter.gasoline * (100 - settings.dicounter_usage_percent) / 100
      userDiscounter.health = userDiscounter.health * (100 - settings.dicounter_usage_percent) / 100
      userDiscounter.clean = userDiscounter.clean * (100 - settings.dicounter_usage_percent) / 100
      userDiscounter.save()
    }

    user.is_sheild = 1
    await user.save()

    userCar.shield_start = Moment.now("YYYY-MM-DD HH:mm:ss")
    userCar.shield_duration = units * settings.unit_to_minute
    userCar.lon = params.lon_gps
    userCar.lat = params.lat_gps
    userCar.total_unit = units
    userCar.total_coin = totalPay
    userCar.leave_time = null
    userCar.leave_unit = 0
    await userCar.save()

    // if(params.crowd && (params.crowd=='green_reports' || params.crowd=='yellow_reports' || params.crowd=='red_reports')) {
    //   let query = "SELECT id FROM zone WHERE intersects(shape, point(" + userCar.lon + ", " + userCar.lat + "))=1"
    //   let res = await Database.raw(query)

    //   if(res[0].length>0) {
    //       let theZone = await Zone.find(res[0][0].id)
    //       if(theZone) {
    //         await theZone.crowdInc(params.crowd)
    //       }
    //   }
    // }

    Achievment.achieve(user.id, 'park')

    return [{
      status: 1,
      messages: [],
      data: {
        total_pay: totalPay,
        end_time: Time(userCar.shield_start).add(userCar.shield_duration, 'minutes').format("YYYY-MM-DD HH:mm:ss"),
        experience_score: userData.property.experience_score + settings.car_park_exp,
        gift: gift,
        loot: loot,
      }
    }]
  }

  static async crowd(params, user) {
    const rules = {
      lon_gps: 'required',
      lat_gps: 'required',
      crowd: 'required',
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let data = null
    if(params.crowd && (params.crowd=='green_reports' || params.crowd=='yellow_reports' || params.crowd=='red_reports')) {
      let query = "SELECT id FROM zone WHERE intersects(shape, point(" + params.lon_gps + ", " + params.lat_gps + "))=1"
      let res = await Database.raw(query)
      data = 'Zone Not Found'
      if(res[0].length>0) {
          let theZone = await Zone.find(res[0][0].id)
          if(theZone) {
            await theZone.crowdInc(params.crowd)
            data = 'Zone Updated'
          }
      }
    }else {
      return [{
        status: 0,
        messages: [{
          code: "InvalidInput",
          message: "ورودی ها صحیج نمی باشد",
        }],
        data: {
        }
      }]
    }

    return [{
      status: 1,
      messages: [],
      data: {
        message: data,
      }
    }]
  }

  static async leave(params, user) {
    const rules = {
      car_id: 'required',
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let car_id = params.car_id

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

    let shieldDiff = Time().diff(Time(userCar.shield_start).add(userCar.shield_duration, 'minutes'), 'seconds')
    if(shieldDiff>=0) {
      return [{
        status: 0,
        messages: [{
          code: "NotShielded",
          message: "شما شیلد نمی باشید"
        }],
        data: {}
      }]
    }

    let settings = await Setting.get()
    let leaveTime = Time().format('YYYY-MM-DD HH:mm:ss')
    let leave_diff = Time(leaveTime).diff(userCar.shield_start, 'seconds')
    let unit_to_bronze_coin = settings.unit_to_bronze_coin_10
    console.log('Leave Diff', leave_diff, userCar.shield_duration)
    if(leave_diff/60<userCar.shield_duration) {
      userCar.leave_unit = userCar.total_unit - Math.ceil(leave_diff/(settings.unit_to_minute*60))
      userCar.leave_coin = userCar.total_coin - CarController.unitCost(Math.ceil(leave_diff/(settings.unit_to_minute*60)), settings) //(Math.ceil(leave_diff/(settings.unit_to_minute*60)) * unit_to_bronze_coin)
      if(userCar.leave_coin<0) {
        userCar.leave_coin = 0
      }
      userCar.shield_duration = leave_diff/60
      userCar.leave_time = leaveTime
    }
    await userCar.save()

    let loot = {
      remaining_units: userCar.leave_unit,
      back_bronze_coin: userCar.leave_coin,
    }

    if(userCar.leave_coin>0) {
      let userProperty = await Property.query().where('user_id', user.id).first()
      if(userProperty) {
        userProperty.bronze_coin += userCar.leave_coin
        await userProperty.save()
      }
    }

    return [{
      status: 1,
      messages: [],
      data: {
        loot: loot,
      }
    }]
  }

  static async leaveList(params, user) {
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
      let theCar, cars = [], shieldFinish, shieldDiff, leaveTime
      for(let i = 0;i < results.length;i++) {
        if(results[i].leave_time) {
          shieldFinish = Time(results[i].shield_start).add(results[i].shield_duration, 'minutes')
          shieldDiff = shieldFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')
          leaveTime = shieldFinish.diff(results[i].leave_time, 'seconds')
          if(shieldDiff>0 && leaveTime>0) {
            theCar = await Car.find(results[i].vehicle_id)
            theCar = theCar.toJSON()
            theCar['distance'] = parseInt(results[i].dis, 10)
            theCar['shield_start'] = results[i].shield_start
            theCar['shield_duration'] = results[i].shield_duration
            theCar['shield_end'] = shieldFinish.format('YYYY-MM-DD HH:mm:ss')
            theCar['lon'] = results[i].lon
            theCar['lat'] = results[i].lat
            cars.push(theCar)
          }
        }
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

  static async shieldList(params, user) {
    let shieldDiff = 0, cars = [], userCars = await UserCar.query().where('user_id', user.id).with('cars').fetch()
    userCars = userCars.toJSON()

    for(let i = 0;i < userCars.length;i++) {
      shieldDiff = Time().diff(Time(userCars[i].shield_start).add(userCars[i].shield_duration, 'minutes'), 'seconds')
      if(shieldDiff<0) {
        userCars[i]['shield_end'] = Time(userCars[i].shield_start).add(userCars[i].shield_duration, 'minutes')/*.valueOf()*/.format("YYYY-MM-DD HH:mm:ss")
        cars.push(userCars[i])
      }
      // userCars[i].shield_start = Time(userCars[i].shield_start).valueOf()
    }

    return [{
      status: 1,
      messages: [],
      data: {
        cars: cars
      }
    }]
  }

  static async add(params, user) {
    try{
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
  
      for(let i in params) {
        params[i] = CarController.p2e(params[i])
      }
  
      let car = await Car.query().where({
        number_2: params.number_2,
        number_3: params.number_3,
        number_ch: params.number_ch,
        number_ir: params.number_ir,
      }).first()
      // console.log('CAR', car)
      if(!car) {
        car = new Car
        for(let i in params) {
          car[i] = params[i]
        }
        await car.save()  
      }
      // console.log('CAR AGAIN', car)
      // console.log('vehicle_id', car.id, '|', 'user_id', user.id)
      // let userCar = await UserCar.query().where('vehicle_id', car.id).where('user_id', '!=', user.id).first()
      // if(!userCar) {
        let userCar = await UserCar.query().where('vehicle_id', car.id).where('user_id', user.id).first()
        if(!userCar) {
          userCar = new UserCar
          userCar.user_id = user.id
          userCar.vehicle_id = car.id
          await userCar.save()    
        }
      // }else {
      //   return [{
      //     status: 0,
      //     messages: [{
      //       code: "CarBelongsToOther",
      //       message: "این خودرو به نام شخص دیگری ثبت است"
      //     }],
      //     data: {}
      //   }]      
      // }
  
      return [{
        status: 1,
        messages: [],
        data: {
          car_id: car.id,
        }
      }]
    }catch(e) {
      console.log('Error Add Car')
      console.log(e)
      return [{
        status: 0,
        messages: [{
          code: "SystemError",
          message: "خطای سیستمی",
        }],
        data: {}
      }]
    }
  }

  static async fake(params, user) {
    try{
      const rules = {
        color_id: 'required',
        model_id: 'required',
        car_id: 'required',
      }
  
      let check = await Validations.check(params, rules)
      if (check.err) {
        return [{
          status: 0,
          messages: check.messages,
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

      if(car.model_id==params.model_id && car.color_id==params.color_id) {
        return [{
          status: 0,
          messages: [{
            code: "CarIsTheSame",
            message: "خودرو مورد نظر با همین مشخصات ثبت است",
          }],
          data: {}
        }]
      }

      let carFakeUser = await CarFake.query().where('vehicle_id', car.id).where('ranger_id', user.id).first()
      if(carFakeUser) {
        return [{
          status: 0,
          messages: [{
            code: "CarAlreadyReported",
            message: "خودرو مورد نظر قبلا توسط شما گزارش شده است",
          }],
          data: {}
        }]
      }

      let carFakes = await CarFake.query().where('vehicle_id', car.id).where('model_id', params.model_id).where('color_id', params.color_id).fetch()
      carFakes = carFakes.toJSON()
      if(carFakes.length>=2) {
        car.model_id = params.model_id
        car.color_id = params.color_id
        await car.save()

        await CarFake.query().where('vehicle_id', car.id).delete()

        return [{
          status: 1,
          messages: [],
          data: {}
        }]
      }

      let carFake = new CarFake
      carFake.vehicle_id = car.id
      carFake.model_id = params.model_id
      carFake.color_id = params.color_id
      carFake.ranger_id = user.id
      await carFake.save()
      
      return [{
        status: 1,
        messages: [],
        data: {
          car_id: car.id,
        }
      }]
    }catch(e) {
      console.log('Error Add Car')
      console.log(e)
      return [{
        status: 0,
        messages: [{
          code: "SystemError",
          message: "خطای سیستمی",
        }],
        data: {}
      }]
    }
  }

  static async list(params, user) {
    await user.loadMany(['cars.usercar'])
    let userData = user.toJSON()
    let cars = userData.cars, car, shieldFinish, shieldDiff
    for(let i=0;i<cars.length;i++) {
      car = cars[i]
      shieldDiff = null
      cars[i].leave_time = null
      if(car.usercar) {
        shieldFinish = Time(car.usercar.shield_start).add(car.usercar.shield_duration, 'minutes')
        shieldDiff = shieldFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')
        if(shieldDiff<0) {
          shieldDiff = null
        }
        cars[i].leave_time = car.usercar.leave_time
      }
      delete cars[i].usercar
      cars[i].shield_diff = shieldDiff
      console.log('Check parking register', 'vehicle_id', car.id, Time().format('YYYY-MM-DD HH:mm:ss'))
      cars[i].parking_register = await ParkingRegister.query().with('parking').where('vehicle_id', car.id).where('expired_at', '>', Time().format('YYYY-MM-DD HH:mm:ss')).first()
    }

    return [{
      status: 1,
      messages: [],
      data: {
        cars: cars,
        server_time: Time().format('YYYY-MM-DD HH:mm:ss'),
      }
    }]
  }

  static async arrest(params, user) {
    console.log('Arrest start', params)

    let settings = await Setting.get() 

    let loot = {
      silver_coin: 0,
      gasoline: 0,
      health: 0,
      cleaning: 0,
    }

    let findable_gift = false

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
     
    let currentHour = parseInt(Time().format('HH'), 10)
    
    if(currentHour>=settings.time_limit_end || currentHour<=settings.time_limit_start) {
      return [{
        status: 0,
        messages: [{
          code: 'OutOfWorkingHours',
          message: 'خارج از محدوده زمانی فعالیت ثبت امکان پذیر نمی باشد'
        }],
        data: {}
      }]
    }

    let theZoneId = await Zone.zoneByCords(params.lon_gps, params.lat_gps)
    if(theZoneId<=0) {
      return [{
        status: 0,
        messages: [{
          code: 'OutOfZones',
          message: 'خارج از محدوده های مکانی گزارش نمی توانید ارسال کنید'
        }],
        data: {}
      }]
    }

    let rangerZone = await UserZone.query().where('users_id', user.id).first()
    if(!rangerZone) {
      return [{
        status: 0,
        messages: [{
          code: 'NoZones',
          message: 'شما به هیچ ناحیه ای دسترسی ندارید'
        }],
        data: {}
      }]
    }

    let carOwner = {}, rangerSilver = 0, isNotReDone = 1
    let carStatus = 'NotRegistered'

    await user.loadMany(['property'])
    let userData = user.toJSON()

    for(let i in params) {
      params[i] = CarController.p2e(params[i])
    }

    console.log('Arrest params', params)

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

    console.log('ShieldDiff', shieldDiff, 'Sheild Start', userCar.shield_start)
    if(shieldDiff>0 && userCar.shield_start) {
      carStatus = 'Shielded'

      theOwner.is_sheild = 1
      await theOwner.save()

      let settings = await Setting.get()
      let checkFinish = Time(userCar.check_time).add(settings.check_timeout, 'minutes')

      let checkDiff = checkFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')

      if(checkDiff<0 || userCar.checker_id!=user.id) {
        userCar.check_time = Moment.now('YYYY-MM-DD HH:mm:ss')
        userCar.checker_id = user.id
        await userCar.save()
        let gift_id = await UserFindableGift.tryToGetGift(user.id, theZoneId, userCar.vehicle_id)
        if(gift_id) {
          findable_gift = true
        }
        console.log('DRIVER FINDABLE GIFT')
        let pgift_id = await UserPfindableGift.tryToGetGift(theOwner.id, theZoneId, userCar.vehicle_id)
        if(pgift_id) {
          //push to driver
          let PGIFT = await PfindableGift.query().where('id', pgift_id).first()
          if(PGIFT) {
            let PGiftNotification = new Notification
            PGiftNotification.users_id = theOwner.id
            PGiftNotification.title = Env.get('PUSH_USER_FINDABLE_TITLE')
            PGiftNotification.message = Env.get('PUSH_USER_FINDABLE_MESSAGE')
            PGiftNotification.type = 'UserFindableGiftNotification'
            PGiftNotification.data = JSON.stringify({
              id: pgift_id,
              name: PGIFT.name,
            })
            PGiftNotification.save()  
          }
        }

        let ownerProperty = await Property.query().where('user_id', theOwner.id).first()
        ownerProperty.diamond+=settings.user_diamond_on_check
        ownerProperty.save()
        let DiamondNotification = new Notification
        DiamondNotification.users_id = theOwner.id
        DiamondNotification.title = Env.get('PUSH_USER_DIAMOND_TITLE')
        DiamondNotification.message = Env.get('PUSH_USER_DIAMOND_MESSAGE')
        DiamondNotification.message = DiamondNotification.message.replace('|diamond|', settings.user_diamond_on_check)
        DiamondNotification.type = 'UserDiamondOnCheck'
        DiamondNotification.data = JSON.stringify({
          diamond: settings.user_diamond_on_check,
        })
        DiamondNotification.save() 
      }else {
        isNotReDone = 0
        return [{
          status: 0,
          messages: [{
            code: "ReCheckError",
            message: "این خودرو رو خودت همین الان ثبت کردی",
          }],
          data: {}
        }]
      }

      rangerSilver += isNotReDone * settings.silver_when_not_reported
      let rangerSilverTime = await RangerSilverTime.query().where('start_time', Time().format('HH:00:00')).first()
      if(rangerSilverTime) {
        rangerSilver += rangerSilverTime.extra_silver
      }

      await user.property().update({
        silver_coin: userData.property.silver_coin + rangerSilver
      })

      loot.silver_coin = rangerSilver

      let zones = await UserZone.query().where('users_id', user.id).pluck('zone_id')
      let zone_id = 0
      if(zones.length>0) {
          let query = "SELECT id FROM zone WHERE id in (" + zones.join(',') + ") and intersects(shape, point(" + params.lon_gps + ", " + params.lat_gps + "))=1"
          let res = await Database.raw(query)
          if(res[0].length>0) {
              zone_id = res[0][0].id
              let theZone = await Zone.query().where('id', zone_id).first()
              theZone.reports++
              await theZone.save()
          }
      }

      let inspectorDailyReport = await InspectorDailyReport.query().where('user_id', user.id).whereRaw("created_at like  '" + Moment.now('YYYY-MM-DD') + "%'").first()
      if(!inspectorDailyReport) {
          inspectorDailyReport = new InspectorDailyReport
          inspectorDailyReport.user_id = user.id
          inspectorDailyReport.report_count = 0
      }
      inspectorDailyReport.report_count += 1
      await inspectorDailyReport.save()

      console.log('Arrest result', {
        status: 1,
        messages: [],
        data: {
          car_status: carStatus,
          loot: loot
        }
      })
      return [{
        status: 1,
        messages: [],
        data: {
          car_status: carStatus,
          loot: loot,
          findable_gift: findable_gift,
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
      cleaning: 0,
    }
    let findable_gift = false
    let theZoneId = await Zone.zoneByCords(params.lon_gps, params.lat_gps)

    let rangerSilverTime = await RangerSilverTime.query().where('start_time', Time().format('HH:00:00')).first()
    let extraSilver = 0
    if(rangerSilverTime) {
      extraSilver = rangerSilverTime.extra_silver
    }
    let driver, userCar = await UserCar.query().where('vehicle_id', params.car_id).with('user').first()
    let is_out = false
    let rangerExp = settings.car_check_exp
    let isNotReDone = 1, rangerWork = await RangerWork.query().where('vehicle_id', params.car_id).orderBy('created_at', 'DESC').first()
    if(rangerWork && rangerWork.ranger_id==user.id) {
      let settings = await Setting.get()
      let lastArrestTime = Time(rangerWork.created_at)
      if(settings.arrest_timeout >= Time().diff(lastArrestTime, 'minutes')) {
        isNotReDone = 0
        return [{
          status: 0,
          messages: [{
            code: "AlreadyArrested",
            message: "این خودرو به تازگی گزارش شده است"
          }],
          data: {}
        }]
      }
    }else if(rangerWork && rangerWork.ranger_id!=user.id) {
      let inspectorDailyReport = await InspectorDailyReport.query().where('user_id', user.id).whereRaw("created_at like  '" + Moment.now('YYYY-MM-DD') + "%'").first()
      if(!inspectorDailyReport) {
          inspectorDailyReport = new InspectorDailyReport
          inspectorDailyReport.user_id = user.id
          inspectorDailyReport.report_count = 0
      }
      inspectorDailyReport.report_count += 1
      await inspectorDailyReport.save()

      if(userCar) {
        let checkFinish = Time(userCar.check_time).add(settings.check_timeout, 'minutes')

        let checkDiff = checkFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')
  
        if(checkDiff<0 || userCar.checker_id!=user.id) {
          userCar.check_time = Moment.now('YYYY-MM-DD HH:mm:ss')
          userCar.checker_id = user.id
          await userCar.save()
          let gift_id = await UserFindableGift.tryToGetGift(user.id, theZoneId, userCar.vehicle_id)
          if(gift_id) {
            findable_gift = true
          }
        }
      }
      let rangerSilver = settings.silver_when_not_reported + extraSilver
      loot.silver_coin = rangerSilver

      await user.property().update({
        silver_coin: userData.property.silver_coin + loot.silver_coin ,
        inspector_score: userData.property.experience_score + rangerExp
      })

      await Achievment.achieve(user.id, 'ranger')

      return [{
        status: 1,
        messages: [],
        data: {
          car_status: 'Shielded',
          in_out : is_out,
          loot: loot,
          findable_gift: findable_gift,
        }
      }]
    }
    

    rangerWork = new RangerWork
    rangerWork.ranger_id = user.id
    rangerWork.vehicle_id = params.car_id
    rangerWork.lon_gps = params.lon_gps
    rangerWork.lat_gps = params.lat_gps
    rangerWork.image_path = params.image_path
    rangerWork.silver_coin = isNotReDone * settings.silver_when_not_reported
    
    
    if(userCar) {
      driver = userCar.toJSON().user
      let shieldFinish = Time(userCar.shield_start).add(userCar.shield_duration, 'minutes')
  
      let shieldDiff = shieldFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')

      let theOwner = await User.query().where('id', driver.id).with('property').first()
      let theOwnerData = theOwner.toJSON()
      // console.log('Shield Start')
      // console.log(userCar.shield_start, !userCar.shield_start)
      if(shieldDiff<=0 || userCar.shield_start=='Invalid date') {
        rangerWork.user_vehicle_id = userCar.id


        rangerWork.silver_coin += settings.silver_when_not_shield
        rangerWork.gasoline = settings.arrest_loot * theOwnerData.property.gasoline / 100
        rangerWork.health = settings.arrest_loot * theOwnerData.property.health_oil / 100
        rangerWork.cleaning = settings.arrest_loot * theOwnerData.property.cleaning_soap / 100

        theOwner.is_sheild = 0
        await theOwner.save()

        let userProperty = await  Property.query().where('user_id', theOwner.id).first()
        userProperty.diamond -= settings.diamond_lose_on_arrest
        if(userProperty.diamond<0) {
          userProperty.diamond = 0
        }
        await userProperty.save()

        if(rangerWork.zone_id==0) {
          rangerWork.silver_coin = rangerWork.silver_coin * settings.arrest_outofzone_loot_percent /100
          rangerWork.gasoline = settings.arrest_outofzone_loot_percent * theOwnerData.property.gasoline / 100
          rangerWork.health = settings.arrest_outofzone_loot_percent * theOwnerData.property.health_oil / 100
          rangerWork.cleaning = settings.arrest_outofzone_loot_percent * theOwnerData.property.cleaning_soap / 100
          is_out = true
        }

        rangerExp += settings.car_arrest_exp

        await rangerWork.save()

        loot.silver_coin = parseInt(rangerWork.silver_coin, 10)
        loot.gasoline = parseInt(rangerWork.gasoline, 10)
        loot.health = parseInt(rangerWork.health, 10)
        loot.cleaning = parseInt(rangerWork.cleaning, 10)

        await user.property().update({
          silver_coin: userData.property.silver_coin + loot.silver_coin + extraSilver,
          gasoline : userData.property.gasoline + loot.gasoline,
          health_oil: userData.property.health_oil + loot.health,
          cleaning_soap : userData.property.cleaning_soap + loot.cleaning,
          inspector_score: userData.property.experience_score + rangerExp
        })


        console.log('Arrest Notification')
        let notification = new Notification
        notification.title = Env.get('PUSH_USER_ARREST_TTILE')
        notification.message = Env.get('PUSH_USER_ARREST_MESSAGE')
        notification.message = notification.message.replace('|diamond_count|', settings.diamond_lose_on_arrest)
                                .replace('|recharge_time|', settings.reshielding_time)
                                .replace('|diamond_recharge|', settings.diamond_earn_on_reshielding)
        notification.users_id = theOwner.id
        notification.data = JSON.stringify({
          gasoline: -1*loot.gasoline,
          health: -1*loot.health,
          cleaning: -1*loot.cleaning,
          diamond: -1*settings.diamond_lose_on_arrest,
          arrest_id: rangerWork.id,
        })
        notification.type = 'user_arrest'
        notification.save()

        Achievment.achieve(user.id, 'ranger')

        let gift_id = await UserFindableGift.tryToGetGift(user.id, theZoneId, userCar.vehicle_id)
        if(gift_id) {
          findable_gift = true
        }

        return [{
          status: 1,
          messages: [],
          data: {
            car_status: 'NotShielded',
            in_out : is_out,
            loot: loot,
            findable_gift: findable_gift,
          }
        }]
      }
    }else {
      await rangerWork.save()

      if(rangerWork.zone_id==0) {
        is_out = true
        rangerWork.silver_coin = rangerWork.silver_coin * settings.arrest_outofzone_loot_percent /100
      }

      loot.silver_coin = parseInt(rangerWork.silver_coin, 10)

      await user.property().update({
        silver_coin: userData.property.silver_coin + loot.silver_coin + extraSilver
      })

      let gift_id = await UserFindableGift.tryToGetGift(user.id, theZoneId, params.car_id)
      if(gift_id) {
        findable_gift = true
      }

      return [{
        status: 1,
        messages: [],
        data: {
          car_status: 'RegisteredByRanger',
          in_out : is_out,
          loot: loot,
          findable_gift: findable_gift,
        }
      }]
    }



    return [{
      status: 0,
      messages: [{
        code: "Shielded",
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
      let theCar, cars = [], shieldFinish, shieldDiff, leaveDiff, leaveFinish
      for(let i = 0;i < results.length;i++) {
        shieldFinish = Time(results[i].shield_start).add(results[i].shield_duration, 'minutes')
        shieldDiff = shieldFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')
        leaveDiff = 0
        if(results[i].leave_time) {
          leaveFinish = Time(results[i].leave_time).add(10, 'minutes')
          leaveDiff = leaveFinish.diff(Moment.now('YYYY-MM-DD HH:mm:ss'), 'seconds')
        }
        if(shieldDiff>0 || leaveDiff>0) {
          theCar = await Car.find(results[i].vehicle_id)
          theCar = theCar.toJSON()
          theCar['distance'] = parseInt(results[i].dis, 10)
          theCar['shield_start'] = results[i].shield_start
          theCar['shield_duration'] = results[i].shield_duration
          theCar['shield_end'] = shieldFinish.format('YYYY-MM-DD HH:mm:ss')
          theCar['leave_time'] = results[i].leave_time
          theCar['is_left_sooner'] = (leaveDiff>0)
          theCar['lon'] = results[i].lon
          theCar['lat'] = results[i].lat
          cars.push(theCar)
        }
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

  static async trafficOffence(params, user) {
    try {

      let settings = await Setting.get() 
  
      const rules = {
        number_2: 'required',
        number_ch: 'required',
        number_3: 'required',
        number_ir: 'required',
        number_extra: 'required',
        lon_gps: 'required',
        lat_gps: 'required',
        image_path: 'required',
        description: 'required',
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
  
      let currentHour = parseInt(Time().format('HH'), 10)
    
      if(currentHour>=settings.time_limit_end || currentHour<=settings.time_limit_start) {
        return [{
          status: 0,
          messages: [{
            code: 'OutOfWorkingHours',
            message: 'خارج از محدوده زمانی فعالیت ثبت امکان پذیر نمی باشد'
          }],
          data: {}
        }]
      }

      let theZoneId = await Zone.zoneByCords(params.lon_gps, params.lat_gps)
      if(theZoneId<=0) {
        return [{
          status: 0,
          messages: [{
            code: 'OutOfZones',
            message: 'خارج از محدوده های مکانی گزارش نمی توانید ارسال کنید'
          }],
          data: {}
        }]
      }

      let rangerZone = await UserZone.query().where('users_id', user.id).first()
      if(!rangerZone) {
        return [{
          status: 0,
          messages: [{
            code: 'NoZones',
            message: 'شما به هیچ ناحیه ای دسترسی ندارید'
          }],
          data: {}
        }]
      }

      let userCar
      let car = await Car.query().where('number_2', params.number_2).where('number_ch', params.number_ch).where('number_3', params.number_3).where('number_ir', params.number_ir).where('number_extra', params.number_extra).first()
      if(!car) {
        car= new Car
        car.number_2 = params.number_2
        car.number_ch = params.number_ch
        car.number_3 = params.number_3
        car.number_ir = params.number_ir
        car.number_extra = params.number_extra
        await car.save()
      }else {
        userCar = await UserCar.query().where('vehicle_id', car.id).with('user').first()
      }

      console.log('car', car)

      let inspectorTrafficOffence = new InspectorTrafficOffence
      inspectorTrafficOffence.ranger_id = user.id
      inspectorTrafficOffence.lon = params.lon_gps
      inspectorTrafficOffence.lat = params.lat_gps
      if(userCar) {
        inspectorTrafficOffence.user_vehicle_id = userCar.id
      }
      inspectorTrafficOffence.vehicle_id = car.id
      inspectorTrafficOffence.zone_id = theZoneId
      inspectorTrafficOffence.image_path = params.image_path
      inspectorTrafficOffence.description = params.description
      await inspectorTrafficOffence.save()


      return [{
        status: 1,
        messages: [],
        data: {}
      }]
    }catch(e) {
      console.log(e)
      return [{
        status: 0,
        messages: [{
          code: "SystemError",
          message: JSON.stringify(e),
        }],
        data: {}
      }]
    }
  }
}

module.exports = CarController
