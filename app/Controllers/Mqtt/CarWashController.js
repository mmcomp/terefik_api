'use strict'

const Car = use('App/Models/Car')
const User = use('App/Models/User')
const UserCar = use('App/Models/UserCar')
const RangerWork = use('App/Models/RangerWork')
const Setting = use('App/Models/Setting')
const Transaction = use('App/Models/Transaction')
const UserTerefik = use('App/Models/UserTerefik')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const Validations = use('App/Libs/Validations')
const _ = require('lodash')

class CarWashController {
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
}

module.exports = CarWashController
