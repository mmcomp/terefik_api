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

  static async sendSms (mobile, message) {
    console.log('URL', 'https://api.kavenegar.com/v1/' + Env.get('SMS_KAVENEGAR_API_KEY') + '/sms/send.json?receptor=' + mobile.replace('+98','0')
    + '&message=' + encodeURIComponent(message) + '&')
    let response
    try{
      response = await axios({
        method: 'get',
        url: 'https://api.kavenegar.com/v1/' + Env.get('SMS_KAVENEGAR_API_KEY') + '/sms/send.json?receptor=' + mobile.replace('+98','0')
        + '&message=' + encodeURIComponent(message) + '&',
      })
      console.log('SMS OK', response.data)
    }catch(e){  
      console.log('SMS NOK', e)
    }
    return response
  }
}

module.exports = Notification
