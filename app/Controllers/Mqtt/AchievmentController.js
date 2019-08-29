'use strict'

const Log = use('App/Models/Log')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()
const Achievment = use('App/Models/Achievment')
const Property = use('App/Models/Property')
const UserAchievment = use('App/Models/UserAchievment')

const Env = use('Env')
const Validations = use('App/Libs/Validations')
const _ = require('lodash')

class AchievmentController {
  static async list (params, user) {
    try{
      let allAchievments = {}
      let allTagNames 
      if(user.is_parking_ranger==4){
        allTagNames = await Achievment.query().groupBy('tag').pluck('tag')
      }else {
        allTagNames = await Achievment.query().whereNot('action_type', 'ranger').groupBy('tag').pluck('tag')
      }
      let tagIds = {}, tmpAchiemnets, userAchiements, foundAchievments
      for(let tag of allTagNames) {
        tmpAchiemnets = await Achievment.query().where('tag', tag).orderBy('level').pluck('id')
        tagIds[tag] = tmpAchiemnets
        userAchiements = await UserAchievment.query().with('achievment').whereIn('achievments_id', tmpAchiemnets).where('users_id', user.id).orderBy('collected', 'desc').fetch()
        userAchiements = userAchiements.toJSON()
        foundAchievments = []
        for(let uAch of userAchiements) {
          foundAchievments.push(uAch.achievment.id)
          if(!allAchievments[tag]) {
            allAchievments[tag] = []
          }
          allAchievments[tag].push({
            id: uAch.achievment.id,
            title: uAch.achievment.title,
            action: uAch.achievment.action,
            achieved: uAch.achieved,
            total: uAch.achievment.total,
            collected: uAch.collected,
            prize: uAch.achievment.price,
            prize_type: uAch.achievment.price_type,
            level: uAch.achievment.level,
          })
        }
        tmpAchiemnets = await Achievment.query().where('tag', tag).whereNotIn('id', foundAchievments).orderBy('level').first()
        if(tmpAchiemnets) {
          if(!allAchievments[tag]) {
            allAchievments[tag] = []
          }
          allAchievments[tag].push({
            id: tmpAchiemnets.id,
            title: tmpAchiemnets.title,
            action: tmpAchiemnets.action,
            achieved: 0,
            total: tmpAchiemnets.total,
            collected: 0,
            prize: tmpAchiemnets.price,
            prize_type: tmpAchiemnets.price_type,
            level: tmpAchiemnets.level,
          })
        }
      }
      // console.log('Tag Ids', tagIds)

      /*
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
          openAch.collected = 0
          openAch.achieved = 0
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
      */
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

    let userAchiement = await UserAchievment.query().with('achievment').where('achievments_id', params.achievment_id).where('users_id', user.id).where('collected', 0).first()
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

    let property = await Property.query().where('user_id', user.id).first()
    if(property) {
      property[userAchiementData.achievment.price_type] += userAchiementData.achievment.price
      await property.save()
    }

    return [{
      status: 1,
      messages: [],
      data: {}
    }]
  }
}

module.exports = AchievmentController
