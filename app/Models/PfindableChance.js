'use strict'

const Model = use('Model')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

class PfindableChance extends Model {
  static get table () {
    return 'pfindable_chances'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }

  static async activeOne () {
    let theActive = await PfindableChance.query().where('is_active', 1).first()
    return theActive
  }

  static hourToIndex (hour) {
    return parseInt((hour - 7)/2, 10) % 7
  }

  static async getCurrentChance () {
    let out = 0
    let theActive = await PfindableChance.activeOne()
    if(theActive) {
      let currentHour = parseInt(Time().format('HH'), 10)
      if(currentHour>=7 && currentHour<=20) {
        out = theActive['ch' + PfindableChance.hourToIndex(currentHour)]
      }
    }
    return out
  }
}

module.exports = PfindableChance
