'use strict'

const Parking = use('App/Models/Parking')
const Setting = use('App/Models/Setting')

const Validations = use('App/Libs/Validations')
const _ = require('lodash')

class ParkingController {
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

    try{
      let settings = await Setting.get()
      let results = await Parking.getParkingsAround(params.lon_gps, params.lat_gps, settings.parking_lookup_distance)

      return [{
        status: 1,
        messages: [],
        data: {
          founds: results,
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

module.exports = ParkingController
