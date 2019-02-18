'use strict'

const Gamification = use('App/Models/Gamification')

class TestController {
  static async test (params, user) {
    console.log('Test')
    let gamification = new Gamification
    // let response = await gamification.login()
    // console.log('Login Gamification Response')
    // console.log(response)
    // console.log('Gamification Object token')
    // console.log(gamification.token)
    let response = await gamification.changeCoin('09155193104', -1)
    console.log(response)

    return [{
      status: 1,
      messages: [],
      data: {
      }
    }]
  }
}

module.exports = TestController
