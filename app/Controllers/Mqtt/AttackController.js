'use strict'

const User = use('App/Models/User')
const Property = use('App/Models/Property')
const UserTerefik = use('App/Models/UserTerefik')
const Message = use('App/Models/Message')
const Setting = use('App/Models/Setting')
const GameSession = use('App/Models/GameSession')
const Log = use('App/Models/Log')

const Redis = use('Redis')
const Randomatic = require('randomatic')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()
const Messages = use('App/Libs/Messages/Messages')
const Validations = use('App/Libs/Validations')
const _ = require('lodash')
const Env = use('Env')
const hasha = require('hasha')
const md5 = require('md5');

class AttackController {
  static async find (params, user) {
    let settings = await Setting.get()

    let lastTarget = (params && params.id)?params.id:-1
    if(!params || !params.terefiki_id) {
      return [{
        status: 0,
        messages: [{
          code: "TerefikieNeeded",
          message: "ترفیکی می بایست معرفی شود"
        }],
        data: {
          attack_cost: settings.attack_gasoline,
          change_cost: settings.attack_change_gasoline
        }
      }]
    }
    let theTrefiki = await UserTerefik.query().where('id', params.terefiki_id).where('user_id', user.id).first()
    if(!theTrefiki) {
      return [{
        status: 0,
        messages: [{
          code: "TerefikieNotFound",
          message: "ترفیکی مورد نظر پیدا نشد"
        }],
        data: {
          attack_cost: settings.attack_gasoline,
          change_cost: settings.attack_change_gasoline
        }
      }]
    }

    await user.loadMany(['property'])
    let userData = user.toJSON()

    let neededGasoline = (_.has(params, 'change') && params.change===true)?settings.attack_change_gasoline/100:settings.attack_gasoline/100
    console.log('User Tank:', userData.property.gasoline)
    console.log('Terefiki Gasoline:', theTrefiki.gasoline)
    console.log('Needed Gasoline:', neededGasoline)
    if(neededGasoline > userData.property.gasoline + theTrefiki.gasoline) {
      return [{
        status: 0,
        messages: [{
          code: "GasolineNotEnough",
          message: "بنزین شما برای جستجو کافی نیست"
        }],
        data: {
          attack_cost: settings.attack_gasoline,
          change_cost: settings.attack_change_gasoline
        }
      }]
    }

    const log = new Log()
    log.type = 'attack_find'
    log.user_id = user.id
    log.before_state = JSON.stringify({
      gasoline: theTrefiki.gasoline
    })

    let useTank = false

    if(theTrefiki.gasoline < neededGasoline) {
      let buckRemain = Math.min(1 - theTrefiki.gasoline, userData.property.gasoline)
      console.log('Using Tank', buckRemain)
      
      await user.property().update({
        gasoline: userData.property.gasoline - buckRemain
      })

      userData.property.gasoline -= buckRemain

      theTrefiki.gasoline += buckRemain
      await theTrefiki.save()
      console.log('Now User Tank:', userData.property.gasoline)
      console.log('Now Terefiki Gasoline:', theTrefiki.gasoline)
      useTank = true
    }

    let NotShields = await User.query().where('is_sheild', 0).pluck('id')
    
    let target = await Property.query().whereNot('user_id', user.id).whereNot('user_id', lastTarget)
      .where(function () {
        this.whereBetween('experience_score', [userData.property.experience_score - 30, userData.property.experience_score + 30])
        .orWhereBetween('experience_score', [userData.property.experience_score - 70, userData.property.experience_score + 70])
        .orWhereBetween('experience_score', [userData.property.experience_score - 100, userData.property.experience_score + 100])
        .orWhereBetween('experience_score', [userData.property.experience_score - 100000, userData.property.experience_score + 100000])
      })
      .whereIn('user_id', NotShields)
      .orderByRaw('RAND()').with('user').first()
    
    if (!target) {
      return [{
        status: 0,
        messages: Messages.parse(['TargetNotFound']),
        data: {
          attack_cost: settings.attack_gasoline,
          change_cost: settings.attack_change_gasoline
        }
      }]
    }

    let currentUserGasoline = theTrefiki.gasoline//userData.property.gasoline


    if (_.has(params, 'change') && params.change===true) {
      currentUserGasoline -= settings.attack_change_gasoline/100
    } else {
      currentUserGasoline -= settings.attack_gasoline/100
    }

    theTrefiki.gasoline = currentUserGasoline
    await theTrefiki.save()

    log.after_state = JSON.stringify({
      gasoline: currentUserGasoline
    })

    let targetData = target.toJSON()
    log.type_id = targetData.user.id

    await log.save()



    try{
      targetData.path = JSON.parse(targetData.property.path)
    }catch(e){
      targetData.path = []
    }

    let data = {
      id: targetData.user.id,
      nickname: targetData.user.fname + ' ' + targetData.user.lname,
      image_path: targetData.user.image_path,
      traps: targetData.path.length,
      attack_cost: settings.attack_gasoline,
      change_cost: settings.attack_change_gasoline,
      used_tank: useTank,
      terefiki_gasoline: theTrefiki.gasoline,
      user_gasoline: userData.property.gasoline
    }

    // Gasoline
    data['gasoline'] = _.min([
      (settings.loot_gasoline/100) * targetData.gasoline,
      targetData.gasoline >= (settings.loot_gasoline_max/100) ? (settings.loot_gasoline_max/100) : targetData.gasoline
    ])

    // Health
    data['health'] = _.min([
      (settings.loot_health/100) * targetData.health,
      targetData.health >= (settings.loot_health_max/100) ? (settings.loot_health_max/100) : targetData.health
    ])

    // Clean
    data['clean'] = _.min([
      (settings.loot_clean/100) * targetData.clean,
      targetData.clean >= (settings.loot_clean_max/100) ? (settings.loot_clean_max/100) : targetData.clean
    ])

    return [{
      status: 1,
      messages: [],
      data: data
    }]
  }

  static async attack (params, user) {
    await user.loadMany(['property'])
    let userData = user.toJSON()
    let settings = await Setting.get()

    const rules = {
      id: 'required',
      terefiki_id: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }
    let userTerefik = await UserTerefik.find(params.terefiki_id)
    if(!userTerefik) {
      return [{
        status: 0,
        messages: [{
          code: "TerefikiNotFound",
          message: "ترفیکی مورد نظر پیدا نشد"
        }],
        data: {}
      }]
    }
    console.log('Flithing')
    await userTerefik.filthy(settings.attack_start_clean_lose)
    
    const target = await User.query().where('id', params.id)
    .where('is_sheild', 0)
    .with('property').first()

    if (!target) {
      return [{
        status: 0,
        messages: Messages.parse(['UserNotFound']),
        data: {}
      }]
    }



    let targetData = target.toJSON()
    let stageKey = Randomatic('Aa', 30)
    stageKey = 'attack_' + stageKey

    let session = new GameSession()
    session.user_id = user.id
    session.type = 'attack'
    session.user_defence = targetData.id
    session.depo_type = 'none'
    session.session_id = stageKey
    await session.save()

    await Redis.select(1)
    await Redis.hmset(stageKey, [
      'user',
      user.id
    ])
    await Redis.expire(stageKey, 120)

    target.under_attack = 'yes'
    await target.save()

    try{
      targetData.property.path = JSON.parse(targetData.property.path)
    }catch(e) {
      targetData.property.path = []
    }

    return [{
      status: 1,
      messages: [],
      data: {
        id: targetData.id,
        session: stageKey,
        path: targetData.property.path,
        reattack_cost: settings.reattack_cost,
        //,
        // user: {
        //   id: targetData.id,
        //   name: targetData.fname + ' ' + targetData.lname,
        //   image_path: targetData.image_path
        // }
      }
    }]
  }

  static async reattack (params, user) {
    let userProp = await Property.query().where('user_id', user.id).first()
    if(!userProp) {
      return [{
        status: 0,
        messages: Messages.parse(['UserNotFound']),
        data: {}
      }]
    }

    let settings = await Setting.get()
    if(userProp.bronze_coin<settings.reattack_cost) {
      return [{
        status: 0,
        messages: [{
          code: "NotEnoughBronze",
          message: "سکه برنز شما برای حمله مجدد کافی نیست",
        }],
        data: {}
      }]
    }
    userProp.bronze_coin -= settings.reattack_cost
    await userProp.save()

    let attackResult = await AttackController.attack(params, user)
    return attackResult
  }

  static async finish (params, user) {
    const rules = {
      session: 'required',
      hash: 'required',
      stars: 'required'
    }

    let settings = await Setting.get()
    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    await user.loadMany(['property'])
    let userData = user.toJSON()

    let gameSession = await GameSession.query().where('user_id', user.id).where('session_id', params.session).where('type', 'attack').first()
    if (!gameSession) {
      gameSession = await GameSession.query().where('user_id', user.id).where('session_id', params.session).where('type', 'revenge').first()
      if(!gameSession){
        return [{
          status: 0,
          messages: Messages.parse(['GameNotFound']),
          data: {}
        }]
      }
    }

    const userDefence = await User.query().where('id', gameSession.user_defence).with('property').first()
    let userDefenceData = userDefence.toJSON()
    // let userDefenceRadeSucceed = userDefenceData.property.rade_succeed

    const winHash = hasha('win' + Env.get('ATTACK_SESSION') + params.session, {
      algorithm: 'sha256'
    })

    console.log('Win hash :')
    console.log(winHash)

    // const winHash = hasha('win' + Env.get('ATTACK_SESSION') + params.session + '|' + params.session + '|' + userDefenceData.property.path, {
    //   algorithm: 'sha256'
    // })

    await Redis.select(1)
    await Redis.del(gameSession.session_id)

    let award = {
      gasoline: 0,
      health_oil: 0,
      cleaning_soap: 0
    }

    if (winHash.toUpperCase() != params.hash) {
      if(user.experience_score > 0){
        user.experience_score--
        await user.save()
      }

      award['win'] = false
      award['revenge'] = gameSession.type != 'attack'

      await Message.create({
        user_id: userDefence.id,
        sender_id: user.id,
        type: gameSession.type,//'attack',
        status: 'unread',
        sticker_id: -1,
        message: JSON.stringify(award)
      })

      // userDefence.under_attack = 'no'
      // await userDefence.save()

      console.log('Loose User')
      return [{
        status: 1,
        messages: [],
        data: {
        }
      }]
    }



    // Energy Yellow
    award['gasoline'] = _.min([
      _.round((settings.loot_gasoline/100) * userDefenceData.property.gasoline),
      userDefenceData.property.gasoline >= settings.loot_gasoline_max ? settings.loot_gasoline_max : userDefenceData.property.gasoline
    ])

    // Energy Blue
    award['health_oil'] = _.min([
      _.round((settings.loot_health/100) * userDefenceData.property.health_oil),
      userDefenceData.property.health_oil >= settings.loot_health_max ? settings.loot_health_max : userDefenceData.property.health_oil
    ])

    // Elixir
    award['cleaning_soap'] = _.min([
      _.round((settings.loot_cleaning/100) * userDefenceData.property.cleaning_soap),
      userDefenceData.property.cleaning_soap >= settings.loot_cleaning_max ? settings.loot_cleaning_max : userDefenceData.property.cleaning_soap
    ])


    await userDefence.property().update({
      gasoline: userDefenceData.property.gasoline - award.gasoline > 0 ? userDefenceData.property.gasoline - award.gasoline : 0,
      health_oil: userDefenceData.property.health_oil - award.health_oil > 0 ? userDefenceData.property.health_oil - award.health_oil : 0,
      cleaning_soap: userDefenceData.property.cleaning_soap - award.cleaning_soap > 0 ? userDefenceData.property.cleaning_soap - award.cleaning_soap : 0
    })

    // userDefence.under_attack = 'no'
    // await userDefence.save()

    await user.property().update({
      gasoline: userData.property.gasoline + award.gasoline,
      health_oil: userData.property.health_oil + award.health_oil,
      cleaning_soap: userData.property.cleaning_soap + award.cleaning_soap,
      experience_score: userDefenceData.property.experience_score + settings.attack_score,
      stars : userDefenceData.property.stars + params.stars
    })

    // Messages

    award['win'] = true
    award['revenge'] = gameSession.type != 'attack'
    await Message.create({
      user_id: userDefence.id,
      sender_id: user.id,
      type: gameSession.type,//'attack',
      sticker_id: 0,
      session: params.session,
      status: 'unread',
      message: JSON.stringify(award)
    })

    
    award['score'] = settings.attack_score

    award['id'] = userDefence.id
    award['nickname'] = userDefence.fname + ' ' + userDefence.lname
    award['image_path'] = userDefence.image_path

    await gameSession.delete()

    console.log('Win User')
    return [{
      status: 1,
      messages: [],
      data: award
    }]
  }

  static async refuel (params, user) {
    const rules = {
      terefiki_id: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let userTerefik = await UserTerefik.find(params.terefiki_id)
    if(!userTerefik) {
      return [{
        status: 0,
        messages: [{
          code: "TerefikiNotFound",
          message: "ترفیکی مورد نظر پیدا نشد"
        }],
        data: {}
      }]
    }

    let neededGasoline = (userTerefik.gasoline >= 1)?0:(1 - userTerefik.gasoline)

    if(neededGasoline==0) {
      if(userTerefik.gasoline > 1) {
        userTerefik.gasoline = 1
        await userTerefik.save()
      }
      return [{
        status: 0,
        messages: [{
          code: "AlreadyFilled",
          message: "باک ترفیکی مورد نظر پر می باشد"
        }],
        data: {}
      }]
    }

    let userProperty = await Property.query().where('user_id', user.id).first()
    if(!userProperty) {
      return [{
        status: 0,
        messages: [{
          code: "UserNotFound",
          message: "کاربر مورد نظر پیدا نشد"
        }],
        data: {}
      }]
    }

    let toUse = Math.min(userProperty.gasoline, neededGasoline)
    userProperty.gasoline -= toUse
    await userProperty.save()

    userTerefik.gasoline += toUse
    await userTerefik.save()

    return [{
      status: 1,
      messages: [],
      data: {
        fueled_amount: toUse
      }
    }]
  }

  static async list (params, user) {
    let messages = await Message.query().where('user_id', user.id).with('user').whereIn('type', ['attack', 'revenge']).orderBy('created_at', 'desc').limit(20).fetch()
    messages = messages.toJSON()

    let lastAct
    for(let i = 0;i < messages.length;i++) {
      try{
        messages[i].message = JSON.parse(messages[i].message)
        messages[i].message.gasoline = messages[i].message.gasoline/100
        messages[i].message.health_oil = messages[i].message.health_oil/100
        messages[i].message.cleaning_soap = messages[i].message.cleaning_soap/100
      }catch(e) {
        messages[i].message = {
          gasoline: 0,
          health_oil: 0,
          cleaning_soap : 0,
          win: false,
          revenge: false,
        }
      }

      lastAct = 0
      if(messages[i].user) {
        lastAct = Time().diff(messages[i].user.last_activity, 'minutes')
      }

      messages[i]['is_online'] = (lastAct<=5)
    }

    return [{
      status: 1,
      messages: [],
      data: {
        messages: messages
      }
    }]
  }
}

module.exports = AttackController
