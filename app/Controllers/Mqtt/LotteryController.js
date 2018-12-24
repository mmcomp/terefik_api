'use strict'

const Lottery = use('App/Models/Lottery')
const UserLotteryAward = use('App/Models/UserLotteryAward')
const Property = use('App/Models/Property')

const Validations = use('App/Libs/Validations')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

class LotteryController {
  static async list (params, user) {
    try{
      let userLottery, lottery, lotteries = {
        userLotteries: []
      }
      if(user.is_parking_ranger==0){
        lotteries.userLotteries = await Lottery.query().with('awards').whereIn('type', ['users', 'norangers']).where('start_date', '<=', Moment.now('YYYY-MM-DD 00:00:00'))/*.where('finish_in_date', '>', Moment.now('YYYY-MM-DD 23:59:59'))*/.orderBy('created_at', 'DESC').fetch()
        lotteries.userLotteries = lotteries.userLotteries.toJSON()
      }else {
        lotteries.userLotteries = await Lottery.query().with('awards').where('type', 'users').where('start_date', '<=', Moment.now('YYYY-MM-DD 00:00:00'))/*.where('finish_in_date', '>', Moment.now('YYYY-MM-DD 23:59:59'))*/.orderBy('created_at', 'DESC').fetch()
        lotteries.userLotteries = lotteries.userLotteries.toJSON()
        lotteries['rangerLotteries'] = await Lottery.query().with('awards').where('type', 'rangers').where('start_date', '<=', Moment.now('YYYY-MM-DD 00:00:00'))/*.where('finish_in_date', '>', Moment.now('YYYY-MM-DD 23:59:59'))*/.orderBy('created_at', 'DESC').fetch()
        lotteries.rangerLotteries = lotteries.rangerLotteries.toJSON()
        for(let i = 0;i < lotteries.rangerLotteries.length;i++) {
          lottery = lotteries.rangerLotteries[i]
          userLottery = await UserLotteryAward.query().where('user_id', user.id).where('lottery_id', lottery.id).first()
          lotteries.rangerLotteries[i]['is_in'] = false
          if(userLottery) {
            lotteries.rangerLotteries[i]['is_in'] = true
          }
          lotteries.rangerLotteries[i]['is_closed'] = (Time(Moment.now('YYYY-MM-DD 23:59:59')).diff(lotteries.rangerLotteries[i].finish_in_date, 'seconds')<=0)
        }
      }

      for(let i = 0;i < lotteries.userLotteries.length;i++) {
        lottery = lotteries.userLotteries[i]
        userLottery = await UserLotteryAward.query().where('users_id', user.id).where('lottery_id', lottery.id).first()
        lotteries.userLotteries[i]['is_in'] = false
        if(userLottery) {
          lotteries.userLotteries[i]['is_in'] = true
        }
        lotteries.userLotteries[i]['is_closed'] = (Time(Moment.now('YYYY-MM-DD 23:59:59')).diff(lotteries.userLotteries[i].finish_in_date, 'seconds')<=0)
      }

      return [{
        status: 1,
        messages: [],
        data: {
          lotteries: lotteries
        }
      }]
    }catch(e){
      console.log(e);
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

  static async inRequest (params, user) {
    try{
      const rules = {
        lottery_id: 'required',
        amount: 'required'
      }
  
      let check = await Validations.check(params, rules)
      if (check.err) {
        return [{
          status: 0,
          messages: check.messages,
          data: {}
        }]
      }

      let lottery = await Lottery.query().where('id', params.lottery_id).with('awards').first()
      if(!lottery) {
        return [{
          status: 0,
          messages: [{
            code: "LotteryNotFound",
            message: "قرعه کشی مورد نظر پیدا نشد"
          }],
          data: {}
        }]
      }

      let userLottery = await UserLotteryAward.query().where('users_id', user.id).where('lottery_id', lottery.id).first()
      if(userLottery) {
        return [{
          status: 0,
          messages: [{
            code: "AlreadyInThisLottery",
            message: "شما در این قرعه کشی شرکت کرده اید"
          }],
          data: {}
        }]
      }

      let min_chance = 0
      let lotteryData = lottery.toJSON()
      for(let award of lotteryData.awards) {
        // if(min_chance>0) {
          min_chance = Math.min(min_chance, award.min_chance)
        // }else {
        //   min_chance = award.min_chance
        // }
      }
      
      if(params.amount < min_chance) {
        return [{
          status: 0,
          messages: [{
            code: "LotteryMinChanceError",
            message: "حداقل شانس مورد نیاز برای شرکت در این قرعه کشی " + min_chance + " می باشد"
          }],
          data: {}
        }]
      }

      let userProperty = await Property.query().where('user_id', user_id).fisrt()
      if(!userProperty) {
        return [{
          status: 0,
          messages: [{
            code: "UserNotFound",
            message: "اطلاعات کاربر ناقص می باشد"
          }],
          data: {}
        }]
      }

      if(user.is_parking_ranger==4) {
        if(userProperty.silver_coin < params.amount) {
          return [{
            status: 0,
            messages: [{
              code: "SilverCoinNotEnough",
              message: "میزان سکه نقره شما کافی نیست"
            }],
            data: {}
          }]
        }

        userProperty.silver_coin -= params.amount
        await userProperty.save()
      }else {
        if(userProperty.diamond < params.amount) {
          return [{
            status: 0,
            messages: [{
              code: "SilverCoinNotEnough",
              message: "میزان الماس شما کافی نیست"
            }],
            data: {}
          }]
        }

        userProperty.diamond -= params.amount
        await userProperty.save()
      }
      
      userLottery = new UserLotteryAward
      userLottery.users_id = user.id
      userLottery.lottery_id = lottery.id
      userLottery.in_chance = params.amount
      await userLottery.save()

      lottery.status = 'haveuser'
      await lottery.save()

      return [{
        status: 1,
        messages: [],
        data: {}
      }]
    }catch(e){
      console.log(e)
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

module.exports = LotteryController
