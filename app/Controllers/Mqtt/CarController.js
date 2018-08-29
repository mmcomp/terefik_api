'use strict'

const Car = use('App/Models/Car')
const UserCar = use('App/Models/UserCar')

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
}

module.exports = CarController
