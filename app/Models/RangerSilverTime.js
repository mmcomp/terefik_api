'use strict'


const Model = use('Model')

class RangerSilverTime extends Model {
  static get table () {
    return 'inspector_silver_time'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }
}

module.exports = RangerSilverTime
