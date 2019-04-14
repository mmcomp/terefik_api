'use strict'

const Model = use('Model')

class ParkingRegister extends Model {
  static get table () {
    return 'parking_registers'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }

  // Relations
  parking () {
    return this.belongsTo('App/Models/Parking', 'parkings_id', 'id')
  }

  car () {
    return this.hasOne('App/Models/Car', 'vehicle_id', 'id')
  }
}

module.exports = ParkingRegister
