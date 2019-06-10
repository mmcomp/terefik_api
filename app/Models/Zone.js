'use strict'

const Setting = use('App/Models/Setting')
const ZoneCar = use('App/Models/ZoneCar')
const Database = use('Database')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const Redis = use('Redis')
const Model = use('Model')

class Zone extends Model {
  static get table () {
    return 'zone'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }

  async crowdInc(crowd) {
    let settings = await Setting.get()

    let lastCrowdDiff = Time().diff(this.color_report_updated_at, 'minutes')

    if(lastCrowdDiff>settings.crowd_report_expire) {
      this.red_reports = 0
      this.yellow_reports = 0
      this.green_reports = 0
    }
    if(crowd=='red_reports') {
      this.red_reports++
    }else if(crowd=='yellow_reports') {
      this.yellow_reports++
    }else if(crowd=='green_reports') {
      this.green_reports++
    }
    this.color_report_updated_at = Time().format('YYYY-MM-DD HH:mm:ss')

    await this.save()
  }

  static async zoneByCords (lon, lat) {
    let zone_id = 0
    let query = "SELECT id FROM zone WHERE DISJOINT(shape, point(" + lon + ", " + lat + "))=0"
    console.log('Zone query')
    console.log(query)
    let res = await Database.raw(query)
    if(res[0].length>0) {
        zone_id = res[0][0].id
    }
    return zone_id
  }

  static async addCar (car_id, zone_id) {
    try {
      /*
      let zoneCar = await ZoneCar.query().where({
        vehicle_id: car_id,
        zone_id: zone_id,
      }).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').first()
      if(!zoneCar) {
        zoneCar = new ZoneCar
        zoneCar.vehicle_id = car_id
        zoneCar.zone_id = zone_id
        zoneCar.appearance = 0
      }
      zoneCar.appearance++
      await zoneCar.save()
      */
      let settings = await Setting.get()
      const stageKey = `car_${ car_id }_${ zone_id }`
      await Redis.select(1)
      let tmp = await Redis.hgetall(stageKey)
      if(typeof tmp.zone_id=='undefined') {
        await Redis.hmset(stageKey, ['zone_id', zone_id])
        let theZone = await Zone.find(zone_id)
        if(theZone) {
          theZone.current_car_count++
          if(theZone.current_car_count>theZone.max_car_count) {
            theZone.max_car_count = theZone.current_car_count
          }
          await theZone.save()
        }
      }
      await Redis.expire(stageKey, settings.arrest_timeout * 60)
    }catch(e) {
      console.log('Zone addCar Error', e)
    }
  }
}

module.exports = Zone
