'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UserCarHistory extends Model {
  static get table () {
    return 'user_vehicle_histories'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }

  // Relations
  user () {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }

  cars () {
    return this.hasOne('App/Models/Car', 'vehicle_id', 'id')
  }
}

module.exports = UserCarHistory
