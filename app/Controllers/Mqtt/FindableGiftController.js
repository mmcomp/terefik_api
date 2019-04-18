'use strict'

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const Validations = use('App/Libs/Validations')

const UserFindableGift = use('App/Models/UserFindableGift')

class FindableGiftController {
  static async list(params, user) {
    let currentHour = parseInt(Time().format('HH'), 10)
    
    if(currentHour<=settings.time_limit_end && currentHour>=settings.time_limit_start) {
      return [{
        status: 0,
        messages: [{
          code: 'InTheWorkingHours',
          message: 'خارج از محدوده زمانی فعالیت امکان مشاهده جوایز را دارید'
        }],
        data: {}
      }]
    }

    let userFindableGift = await UserFindableGift.query().with('gift').where('user_id', user.id).fetch()

    return [{
      status: 1,
      messages: [],
      data: {
        user_findable_gifts: userFindableGift.toJSON(),
      }
    }]
  }
}

module.exports = FindableGiftController
