'use strict'

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const Validations = use('App/Libs/Validations')

const UserFindableGift = use('App/Models/UserFindableGift')

class FindableGiftController {
  static async list(params, user) {
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
