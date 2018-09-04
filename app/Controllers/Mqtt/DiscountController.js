'use strict'

const UserTerefik = use('App/Models/UserTerefik')

const Setting = use('App/Models/Setting')

class DiscountController {
  static async get(params, user) {
    let discount = 0
    let settings = await Setting.get()
    let userDiscounter = await UserTerefik.query().where('user_id', user.id).where('ttype', 'discounter').first()

    if(!userDiscounter) {
      return [{
        status: 0,
        messages: [{
          code: "NoDiscounter",
          message: "ترفیکی تخفیف گر پیدا نشد"
        }],
        data: {}
      }]
    }

    discount = settings.discounter_health_weight * userDiscounter.health + settings.discounter_clean_weight * userDiscounter.clean + settings.discounter_gasoline_weight * userDiscounter.gasoline
    discount = discount * settings.discounter_max_discount / 100

    return [{
      status: 1,
      messages: [],
      data: {
        discount : parseInt(discount, 10)
      }
    }]
  }

}

module.exports = DiscountController
