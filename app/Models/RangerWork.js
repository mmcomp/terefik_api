'use strict'


const Model = use('Model')

class RangerWork extends Model {
  static boot () {
    super.boot()
    this.addHook('beforeCreate', 'ArrestZoneHook.zoneDetect')
  }

  static get table () {
    return 'insector_work'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }

  // Relations
  userCar () {
    return this.belongsTo('App/Models/UserCar', 'user_vehicle_id', 'id')
  }

  cars () {
    return this.hasOne('App/Models/Car', 'vehicle_id', 'id')
  }
}

module.exports = RangerWork
