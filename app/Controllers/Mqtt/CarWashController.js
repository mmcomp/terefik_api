'use strict'

const Car = use('App/Models/Car')
const User = use('App/Models/User')
const Property = use('App/Models/Property')
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
  static async getTerefikis(params, user) {
    let settings = await Setting.get()
    await user.loadMany(['terefik'])
    let userData = user.toJSON()

    let terefikis = []
    for(let i = 0;i < userData.terefik.length;i++) {
      try{
        userData.terefik[i].filth_layers = JSON.parse(userData.terefik[i].filth_layers)
      }catch(e){
        userData.terefik[i].filth_layers = []
      }
      terefikis.push(
        {
          terefiki_type: userData.terefik[i].ttype,
          terefikI_clean_level: userData.terefik[i].clean,
          terefikI_filth_layers : userData.terefik[i].filth_layers
        }
      )
    }

    return [{
      status: 1,
      messages: [],
      data: {
        terefikis: terefikis,
        water_per_second: settings.water_per_second,
        coke_per_second: settings.coke_per_second,
        soap_per_second: settings.soap_per_second
      }
    }]
  }

  static async washedTerefiki(params, user) {
    const rules = {
      terefiki_type: 'required',
      water: 'required',
      coke: 'required',
      soap: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let userTerefiki = await UserTerefik.query().where('user_id', user.id).where('ttype', params.terefiki_type).first()
    if(!userTerefiki) {
      return [{
        status: 0,
        messages: [{
          code: "TerefikiNotFound",
          message: "ترفیکی مورد نظر یافت نشد"
        }],
        data: {
        }
      }]
    }

    let userProperty = await Property.query().where('user_id', user.id).first()
    if(!userProperty) {
      return [{
        status: 0,
        messages: [{
          code: "UserPropertyError",
          message: "اطلاعات کاربر ناقص می باشد"
        }],
        data: {
        }
      }]
    }

    if(userProperty.water < params.water) {
      return [{
        status: 0,
        messages: [{
          code: "NotEnoughWater",
          message: "آب کافی نیست"
        }],
        data: {
        }
      }]
    }
    if(userProperty.coke < params.coke) {
      return [{
        status: 0,
        messages: [{
          code: "NotEnoughCoke",
          message: "نوشابه کافی نیست"
        }],
        data: {
        }
      }]
    }
    if(userProperty.cleaning_soap < params.soap) {
      return [{
        status: 0,
        messages: [{
          code: "NotEnoughSoap",
          message: "صابون کافی نیست"
        }],
        data: {
        }
      }]
    }
    userProperty.water -= params.water
    userProperty.coke -= params.coke
    userProperty.cleaning_soap -= params.soap
    await userProperty.save()
    userTerefiki.clean = 1
    await userTerefiki.save()
    
    return [{
      status: 1,
      messages: [],
      data: {
      }
    }]
  }
}

module.exports = CarWashController