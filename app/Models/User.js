'use strict'

const Model = use('Model')
const Property = use('App/Models/Property')
const Setting = use('App/Models/Setting')
const UserTerefik = use('App/Models/UserTerefik')

const Randomatic = require('randomatic')
const Logger = use('Logger')

class User extends Model {

  static get table () {
    return 'users'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }

  // Relations
  cars() {
    return this.manyThrough('App/Models/UserCar', 'cars')
  }

  car() {
    return this.hasMany('App/Models/UserCar', 'id', 'user_id')
  }

  terefik() {
    return this.hasMany('App/Models/UserTerefik', 'id', 'user_id')
  }

  property () {
    return this.hasOne('App/Models/Property', 'id', 'user_id')
  }

  // transactions () {
  //   return this.hasMany('App/Models/Transaction', 'id', 'user_id')
  // }

  // sms () {
  //   return this.hasMany('App/Models/UserSms', 'id', 'user_id')
  // }

  static getToken () {
    return Randomatic('Aa0', 15)
  }

  async rank (type) {
    let count = await User.query().where(type, '>=', this[type]).where('id', '!=', this.id).count()
    let rank = count[0]['count(*)']
    return rank++
  }

  async register () {
    try {
      const setting = await Setting.get()

      await this.save()
      let property = new Property
      
      property.user_id = this.id
      property.gasoline = setting.intial_gasoline
      property.health_oil = setting.intial_health_oil
      property.cleaning_soap = setting.intial_cleaning_soap
      property.bronze_coin = setting.intial_bronze_coin
      property.silver_coin = setting.intial_silver_coin
      property.diamond = setting.intial_diamond

      await property.save()

      let userTerefik, terefikis = ['discounter', 'reserver', 'notifier']
      for(let ttype of terefikis) {
        userTerefik = new UserTerefik
        userTerefik.ttype = ttype
        userTerefik.user_id = this.id
        userTerefik.gasoline = setting.intial_terefiki_gasoline
        userTerefik.health = setting.intial_terefiki_health
        userTerefik.clean = setting.intial_terefiki_clean
        await userTerefik.save()
      }
    } catch (error) {
      Logger.error(error)
    }
  }
}

module.exports = User
