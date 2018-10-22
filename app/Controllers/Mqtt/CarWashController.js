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
  static async getTerefikis(params, user) {
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
        terefikis: terefikis
      }
    }]
  }
}

module.exports = CarWashController