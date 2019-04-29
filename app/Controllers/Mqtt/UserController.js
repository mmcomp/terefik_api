'use strict'

const Validations = use('App/Libs/Validations')
const Property = use('App/Models/Property')
const InspectorDailyReport = use('App/Models/InspectorDailyReport')
const RangerWork = use('App/Models/RangerWork')
const Setting = use('App/Models/Setting')
const Transaction = use('App/Models/Transaction')
const UserCarwash = use('App/Models/UserCarwash')
const Message = use('App/Models/Message')
const RangerRandomGift = use('App/Models/RangerRandomGift')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

class UserController {
  static async profile (params, user) {
    let settings = await Setting.get()
    await user.loadMany(['property.experience', 'property.inspector', 'terefik', 'traps.trap', 'zones.zone'])
    let userData = user.toJSON()
    let minimum_report = null
    userData['ranger_data'] = null
    if(userData.is_parking_ranger==4) {
      if(userData.zones && userData.zones.length>0) {
        minimum_report = 0;
        for(let uZ of userData.zones) {
          if(uZ.zone) {
            minimum_report += uZ.zone.desired_reports
          }
        }
      }
      
      let totalReport = 0, totalArrest = 0, todaySilverCoin = 0, totalSilverCoin = 0, todayReport = 0, todayArrest = 0
      totalArrest = await RangerWork.query().where('ranger_id', user.id).getCount()
      todaySilverCoin = await RangerWork.query().where('ranger_id', user.id).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').getSum('silver_coin')
      if(!todaySilverCoin) {
        todaySilverCoin = 0
      }
      totalSilverCoin = await RangerWork.query().where('ranger_id', user.id).getSum('silver_coin')
      if(!totalSilverCoin) {
        totalSilverCoin = 0
      }
      totalReport = await InspectorDailyReport.query().where('user_id', user.id).getSum('report_count')
      if(!totalReport) {
        totalReport = 0
      }
      todayArrest = await RangerWork.query().where('ranger_id', user.id).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').getCount()
      todayReport = await InspectorDailyReport.query().where('user_id', user.id).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').getSum('report_count')
      if(!todayReport) {
        todayReport = 0
      }
      
      userData['ranger_data'] = {
        minimum_report: minimum_report,
        ranger_star_change_1: settings.ranger_star_change_1,
        ranger_star_change_2: settings.ranger_star_change_2,
        ranger_star_change_3: settings.ranger_star_change_3,
        total: {
          silver_coin: totalSilverCoin,
          report: totalReport,
          arrest: totalArrest,
        },
        today: {
          silver_coin: todaySilverCoin,
          report: todayReport,
          arrest: todayArrest,
        },
      }
      console.log('Ranger Data')
      console.log(userData.ranger_data)
    }

    let totalPark = await Transaction.query().where('type', 'shield').where('user_id', user.id).getCount()
    let todayPark = await Transaction.query().where('type', 'shield').where('user_id', user.id).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').getCount()
    let totalCarwash = await UserCarwash.query().where('user_id', user.id).getSum('carwash_count')
    if(!totalCarwash) {
      totalCarwash = 0
    }
    let todayCarwash = await UserCarwash.query().where('user_id', user.id).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').getSum('carwash_count')
    if(!todayCarwash) {
      todayCarwash = 0
    }

    let totalAttack = await Message.query().where('sender_id', user.id).whereIn('type', ['attack', 'revenge']).getCount()
    let todayAttack = await Message.query().where('sender_id', user.id).whereIn('type', ['attack', 'revenge']).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').getCount()

    let totalAttacked = await Message.query().where('user_id', user.id).whereIn('type', ['attack', 'revenge']).getCount()
    let todayAttacked = await Message.query().where('user_id', user.id).whereIn('type', ['attack', 'revenge']).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').getCount()
  
    userData['driver_data'] = {
      total: {
        park: totalPark,
        carwash: totalCarwash,
        attack: totalAttack,
        attacked: totalAttacked,
      },
      today: {
        park: todayPark,
        carwash: todayCarwash,
        attack: todayAttack,
        attacked: todayAttacked,
      },
    }
    

    delete userData.zones
    return [{
      status: 1,
      messages: [],
      data: {
        profile: userData
      }
    }]
  }

  static async path (params, user) {
    await user.loadMany(['property'])
    let userData = user.toJSON()
    let path = []
    try{
      path = JSON.parse(userData.property.path)
    }catch(e){

    }

    return [{
      status: 1,
      messages: [],
      data: {
        path: path
      }
    }]
  }

  static async setPath (params, user) {
    const rules = {
      path: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    await user.loadMany(['property'])

    await user.property().update({
      path: JSON.stringify(params.path)
    })

    return [{
      status: 1,
      messages: [],
      data: {
      }
    }]
  }

  static async setUsername (params, user) {
    const rules = {
      username: 'required'
    }

    let check = await Validations.check(params, rules)
    if (check.err) {
      return [{
        status: 0,
        messages: check.messages,
        data: {}
      }]
    }

    // let users = await UserController.query().where('username', username).first()
    // if(users) {
    //   return [{
    //     status: 0,
    //     messages: [{
    //       code: "UsernameTaken",
    //       message: "نام کاربری تکراری می باشد",
    //     }],
    //     data: {
    //     }
    //   }]
    // }

    user.username = username
    await user.save()

    return [{
      status: 1,
      messages: [],
      data: {
      }
    }]
  }

  static async pusheId (params, user) {
    console.log('Pushe id Setting', params)
    try{
      const rules = {
        pushe_id: 'required'
      }
  
      let check = await Validations.check(params, rules)
      if (check.err) {
        return [{
          status: 0,
          messages: check.messages,
          data: {}
        }]
      }

      user.pushe_id = params.pushe_id
      await user.save()

      return [{
        status: 1,
        messages: [],
        data: {}
      }]
    }catch(e) {
      return [{
        status: 0,
        messages: [{
          code: "SystemError",
          message: e.message
        }],
        data: {}
      }]
    }
  }

  static async expLeader (params, user) {
    try{
      let leaderField = 'experience_score'

      let users = await Property.query().with('user').orderBy(leaderField, 'desc').limit(20).fetch()
      users = users.toJSON()
      let leads = {
        tops: [],
        user_position: [],
      }

      let userFound = false
      let indx = 1
      for(let theUser of users) {
        if(theUser.user_id == user.id) {
          userFound = true
        }
        leads.tops.push({
          index: indx,
          image_path: theUser.user.image_path,
          score: theUser.experience_score,
          username: theUser.user.username,
          its_you: (theUser.user_id == user.id),
        })
        indx++
      }

      if(!userFound) {
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
        let userPos = await Property.query().where(leaderField, '>=', userProperty[leaderField]).orderBy(leaderField).getCount()
        let upperUsers = await Property.query().with('user').where('user_id', '!=', user.id).where(leaderField, '>=', userProperty[leaderField]).orderBy(leaderField).limit(5).fetch()
        upperUsers = upperUsers.toJSON()
        let downerUsers = await Property.query().with('user').where('user_id', '!=', user.id).where(leaderField, '<', userProperty[leaderField]).orderBy(leaderField, 'desc').limit(5).fetch()
        downerUsers = downerUsers.toJSON()
        let user_position = [], uppers = [], downers = []
        for(let theUser of upperUsers) {
          uppers.push({
            image_path: theUser.user.image_path,
            score: theUser.experience_score,
            username: theUser.user.username,
            its_you: false,
          })
        }
        for(let theUser of downerUsers) {
          downers.push({
            image_path: theUser.user.image_path,
            score: theUser.experience_score,
            username: theUser.user.username,
            its_you: false,
          })
        }
        for(let i = uppers.length - 1;i>=0;i--) {
          uppers[i]['index'] = userPos - i - 1
          user_position.push(uppers[i])
        }
        user_position.push({
          index: userPos,
          image_path: user.image_path,
          score: userProperty.experience_score,
          username: user.username,
          its_you: true,
        })
        for(let i = 0;i < downers.length;i++) {
          downers[i]['index'] = userPos + i + 1
          user_position.push(downers[i])
        }

        leads.user_position = user_position
      }

      return [{
        status: 1,
        messages: [],
        data: {
          experience_leaders: leads
        }
      }]
    }catch(e){
      console.log('Exp Leader Error', e)
      return [{
        status: 0,
        messages: [{
          code: "UnknowError",
          message: JSON.stringify(e)
        }],
        data: {}
      }]
    }
  }

  static async finLeader (params, user) {
    try{
      let users = await Property.query().with('user').orderBy('finance_score', 'desc').limit(50).fetch()
      users = users.toJSON()
      let leads = []

      for(let theUser of users) {
        leads.push({
          image_path: theUser.user.image_path,
          score: theUser.finance_score,
          username: theUser.user.username,
        })
      }
      return [{
        status: 1,
        messages: [],
        data: {
          finance_leaders: leads
        }
      }]
    }catch(e){
      return [{
        status: 0,
        messages: [{
          code: "UnknowError",
          message: JSON.stringify(e)
        }],
        data: {}
      }]
    }
  }

  static async timLeader (params, user) {
    try{
      let users = await Property.query().with('user').orderBy('ontime_score', 'desc').limit(50).fetch()
      users = users.toJSON()
      let leads = []

      for(let theUser of users) {
        leads.push({
          image_path: theUser.user.image_path,
          score: theUser.ontime_score,
          username: theUser.user.username,
        })
      }
      return [{
        status: 1,
        messages: [],
        data: {
          ontime_leaders: leads
        }
      }]
    }catch(e){
      return [{
        status: 0,
        messages: [{
          code: "UnknowError",
          message: JSON.stringify(e)
        }],
        data: {}
      }]
    }
  }

  static async insLeader (params, user) {
    try{
      let leaderField = 'inspector_score'

      let users = await Property.query().with('user').orderBy(leaderField, 'desc').limit(20).fetch()
      users = users.toJSON()
      let leads = {
        tops: [],
        user_position: [],
      }

      let userFound = false
      let indx = 1
      for(let theUser of users) {
        if(theUser.user_id == user.id) {
          userFound = true
        }
        leads.tops.push({
          index: indx,
          image_path: theUser.user.image_path,
          score: theUser[leaderField],
          username: theUser.user.username,
          its_you: (theUser.user_id == user.id),
        })
        indx++
      }

      if(!userFound) {
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
        let userPos = await Property.query().where(leaderField, '>=', userProperty[leaderField]).orderBy(leaderField).getCount()
        let upperUsers = await Property.query().with('user').where('user_id', '!=', user.id).where(leaderField, '>=', userProperty[leaderField]).orderBy(leaderField).limit(5).fetch()
        upperUsers = upperUsers.toJSON()
        let downerUsers = await Property.query().with('user').where('user_id', '!=', user.id).where(leaderField, '<', userProperty[leaderField]).orderBy(leaderField, 'desc').limit(5).fetch()
        downerUsers = downerUsers.toJSON()
        let user_position = [], uppers = [], downers = []
        for(let theUser of upperUsers) {
          uppers.push({
            image_path: theUser.user.image_path,
            score: theUser[leaderField],
            username: theUser.user.username,
            its_you: false,
          })
        }
        for(let theUser of downerUsers) {
          downers.push({
            image_path: theUser.user.image_path,
            score: theUser[leaderField],
            username: theUser.user.username,
            its_you: false,
          })
        }
        for(let i = uppers.length - 1;i>=0;i--) {
          uppers[i]['index'] = userPos - i - 1
          user_position.push(uppers[i])
        }
        user_position.push({
          index: userPos,
          image_path: user.image_path,
          score: userProperty[leaderField],
          username: user.username,
          its_you: true,
        })
        for(let i = 0;i < downers.length;i++) {
          downers[i]['index'] = userPos + i + 1
          user_position.push(downers[i])
        }

        leads.user_position = user_position
      }

      return [{
        status: 1,
        messages: [],
        data: {
          inspector_leaders: leads
        }
      }]
    }catch(e){
      return [{
        status: 0,
        messages: [{
          code: "UnknowError",
          message: JSON.stringify(e)
        }],
        data: {}
      }]
    }
  }

  static async insWorkLeader (params, user) {
    try{
      let yesterday = Time().subtract(1, 'day').format('YYYY-MM-DD')
      let users = await InspectorDailyReport.query().whereRaw("created_at like '" + yesterday + " %'").with('user').orderBy('report_count', 'desc').limit(50).fetch()
      users = users.toJSON()
      let leads = []

      for(let theUser of users) {
        leads.push({
          image_path: theUser.user.image_path,
          score: theUser.report_count,
          username: theUser.user.username,
        })
      }
      return [{
        status: 1,
        messages: [],
        data: {
          inspector_work_leaders: leads
        }
      }]
    }catch(e){
      return [{
        status: 0,
        messages: [{
          code: "UnknowError",
          message: JSON.stringify(e)
        }],
        data: {}
      }]
    }
  }

  static async randomGift (params, user) {
    try{
      let settings = await Setting.get()
      await user.loadMany(['zones.zone'])
      let userData = user.toJSON()
      let minimum_report = 0, todayReport = 0, star = 0
      let todayRandomGift
      if(userData.is_parking_ranger==4) {
        /*
        if(parseInt(Time().format('HH'), 10) < 21) {
          return [{
            status: 0,
            messages: [{
              code: "NotEndOfDay",
              message: "دریافت هدیه تنها در پایان روز ممکن است",
            }],
            data: {}
          }]
        }
        todayRandomGift = await RangerRandomGift.query().where('user_id', user.id).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').first()
        if(todayRandomGift) {
          return [{
            status: 0,
            messages: [{
              code: "HadGiftToday",
              message: "هدیه امروز را دریافت کرده اید",
            }],
            data: {}
          }]
        }
        */
        if(userData.zones && userData.zones.length>0) {
          for(let uZ of userData.zones) {
            if(uZ.zone) {
              minimum_report += uZ.zone.desired_reports
            }
          }
        }
        todayReport = await InspectorDailyReport.query().where('user_id', user.id).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').getSum('report_count')
        if(!todayReport) {
          todayReport = 0
        }
        if(minimum_report>0 && todayReport>=minimum_report) {
          star = 1
          if(todayReport>minimum_report + settings.ranger_star_change_1 && todayReport<=minimum_report + settings.ranger_star_change_2) {
            star = 2
          }else if(todayReport>minimum_report + settings.ranger_star_change_2 && todayReport<=minimum_report + settings.ranger_star_change_3) {
            star = 3
          }
        }
      }else {
        let transactions = Transaction.query().where('user_id', user.id).where('type', 'shield').where('status', 'success').getCount()
        if(transactions % settings.park_count_for_gift != 0) {
          return [{
            status: 0,
            messages: [{
              code: "NotEnoughPark",
              message: "تعداد پارک شما به حد دریافت هدیه نرسیده است",
            }],
            data: {}
          }]
        }
      }
      let loots = {}
      if(user.is_parking_ranger==4 && star>0) {
        if(star == 1) {
          loots['silver_coin'] = Math.ceil(Math.random() * (settings.random_gift_silver_max - settings.random_gift_silver_min) + settings.random_gift_silver_min)
        }else if(star == 2) {
          loots['silver_coin'] = Math.ceil(Math.random() * (settings.random_gift_silver_star2_max - settings.random_gift_silver_star2_min) + settings.random_gift_silver_star2_min)
        }else if(star == 3) {
          loots['silver_coin'] = Math.ceil(Math.random() * (settings.random_gift_silver_star3_max - settings.random_gift_silver_star3_min) + settings.random_gift_silver_star3_min)
        }
      }else if(user.is_parking_ranger!=4){
        loots['diamond'] = Math.ceil(Math.random() * (settings.random_gift_diamond_max - settings.random_gift_diamond_min) + settings.random_gift_diamond_min)
      }

      let assets = [
        'gasoline',
        'health_oil',
        'cleaning_soap',
        'water',
        'coke',
      ]
      let index1 = -1, index2 = -1
      index1 = Math.ceil(Math.random() * 4)
      while(index2<0 || index1==index2) {
        index2 = Math.ceil(Math.random() * 4)
      }

      loots[assets[index1]] = Math.ceil(Math.random() * (settings.random_gift_max - settings.random_gift_min) + settings.random_gift_min)/100
      loots[assets[index2]] = Math.ceil(Math.random() * (settings.random_gift_max - settings.random_gift_min) + settings.random_gift_min)/100

      if(user.is_parking_ranger==4) {
        todayRandomGift = new RangerRandomGift
        todayRandomGift.user_id = user.id
        for(let loot in loots) {
          todayRandomGift[loot] = loots[loot]
        }
        todayRandomGift.save()
      }
      let property = await Property.query().where('user_id', user.id).first()
      for(let loot in loots) {
        property[loot] += loots[loot]
      }
      property.save()

      return [{
        status: 1,
        messages: [],
        data: {
          loots: loots
        }
      }]
    }catch(e){
      return [{
        status: 0,
        messages: [{
          code: "UnknowError",
          message: JSON.stringify(e)
        }],
        data: {}
      }]
    }
  }
}

module.exports = UserController
