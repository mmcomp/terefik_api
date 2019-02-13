'use strict'

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
}

module.exports = Zone
