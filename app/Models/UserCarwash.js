'use strict'

const Model = use('Model')

class UserCarwash extends Model {
  static get table () {
    return 'user_carwash'
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

  terefiki () {
    return this.hasOne('App/Models/UserTerefik', 'terefiki_id', 'id')
  }
}

module.exports = UserCarwash
