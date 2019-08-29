'use strict'

const Model = use('Model')

class UserAchievment extends Model {
  static get table () {
    return 'users_achievment'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }

  // Relations
  achievment () {
    return this.belongsTo('App/Models/Achievment', 'achievments_id', 'id')
  }

  user () {
    return this.hasOne('App/Models/User', 'users_id', 'id')
  }
}

module.exports = UserAchievment
