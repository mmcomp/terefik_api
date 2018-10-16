'use strict'

const Code = use('App/Models/Code')
const Transaction = use('App/Models/Transaction')
const SubGame = use('App/Models/SubGame')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const Env = use('Env')
const Validations = use('App/Libs/Validations')
const _ = require('lodash')

class SubGameController {
  static async index (params, user) {
    let subGames = await SubGame.all()

    return [{
      status: 1,
      messages: [],
      data: {
        sub_games: subGames.toJSON()
      }
    }]
  }
}

module.exports = SubGameController
