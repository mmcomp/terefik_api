'use strict'

const Model = use('Model')

class LotteryAward extends Model {
  static get table () {
    return 'lottery_award'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }
}

module.exports = LotteryAward
