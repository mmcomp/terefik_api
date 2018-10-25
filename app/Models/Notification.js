'use strict'

const Model = use('Model')
const axios = require('axios')
const Env = use('Env')

class Notification extends Model {
  static boot () {
    super.boot()

    this.addHook('afterCreate', 'NotificationHook.send')
  }

  static get table () {
    return 'notifications'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }
}

module.exports = Notification
