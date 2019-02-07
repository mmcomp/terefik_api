'use strict'

const Log = use('App/Models/Log')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()
const Achievment = use('App/Models/Achievment')
const UserAchievment = use('App/Models/UserAchievment')

const Env = use('Env')
const Validations = use('App/Libs/Validations')
const _ = require('lodash')

class AchievmentController {
  static async list (params, user) {
    try{
      let userAchiements = await UserAchievment.query().with('achievment').where('users_id', user.id).fetch()
      userAchiements = userAchiements.toJSON()
      console.log('User Achievments')
      console.log(userAchiements)
      let uAchs = []
      let achTags = []
      for(let userAchievment of userAchiements) {
        uAchs.push(userAchievment.achievments_id)
        if(userAchievment.achievment && userAchievment.achievment.tag && achTags.indexOf(userAchievment.achievment.tag)<0) {
          achTags.push(userAchievment.achievment.tag)
        }
      }
      console.log('User Achiement IDS', uAchs)
      console.log('User Achievment Tags', achTags)
      let openAchs = await Achievment.query().whereNotIn('id', uAchs).whereNotIn('tag', achTags).orderBy('level').fetch()
      openAchs = openAchs.toJSON()
      let allAchievments = {}
      for(let openAch of openAchs) {
        openAch.collected = 0
        openAch.achieved = 0
        if(allAchievments[openAch.tag]) {
          // Nothing
        }else {
          if(openAch.tag) {
            allAchievments[openAch.tag] = []
            allAchievments[openAch.tag].push(openAch)
          }else{
            if(!allAchievments['notag']) {
              allAchievments['notag'] = []
            }
            allAchievments.notag.push(openAch)
          }
        }
      }
      let tmpAch, openAch
      for(let uAch of uAchs) {
        tmpAch = await UserAchievment.query().with('achievment').where('users_id', user.id).where('achievments_id', uAch).first()
        tmpAch = tmpAch.toJSON()
        openAch = tmpAch.achievment
        openAch.collected = tmpAch.collected
        openAch.achieved = tmpAch.achieved
        if(tmpAch.collected==1) {
          openAch = await Achievment.query().where('tag', openAch.tag).where('level', '>', openAch.level).first()
        }
        if(openAch) {
          if(allAchievments[openAch.tag]) {
            allAchievments[openAch.tag].push(openAch)
          }else {
            if(openAch.tag) {
              allAchievments[openAch.tag] = []
              allAchievments[openAch.tag].push(openAch)
            }else{
              if(!allAchievments['notag']) {
                allAchievments['notag'] = []
              }
              allAchievments.notag.push(openAch)
            }
          }
        }
      }

      return [{
        status: 1,
        messages: [],
        data: {
          achiements: allAchievments
        }
      }]
    }catch(e) {
      console.log(e)
      return [{
        status: 0,
        messages: [],
        data: {
        }
      }]
    }
  }

  static async collect (params, user) {
    const rules = {
      achievment_id: 'required|integer'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let userAchiement = await UserAchievment.query().with('achievment').where('achievments_id', params.achievment_id).where('users_id', user.id).first()
    if(!userAchiement) {
      return [{
        status: 0,
        messages: [{
          code: "NotInAchievment",
          message: "شما در این دستاورد پیشرفتی نداشته اید",
        }],
        data: {}
      }]
    }
    let userAchiementData = userAchiement.toJSON()
    // console.log('User Achievment Data', userAchiementData)
    if(userAchiementData.achieved < userAchiementData.achievment.total) {
      return [{
        status: 0,
        messages: [{
          code: "NotEnoughAchievment",
          message: "شما در این دستاورد پیشرفت کافی نداشته اید",
        }],
        data: {}
      }]
    }

    userAchiement.collected = 1
    await userAchiement.save()

    return [{
      status: 1,
      messages: [],
      data: {}
    }]
  }
}

module.exports = AchievmentController
