'use strict'

// مدل مرتبط با تله های در اختیار هر کاربر 

const Model = use('Model')

class UserTrap extends Model {
  static get table () {
    return 'user_traps'
  }

  // Relations
  trap () {
    return this.belongsTo('App/Models/Trap', 'trap_id', 'id')
  }
}

module.exports = UserTrap
