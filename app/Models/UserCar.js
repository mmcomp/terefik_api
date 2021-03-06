'use strict'


const Model = use('Model')

class UserCar extends Model {
  static get table () {
    return 'user_vehicle'
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

  history () {
    return this.hasMany('App/Models/UserCarHistory', 'id', 'user_vehicle_id')
  }
}

module.exports = UserCar
