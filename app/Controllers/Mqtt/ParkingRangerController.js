'use strict'

const Code = use('App/Models/Code')
const Transaction = use('App/Models/Transaction')
const Shield = use('App/Models/Shield')
const Stat = use('App/Models/Stat')
const Log = use('App/Models/Log')
const axios = require('axios')
const querystring = require('querystring')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const Env = use('Env')
const Messages = use('App/Libs/Messages/Messages')
const Validations = use('App/Libs/Validations')
const _ = require('lodash')

class ParkingRangerController {
  static async register(params, user) {
    const rules = {
      first_name: 'required',
      last_name: 'required',
      national_code: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    if(user.is_parking_ranger!=0) {
      return [{
        status: 0,
        messages: [{
          code: 'RangerRegisterNotPossible',
          message: 'در حال حاضر امکان ثبت نام شما به عنوان پارکیار نمی باشد'
        }],
        data: {}
      }]
    }

    user.fname = params.first_name
    user.lname = params.last_name
    user.national_code = params.national_code
    user.is_parking_ranger = 1
    await user.save()

    return [{
      status: 1,
      messages: [],
      data: {}
    }]
  }
}

module.exports = ParkingRangerController
