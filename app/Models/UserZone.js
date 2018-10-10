'use strict'


const Model = use('Model')

class UserZone extends Model {
  static get table () {
    return 'user_zone'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }

  // Relations
  user () {
    return this.belongsTo('App/Models/User', 'users_id', 'id')
  }
}

module.exports = UserZone
