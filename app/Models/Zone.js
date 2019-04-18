'use strict'

const Setting = use('App/Models/Setting')
const Database = use('Database')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

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
    let query = "SELECT id FROM zone WHERE intersects(shape, point(" + lon + ", " + lat + "))=1"
    let res = await Database.raw(query)
    if(res[0].length>0) {
        zone_id = res[0][0].id
    }
    return zone_id
  }
}

module.exports = Zone
