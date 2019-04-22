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
          unit_to_bronze_coin_2: settings.unit_to_bronze_coin_2,
          unit_to_bronze_coin_3: settings.unit_to_bronze_coin_3,
          unit_to_bronze_coin_4: settings.unit_to_bronze_coin_4,
          unit_to_bronze_coin_5: settings.unit_to_bronze_coin_5,
          unit_to_bronze_coin_6: settings.unit_to_bronze_coin_6,
          unit_to_bronze_coin_7: settings.unit_to_bronze_coin_7,
          unit_to_bronze_coin_8: settings.unit_to_bronze_coin_8,
          unit_to_bronze_coin_9: settings.unit_to_bronze_coin_9,
          unit_to_bronze_coin_10: settings.unit_to_bronze_coin_10,
          unit_max: settings.unit_max,
          last_critical_version: settings.last_critical_version,
          last_version: settings.last_version,
        }
      }
    }]
  }
}

module.exports = SettingController
