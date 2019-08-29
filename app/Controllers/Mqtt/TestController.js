'use strict'

const Gamification = use('App/Models/Gamification')
const Validations = use('App/Libs/Validations')

class TestController {
  static async test (params, user) {
    console.log('Test')
    const rules1 = {
      car_id: 'required',
    }

    let check = await Validations.check(params, rules1)
    console.log('Validation Result', check)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }
    // let gamification = new Gamification
    // let response = await gamification.login()
    // console.log('Login Gamification Response')
    // console.log(response)
    // console.log('Gamification Object token')
    // console.log(gamification.token)
    // let response = await gamification.changeCoin('09155193104', -1)
    // console.log(response)

    return [{
      status: 1,
      messages: [],
      data: {
      }
    }]
  }
}

module.exports = TestController
