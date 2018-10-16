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
    subGames = subGames.toJSON()
    for(let i = 0;i < subGames.length;i++) {
      subGames[i].icon_path = Env.get('SITE_URL') + subGames[i].icon_path
      subGames[i].file_path = Env.get('SITE_URL') + subGames[i].file_path
      delete subGames[i].updated_at
      delete subGames[i].created_at
    }
    return [{
      status: 1,
      messages: [],
      data: {
        sub_games: subGames
      }
    }]
  }
}

module.exports = SubGameController
