'use strict'

// مدل مرتبط با پیام های کاربران که در واقع محل نگهداری پیام های مرتبط به حمله و انتقام به یکدیگر می باشد .

const Model = use('Model')

class Message extends Model {
  static get table () {
    return 'messages'
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

module.exports = Message
