'use strict'


const Model = use('Model')

class UserLotteryAward extends Model {
  static get table () {
    return 'lottery_user'
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

  lottery () {
    return this.belongsTo('App/Models/Lottery', 'lottery_id', 'id')
  }

  award() {
    return this.belongsTo('App/Models/LotteryAward', 'lottery_award_id', 'id')
  }
}

module.exports = UserLotteryAward
