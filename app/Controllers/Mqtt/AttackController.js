'use strict'

const User = use('App/Models/User')
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
    let lastTarget = (params && params.id)?params.id:-1

    await user.loadMany(['property'])
    let userData = user.toJSON()
    let settings = await Setting.get()

    if ((_.has(params, 'change') && params.change===true && userData.property.gasoline < settings.attack_change_gasoline) ||
      ((!_.has(params, 'change') || (_.has(params, 'change') && params.change===false)) && userData.property.gasoline < settings.attack_gasoline)) {
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

    
    let target = await User.query().whereNot('id', user.id).whereNot('id', lastTarget)
    /*
      .where(function () {
        this.whereBetween('courage_stat', [userData.courage_stat - 30, userData.courage_stat + 30])
        .orWhereBetween('courage_stat', [userData.courage_stat - 70, userData.courage_stat + 70])
        .orWhereBetween('courage_stat', [userData.courage_stat - 100, userData.courage_stat + 100])
        .orWhereBetween('courage_stat', [userData.courage_stat - 100000, userData.courage_stat + 100000])
      })
      */
      .where('is_sheild', 0)
      .orderByRaw('RAND()').with('property').first()
    
    if (!target) {
      return [{
        status: 0,
        messages: Messages.parse(['TargetNotFound']),
        data: {
          attack_cost: settings.attack_ye,
          change_cost: settings.attack_change_ye
        }
      }]
    }

    let currentUserGasoline = userData.property.gasoline

    const log = new Log()
    log.type = 'attack_find'
    log.type_id = target.id
    log.user_id = user.id
    log.before_state = JSON.stringify({
      gasoline: userData.property.gasoline
    })

    if (_.has(params, 'change') && params.change===true) {
      currentUserGasoline -= settings.attack_change_gasoline
      await user.property().update({
        gasoline: userData.property.gasoline - settings.attack_change_gasoline
      })
    } else {
      currentUserGasoline -= settings.attack_gasoline
      await user.property().update({
        gasoline: userData.property.gasoline - settings.attack_gasoline
      })
    }

    log.after_state = JSON.stringify({
      gasoline: currentUserGasoline
    })
    await log.save()

    let targetData = target.toJSON()

    try{
      targetData.property.path = JSON.parse(targetData.property.path)
    }catch(e){
      targetData.property.path = []
    }

    let data = {
      id: targetData.id,
      nickname: targetData.fname + ' ' + targetData.lname,
      image_path: targetData.image_path,
      traps: targetData.property.path.length,
      attack_cost: settings.attack_gasoline,
      change_cost: settings.attack_change_gasoline,
      my_gasoline: currentUserGasoline
    }

    // Gasoline
    data['gasoline'] = _.min([
      _.round((settings.loot_gasoline/100) * targetData.property.gasoline),
      targetData.property.gasoline >= settings.loot_gasoline_max ? settings.loot_gasoline_max : targetData.property.gasoline
    ])

    // Health
    data['health'] = _.min([
      _.round((settings.loot_health/100) * targetData.property.health),
      targetData.property.health >= settings.loot_health_max ? settings.loot_health_max : targetData.property.health
    ])

    // Clean
    data['clean'] = _.min([
      _.round((settings.loot_clean/100) * targetData.property.clean),
      targetData.property.clean >= settings.loot_clean_max ? settings.loot_clean_max : targetData.property.clean
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
        session: stageKey,
        path: targetData.property.path,
        user: {
          id: targetData.id,
          name: targetData.fname + ' ' + targetData.lname,
          image_path: targetData.image_path
        }
      }
    }]
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
    let userDefenceRadeSucceed = userDefenceData.property.rade_succeed

    const winHash = hasha('win' + Env.get('ATTACK_SESSION') + params.session, {
      algorithm: 'sha256'
    })

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

      userDefence.under_attack = 'no'
      await userDefence.save()

      return [{
        status: 0,
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

    userDefence.under_attack = 'no'
    await userDefence.save()

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

    return [{
      status: 1,
      messages: [],
      data: award
    }]
  }

  static async cancel (params, user) {
    const rules = {
      session: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let gameSession = await GameSession.query().where('type', 'attack').where('user_id', user.id).where('session_id', params.session).first()
    if (!gameSession) {
      return [{
        status: 0,
        messages: Messages.parse(['GameNotFound']),
        data: {}
      }]
    }

    await User.query().where('id', gameSession.user_defence).update({
      under_attack: 'no'
    })

    await gameSession.delete()

    user.game_lose++
    user.courage('sub', 1)
    await user.save()

    return [{
      status: 1,
      messages: [],
      data: {}
    }]
  }

  static async revenge (params, user) {
    const rules = {
      id: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let message = await Message.query().where('type', 'attack').where('id', params.id).where('user_id', user.id).first()

    if (!message) {
      return [{
        status: 0,
        messages: Messages.parse(['TargetNotFound']),
        data: {}
      }]
    }

    const settings = await Setting.get()
    const target = await User.query().where('id', message.sender_id)
    .with('property').with('antiques').with('antiques.antique').first()

    if (!target) {
      return [{
        status: 0,
        messages: Messages.parse(['UserNotFound']),
        data: {}
      }]
    }
    let targetData = target.toJSON()
    let shield = 0

    if (targetData.shield_at && Time(targetData.shield_at).diff(Time().format('YYYY-M-D HH:mm:ss'), 'seconds') > 0) {
      shield = Time(targetData.shield_at).diff(Time().format('YYYY-M-D HH:mm:ss'), 'seconds')
    }

    if (shield) {
      return [{
        status: 0,
        message: Messages.parse(['UnderSheild']),
        data: {}
      }]
    }

    if (targetData.under_attack == 'yes') {
      return [{
        status: 0,
        message: Messages.parse(['UnderAttack']),
        data: {}
      }]
    }

    let stageKey = Randomatic('Aa', 30)
    stageKey = 'attack_' + stageKey

    let session = new GameSession()
    session.user_id = user.id
    session.type = 'revenge'
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
    await message.delete()

    target.under_attack = 'yes'
    await target.save()

    var ts = stageKey;//Math.round((new Date()).getTime() / 1000);
    let encryptedPath = hasha(ts + '|' + targetData.property.path + '|' + md5(ts + '|' + targetData.property.path), {
      algorithm: 'sha256'
    }).toUpperCase()

    return [{
      status: 1,
      messages: [],
      data: {
        session: stageKey,
        path: JSON.parse(targetData.property.path),
        // path: encryptedPath,
        user: {
          id: targetData.id,
          nickname: targetData.nickname,
          avatar: targetData.avatar
        }
      }
    }]
  }

  static async sticker (params, user) {
    const rules = {
      session: 'required',
      sticker: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    let message = await Message.query().where('type', 'attack').where('sender_id', user.id).where('sticker_id', 0).where('session', params.session).first()
    if (!message) {
      return [{
        status: 0,
        message: Messages.parse(['GameNotFound']),
        data: {}
      }]
    }

    message.sticker_id = params.sticker
    await message.save()

    return [{
      status: 1,
      messages: [],
      data: {}
    }]
  }
}

module.exports = AttackController
