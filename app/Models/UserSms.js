'use strict'

// مدل مرتبط با پیامک های ارسال شده به هر کاربر 

const Model = use('Model')

class UserSms extends Model {
  static get table () {
    return 'user_sms'
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
}

module.exports = UserSms
