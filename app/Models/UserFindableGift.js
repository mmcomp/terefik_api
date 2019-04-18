'use strict'

const Model = use('Model')

const FindableChance = use('App/Models/FindableChance')
const FindableGift = use('App/Models/FindableGift')
const FindableGiftDaterange = use('App/Models/FindableGiftDaterange')
const Setting = use('App/Models/Setting')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

class UserFindableGift extends Model {
  static get table () {
    return 'user_findable_gifts'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }

  static getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static async tryToGetGift (user_id, zone_id) {
    let chance = await FindableChance.getCurrentChance()
    console.log('current chance', chance)
    let userChance = UserFindableGift.getRandomInt(0, 100)
    console.log('your chance', userChance)
    if(userChance<=chance) {
      let allGifts = await FindableGift.all()
      allGifts = allGifts.toJSON()

      let openGifts = [], zoneOk = false
      for(let i = 0;i < allGifts.length;i++) {
        allGifts[i].todayCount = await UserFindableGift.query().where('findable_gifts_id', allGifts[i].id).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').count()
        allGifts[i].todayCount = allGifts[i].todayCount[0]['count(*)']
        if(allGifts[i].todayCount<allGifts[i].gift_count) {
          allGifts[i].userCount = await UserFindableGift.query().where('user_id', user_id).where('findable_gifts_id', allGifts[i].id).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').count()
          allGifts[i].userCount = allGifts[i].userCount[0]['count(*)']
          if(allGifts[i].userCount<allGifts[i].max_win_aday) {
            console.log('Find date range for findable_gifts_id=', allGifts[i].id, ' start_date<=', Time().format('YYYY-MM-DD') + ' 00:00:00', ' end_date>=', Time().format('YYYY-MM-DD') + ' 23:59:59')
            allGifts[i].dateRanges = await FindableGiftDaterange.query().where('findable_gifts_id', allGifts[i].id).where('start_date', '<=', Time().format('YYYY-MM-DD') + ' 00:00:00').where('end_date', '>=', Time().format('YYYY-MM-DD') + ' 23:59:59').fetch()
            allGifts[i].dateRanges = allGifts[i].dateRanges.toJSON()
            console.log('date range', allGifts[i].dateRanges)
            if(allGifts[i].dateRanges.length>0) {
              let settings = await Setting.get()
              zoneOk= true
              if(settings.findable_gift_accept_outof_zone==0) {
                zoneOk = false
                for(let j = 0;j < allGifts[i].dateRanges.length;j++) {
                  if(allGifts[i].dateRanges[j].zone_id==zone_id || allGifts[i].dateRanges[j].zone_id==0) {
                    zoneOk = true
                  }
                }
              }
              if(zoneOk) {
                openGifts.push(allGifts[i].id)
              }
            }
          }
        }
      }

      console.log('Open Gifts', openGifts)
      if(openGifts.length==0) {
        return null
      }

      let giftIndexChance = UserFindableGift.getRandomInt(0, openGifts.length-1)
      let gift_id = openGifts[giftIndexChance]
      let theActive = await FindableChance.activeOne()
      let userFindableGift = new UserFindableGift
      userFindableGift.findable_gifts_id = gift_id
      userFindableGift.findable_chances_id = theActive.id
      userFindableGift.user_id = user_id
      await userFindableGift.save()

      return gift_id
    }

    return null
  }

  // Relations
  user () {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }

  gift () {
    return this.hasOne('App/Models/FindableGift', 'findable_gifts_id', 'id')
  }
}

module.exports = UserFindableGift
