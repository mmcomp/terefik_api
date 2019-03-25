'use strict'

const Setting = use('App/Models/Setting')

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
}

module.exports = Zone
