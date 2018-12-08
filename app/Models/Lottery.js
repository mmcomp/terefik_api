'use strict'

const Model = use('Model')

class Lottery extends Model {
  static get table () {
    return 'lottery'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }

  awards () {
    return this.hasMany('App/Models/LotteryAward', 'id', 'lottery_id')
  }
}

module.exports = Lottery
