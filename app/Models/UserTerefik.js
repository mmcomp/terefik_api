'use strict'

const Model = use('Model')

class UserTerefik extends Model {
  static boot () {
    super.boot()
    this.addHook('afterFind', 'UserTerefikHook.filth')
    this.addHook('afterFetch', 'UserTerefikHook.filth')
  }

  static get table () {
    return 'user_terefik'
  }
}

module.exports = UserTerefik
