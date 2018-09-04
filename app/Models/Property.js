'use strict'

// مدل مرتبط با دارایی های کاربران

const Model = use('Model')

class Property extends Model {
  static get table () {
    return 'user_property'
  }


  // Relations
  user () {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }
}

module.exports = Property
