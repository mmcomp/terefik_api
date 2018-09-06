'use strict'

const Setting = use('App/Models/Setting')

class SettingController {
  static async get (params, user) {
    let settings = await Setting.get()

    return [{
      status: 1,
      messages: [],
      data: {
        settings: {
          unit_to_minute: settings.unit_to_minute,
          unit_to_bronze_coin: settings.unit_to_bronze_coin,
          unit_max: settings.unit_max
        }
      }
    }]
  }
}

module.exports = SettingController
