'use strict'

const SubGame = use('App/Models/SubGame')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const Env = use('Env')
const Database  = use('Database')

class SubGameController {
  static async index (params, user) {
    try{
      let subGames = await SubGame.all(), tmp, selectedIndex, subGameNames = []
      let subGamesData = subGames.toJSON()
      subGames = []

      for(let i = 0;i < subGamesData.length;i++) {
        tmp = subGamesData[i]
        selectedIndex = subGameNames.indexOf(tmp.name)
        if(selectedIndex<0) {
          subGameNames.push(tmp.name)
          subGames.push({
            id: tmp.id,
            name: tmp.name,
            version: tmp.version,
            description: tmp.description,
            file_path: Env.get('SITE_URL') + tmp.file_path,
            icon_path: Env.get('SITE_URL') + tmp.icon_path
          })
        }else {
          if(subGames[selectedIndex].version < tmp.version) {
            subGames[selectedIndex] =  {
              id: tmp.id,
              name: tmp.name,
              version: tmp.version,
              description: tmp.description,
              file_path: Env.get('SITE_URL') + tmp.file_path,
              icon_path: Env.get('SITE_URL') + tmp.icon_path
            }
          }
        }
      }
      return [{
        status: 1,
        messages: [],
        data: {
          sub_games: subGames
        }
      }]
    }catch(e) {
      return [{
        status: 0,
        messages: [],
        data: {
        }
      }]
    }
  }
}

module.exports = SubGameController
