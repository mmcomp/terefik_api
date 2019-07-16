'use strict'
const Env = use('Env')
const mysql = require('mysql')
const moment = require('moment')
const Randomatic = require('randomatic')
const phone = require('phone')
const axios = require('axios')
const Achievment = use('App/Models/Achievment')
var connection = mysql.createPool({
  connectionLimit : 10,
  host     : Env.get('DB_HOST'),
  user     : Env.get('DB_USER'),
  password : Env.get('DB_PASSWORD'),
  database : Env.get('DB_DATABASE')
});
var otherConnection = mysql.createPool({
  connectionLimit : 10,
  host     : Env.get('DB_HOST'),
  user     : Env.get('DB_USER'),
  password : Env.get('DB_PASSWORD'),
  database : Env.get('DB_OTHER_DATABASE')
});
function normalizeMobile (mobile, country = 'IR') {
  const normalMobile = phone(mobile, country)

  if (normalMobile.length) {
    return normalMobile
  }

  return false
}
module.exports = class responseClass {
  constructor(user_id, is_parking_ranger, last_daily_gift) {
    this.user_id = user_id
    this.is_parking_ranger = is_parking_ranger
    this.last_daily_gift = last_daily_gift
  }
  async ExperienceLeaderBoard() {
    console.log('ExperienceLeaderBoard for', this.user_id)
    const user_id = this.user_id
    let output = {
      tops: [],
      user_position: [],
    }
    return new Promise(function(resolve, reject) {
      let foundOnTop = false
      connection.query(`SELECT image_path, experience_score, username, user_id FROM user_property LEFT JOIN users ON (users.id=user_id) ORDER BY experience_score DESC  limit 20 `, function(err, result) {
        if(err) {
          reject(err)
        }
        let indx = 1
        for(const usr of result) {
          output.tops.push({
            index: indx,
            image_path: usr.image_path,
            score: usr.experience_score,
            username: usr.username,
            its_you: (usr.user_id==user_id),
          })
          if(usr.user_id==user_id) {
            foundOnTop = true
          }
        }
        if(!foundOnTop) {
          connection.query(`SELECT image_path, experience_score, username, user_id FROM user_property LEFT JOIN users ON (users.id=user_id) WHERE user_id = ${ user_id } `, function(err, result) {
            if(err) {
              reject(err)
            }

            let theUserScore = result[0]
            connection.query(`SELECT COUNT(id) cid FROM user_property WHERE experience_score>=${ theUserScore.experience_score } AND user_id != ${ user_id } `, function(err, result) {
              if(err) {
                reject(err)
              }

              theUserScore['index'] = result[0].cid + 1
              connection.query(`SELECT image_path, experience_score, username, user_id FROM user_property LEFT JOIN users ON (users.id=user_id) WHERE experience_score>=${ theUserScore.experience_score } AND user_id != ${ user_id } ORDER BY experience_score ASC LIMIT 5`, function(err, result) {
                if(err) {
                  reject(err)
                }

                const uppers = result
                connection.query(`SELECT image_path, experience_score, username, user_id FROM user_property LEFT JOIN users ON (users.id=user_id) WHERE experience_score<${ theUserScore.experience_score } ORDER BY experience_score DESC LIMIT 5`, function(err, result) {
                  if(err) {
                    reject(err)
                  }
    
                  const downers = result
                  for(let i = uppers.length-1;i >= 0;i--) {
                    output.user_position.push({
                      index: theUserScore.index - 1 - i,
                      image_path: uppers[i].image_path,
                      score: uppers[i].experience_score,
                      username: uppers[i].username,
                      its_you: false,
                    })
                  }
                  output.user_position.push({
                    index: theUserScore.index,
                    image_path: theUserScore.image_path,
                    score: theUserScore.experience_score,
                    username: theUserScore.username,
                    its_you: true,
                  })
                  for(let i = 0;i < downers.length;i++) {
                    output.user_position.push({
                      index: theUserScore.index + 1 + i,
                      image_path: downers[i].image_path,
                      score: downers[i].experience_score,
                      username: downers[i].username,
                      its_you: false,
                    })
                  }

                  resolve({
                    experience_leaders: output
                  })
                })
              })
            })
          })
        }else {
          resolve({
            experience_leaders: output
          })
        }
      })
    })
  }
  async InspectorLeaderBoard() {
    console.log('InspectorLeaderBoard for', this.user_id)
    const user_id = this.user_id
    let output = {
      tops: [],
      user_position: [],
    }
    return new Promise(function(resolve, reject) {
      let foundOnTop = false
      connection.query(`SELECT image_path, inspector_score, username, user_id FROM user_property LEFT JOIN users ON (users.id=user_id) ORDER BY inspector_score DESC  limit 20 `, function(err, result) {
        if(err) {
          reject(err)
        }
        let indx = 1
        for(const usr of result) {
          output.tops.push({
            index: indx,
            image_path: usr.image_path,
            score: usr.inspector_score,
            username: usr.username,
            its_you: (usr.user_id==user_id),
          })
          if(usr.user_id==user_id) {
            foundOnTop = true
          }
        }
        if(!foundOnTop) {
          connection.query(`SELECT image_path, inspector_score, username, user_id FROM user_property LEFT JOIN users ON (users.id=user_id) WHERE user_id = ${ user_id } `, function(err, result) {
            if(err) {
              reject(err)
            }

            let theUserScore = result[0]
            connection.query(`SELECT COUNT(id) cid FROM user_property WHERE inspector_score>=${ theUserScore.inspector_score } AND user_id != ${ user_id } `, function(err, result) {
              if(err) {
                reject(err)
              }

              theUserScore['index'] = result[0].cid + 1
              connection.query(`SELECT image_path, inspector_score, username, user_id FROM user_property LEFT JOIN users ON (users.id=user_id) WHERE inspector_score>=${ theUserScore.inspector_score } AND user_id != ${ user_id } ORDER BY inspector_score ASC LIMIT 5`, function(err, result) {
                if(err) {
                  reject(err)
                }

                const uppers = result
                connection.query(`SELECT image_path, inspector_score, username, user_id FROM user_property LEFT JOIN users ON (users.id=user_id) WHERE inspector_score<${ theUserScore.inspector_score } ORDER BY inspector_score DESC LIMIT 5`, function(err, result) {
                  if(err) {
                    reject(err)
                  }
    
                  const downers = result
                  for(let i = uppers.length-1;i >= 0;i--) {
                    output.user_position.push({
                      index: theUserScore.index - 1 - i,
                      image_path: uppers[i].image_path,
                      score: uppers[i].inspector_score,
                      username: uppers[i].username,
                      its_you: false,
                    })
                  }
                  output.user_position.push({
                    index: theUserScore.index,
                    image_path: theUserScore.image_path,
                    score: theUserScore.inspector_score,
                    username: theUserScore.username,
                    its_you: true,
                  })
                  for(let i = 0;i < downers.length;i++) {
                    output.user_position.push({
                      index: theUserScore.index + 1 + i,
                      image_path: downers[i].image_path,
                      score: downers[i].inspector_score,
                      username: downers[i].username,
                      its_you: false,
                    })
                  }

                  resolve({
                    inspector_leaders: output
                  })
                })
              })
            })
          })
        }else {
          resolve({
            inspector_leaders: output
          })
        }
      })
    })
  }
  async UserFastProfile() {
    console.log('UserFastProfile for', this.user_id)
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT users.*, user_property.* FROM users LEFT JOIN user_property ON (users.id=user_property.user_id) LEFT JOIN experience_levels ON (experience_levels.id=experience_level) LEFT JOIN inspector_levels ON (inspector_levels.id=inspector_level) WHERE users.id = ${ user_id }`, function(err, result) {
        if(err) {
          reject(err)
        }
        let profile = result[0]
        connection.query(`SELECT COUNT(id) cid FROM notifications WHERE users_id = ${ user_id } AND status IN ('created', 'transmit')`, function(err, res) {
          if(err) {
            reject(err)
          }
  
          profile['notifications'] = res[0].cid
          resolve(profile)
        })
      })
    })
  }
  async GetSettings(all) {
    console.log('GetSettings for', this.user_id)
    let fields = `unit_to_minute, unit_to_bronze_coin, unit_to_bronze_coin_2, unit_to_bronze_coin_3, unit_to_bronze_coin_4, unit_to_bronze_coin_5, unit_to_bronze_coin_6, unit_to_bronze_coin_7, unit_to_bronze_coin_8, unit_to_bronze_coin_9, unit_to_bronze_coin_10, unit_max, last_critical_version, last_version, user_diamond_gps, total_discount`
    if(all) {
      fields = '*'
    }
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT ${fields} FROM settings LIMIT 1`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result[0])
      })
    })
  }
  async ParkingRegister() {
    console.log('ParkingRegister for', this.user_id)
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT parking_registers.vehicle_id, parking_registers.users_id, parking_registers.expired_at, parking_registers.created_at, parkings.name FROM parking_registers LEFT JOIN parkings ON (parkings_id=parkings.id) WHERE users_id = ${ user_id } AND expired_at > '${ moment().format('YYYY-MM-DD HH:mm:ss') }'`, function(err, result) {
        if(err) {
          reject(err)
        }

        let output = []
        for(let tmp of result) {
          output.push({
            vehicle_id: tmp.vehicle_id,
            users_id: tmp.users_id,
            created_at: tmp.created_at,
            expired_at: tmp.expired_at,
            parking: {
              name: tmp.name
            }
          })
        }
        resolve(output)
      })
    })
  }
  async StartListCar() {
    console.log('StartListCar for', this.user_id)
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT vehicle.*, shield_start, shield_duration, leave_time FROM user_vehicle LEFT JOIN vehicle ON (vehicle.id=vehicle_id) WHERE user_id = ${ user_id }`,async function(err, result) {
        if(err) {
          reject(err)
        }

        let cars = result
        let shieldFinish
        for(let i = 0;i < cars.length;i++) {
          shieldFinish = moment(cars[i].shield_start).add(cars[i].shield_duration, 'minutes').format('YYYY-MM-DD HH:mm:ss')
          cars[i]['shield_diff'] = (moment().diff(shieldFinish, 'seconds')>0)?null:-1*moment().diff(shieldFinish, 'seconds')
        }
        resolve(cars)
      })
    })
  }
  async UserZones() {
    console.log('UserZones for', this.user_id)
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT zone.* FROM user_zone LEFT JOIN zone ON (zone.id=zone_id) WHERE users_id = ${ user_id } `, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async AllGift() {
    console.log('AllGifts for', this.user_id)
    const user_id = this.user_id
    const is_parking_ranger = this.is_parking_ranger
    const last_daily_gift = this.last_daily_gift
    const settings = await this.GetSettings(true)
    const userZones = await this.UserZones()
    let output = {
      user_findable_gifts: [],
      ranger_findable_gifts: [],
      has_daily_gift: true,
      daily_gift_remaining_time: 0,
      has_random_gift: true,
      random_gift_ranger_star: {
        minimum_report: 0,
        today_report: 0,
        ranger_star_change_1: settings.ranger_star_change_1,
        ranger_star_change_2: settings.ranger_star_change_2,
        ranger_star_change_3: settings.ranger_star_change_3,
      },
      random_gift_user_percent: 100,
    }
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT user_pfindable_gifts.status, user_pfindable_gifts.description, user_pfindable_gifts.created_at, pfindable_gifts.name, pfindable_gifts.message FROM user_pfindable_gifts LEFT JOIN pfindable_gifts ON (pfindable_gifts.id = pfindable_gifts_id) WHERE user_id = ${ user_id } `, function(err, result) {
        if(err) {
          reject(err)
        }
        let theresult = []
        for(let res of result) {
          theresult.push({
            status: res.status,
            description: res.description,
            created_at: res.created_at,
            gift: {
              name: res.name,
              message: res.message
            }
          })
        }
        output.user_findable_gifts = theresult
        if(last_daily_gift && last_daily_gift!=null) {
          if(moment(last_daily_gift).format('YYYY-MM-DD')==moment().format('YYYY-MM-DD')) {
            let tomarrow = moment().add(1, 'days').format('YYYY-MM-DD 00:00:00')
            output.daily_gift_remaining_time = moment(tomarrow).diff(moment().format('YYYY-MM-DD HH:mm:ss'), 'seconds')
            output.has_daily_gift = false
          }
        }

        if(is_parking_ranger==4) {
          connection.query(`SELECT user_findable_gifts.status, user_findable_gifts.description, user_findable_gifts.created_at, findable_gifts.name, findable_gifts.message FROM user_findable_gifts LEFT JOIN findable_gifts ON (findable_gifts.id = findable_gifts_id) WHERE user_id = ${ user_id } `, function(err, result) {
            if(err) {
              reject(err)
            }

            theresult = []
            for(let res of result) {
              theresult.push({
                status: res.status,
                description: res.description,
                created_at: res.created_at,
                gift: {
                  name: res.name,
                  message: res.message
                }
              })
            }
            output.ranger_findable_gifts = theresult

            connection.query(`SELECT * FROM ranger_random_gifts WHERE user_id = ${ user_id } AND created_at LIKE '${ moment().format('YYYY-MM-DD') }%'`, function(err, result) {
              if(err) {
                reject(err)
              }

              if(result && result.length>0) {
                output.has_random_gift = false
                resolve(output)
              }else {
                if(userZones && userZones.length>0) {
                  for(let uZ of userZones) {
                    output.random_gift_ranger_star.minimum_report += uZ.desired_reports
                  }
                }
                connection.query(`SELECT SUM(report_count) re_count FROM  inspector_daily_report WHERE user_id = ${ user_id } AND created_at LIKE '${ moment().format('YYYY-MM-DD') }%'`, function(err, result) {
                  if(err) {
                    reject(err)
                  }

                  output.random_gift_ranger_star.today_report = (result[0].re_count)?result[0].re_count:0
                  output.has_random_gift = false
                  if(output.random_gift_ranger_star.minimum_report>0 && output.random_gift_ranger_star.todayReport>=(output.random_gift_ranger_star.minimum_report+settings.ranger_star_change_1)) {
                    if(output.random_gift_ranger_star.todayReport>=(output.random_gift_ranger_star.minimum_report + settings.ranger_star_change_3)) {
                      output.has_random_gift = true
                    }
                  }
                  resolve(output)
                })
              }
            })
          })
          
        }else {
          connection.query(`SELECT COUNT(*) co FROM transactions WHERE user_id = ${ user_id } AND \`type\` = 'shield' AND \`status\` = 'success' `, function(err, result) {
            if(err) {
              reject(err)
            }

            let transactions = 0
            if(result && result.length>0) {
              transactions = result[0].co
            }
            if(transactions % settings.park_count_for_gift != 0) {
              output.has_random_gift = false
              output.random_gift_user_percent = parseInt((transactions % settings.park_count_for_gift)*100/settings.park_count_for_gift, 10)
            }

            resolve(output)
          })
        }
      })
    })
  }
  async StartUp() {
    let output = {
      profile: null,
      settings: null,
      cars: null,
      server_time: null,
      AllGift: null,
    }
    output.profile =  await this.UserFastProfile()
    output.settings = await this.GetSettings()
    if(this.is_parking_ranger!=4) {
      output.cars = await this.StartListCar()
      const parking_register = await this.ParkingRegister()
      console.log('Parking Register')
      console.log(parking_register)
      for(let i = 0;i < output.cars.length;i++) {
        output.cars[i]['parking_register'] = null
        for(let j = 0;j < parking_register.length;j++) {
          if(parking_register[j] && parking_register[j].vehicle_id==output.cars[i].id && parking_register[j].users_id==this.user_id) {
            output.cars[i]['parking_register'] = parking_register[j]
          }
        }
      }
    }else {
      output.AllGift = await this.AllGift()
    }
    output.server_time = new Date()
    return output
  }
  async LotteryList() {
    function hideMobile (inp) {
      if(!inp) {
        return inp
      }
      inp = inp.replace('+98', '0')
      let out = inp
      if(inp.indexOf('+')==0) {
        out = inp.substring(0, 4) + '***' + inp.substring(9)
      }else if(inp.length==11) {
        out = inp.substring(0, 4) + '***' + inp.substring(7)
      }else if(inp.length==11) {
        out = inp.substring(0, 3) + '***' + inp.substring(6)
      }
      return out
    }
    console.log('LotteryList for', this.user_id)
    const is_parking_ranger = this.is_parking_ranger
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      const theQuery = `SELECT lottery.type \`ltype\`, lottery.id lid, lottery.name lname, lottery.start_date, lottery.finish_in_date, lottery.exec_date, lottery.type, lottery.status, lottery_award.id, lottery_award.name, lottery_award.description, lottery_award.image_path, lottery_award.min_chance, lottery_user.users_id, lottery_user.in_chance, lottery_user.lottary_award_id, users.mobile FROM lottery LEFT JOIN lottery_award ON (lottery_award.lottery_id=lottery.id) LEFT JOIN lottery_user ON (lottery_user.lottery_id=lottery.id) LEFT JOIN users ON (users.id=lottery_user.users_id) WHERE status != 'hidden' AND start_date <= '${ moment().format('YYYY-MM-DD HH:mm:ss') }'`
      // console.log(theQuery)
      connection.query(theQuery, function(err, result) {
        if(err) {
          reject(err)
        }
        let output = {
          lotteries: {
            userLotteries: [],
            rangerLotteries: [],
            current_time: null,
          }
        }
        let tmpLotteries = []
        let tmpAwards = []
        let awards = {}
        let users = {}
        let userData = {}
        let awardData = {}
        let isIn = []
        let inChances = []
        let userAwards = {}
        for(let inp of result) {
          if(tmpLotteries.indexOf(inp.lid)<0) {
            tmpLotteries.push(inp.lid)
            awards[inp.lid] = []
            users[inp.lid] = []
            userAwards[inp.lid] = {}
            if((inp.ltype=='norangers' && is_parking_ranger!=4)||(inp.ltype=='users')) {
              output.lotteries.userLotteries.push({
                id: inp.lid,
                name: inp.lname,
                start_date: inp.start_date,
                finish_in_date: inp.finish_in_date,
                exec_date: inp.exec_date,
                type: inp.ltype,
                status: inp.status,
                start_date_remaining: -1 * moment().diff(moment(inp.start_date).format('YYYY-MM-DD 23:59:59'), 'seconds'),
                finish_in_date_remaining:  -1 * moment().diff(moment(inp.finish_in_date).format('YYYY-MM-DD 23:59:59'), 'seconds'),
                exec_date_remaining:  -1 * moment().diff(moment(inp.exec_date).format('YYYY-MM-DD 23:59:59'), 'seconds'),
                is_closed: (moment(moment().format('YYYY-MM-DD 00:00:00')).diff(inp.finish_in_date, 'seconds')>0)
              })
            }else if(inp.ltype=='rangers') {
              output.lotteries.rangerLotteries.push({
                id: inp.lid,
                name: inp.lname,
                start_date: inp.start_date,
                finish_in_date: inp.finish_in_date,
                exec_date: inp.exec_date,
                type: inp.ltype,
                status: inp.status,
                start_date_remaining: -1 * moment().diff(moment(inp.start_date).format('YYYY-MM-DD 23:59:59'), 'seconds'),
                finish_in_date_remaining:  -1 * moment().diff(moment(inp.finish_in_date).format('YYYY-MM-DD 23:59:59'), 'seconds'),
                exec_date_remaining:  -1 * moment().diff(moment(inp.exec_date).format('YYYY-MM-DD 23:59:59'), 'seconds'),
                is_closed: (moment(moment().format('YYYY-MM-DD 00:00:00')).diff(inp.finish_in_date, 'seconds')>0)
              })
            }
          }
          if(inp.id && tmpAwards.indexOf(inp.id)<0) {
            tmpAwards.push(inp.id)
            awards[inp.lid].push({
              id: inp.id,
              name: inp.name,
              image_path: inp.image_path,
              min_chance: inp.min_chance,
            })
            awardData[inp.id] = {
              name: inp.name,
              image_path: inp.image_path,
              min_chance: inp.min_chance,
            }
          }
          if(inp.users_id && users[inp.lid].indexOf(inp.users_id)<0) {
            users[inp.lid].push(inp.users_id)
            if(inp.users_id==user_id && isIn.indexOf(inp.lid)<0) {
              isIn.push(inp.lid)
              inChances.push(inp.in_chance)
            }
            userData[inp.users_id] = {
              mobile: hideMobile(inp.mobile)
            }
            if(inp.lottary_award_id && inp.lottary_award_id>0) {
              userAwards[inp.lid][inp.users_id] = inp.lottary_award_id
            }
          }
        }
        for(let i = 0;i < output.lotteries.userLotteries.length;i++) {
          output.lotteries.userLotteries[i]['awards'] = awards[output.lotteries.userLotteries[i].id]
          output.lotteries.userLotteries[i]['is_in'] = (isIn.indexOf(output.lotteries.userLotteries[i].id)>=0)
          output.lotteries.userLotteries[i]['in_chance'] = (isIn.indexOf(output.lotteries.userLotteries[i].id)>=0)?inChances[isIn.indexOf(output.lotteries.userLotteries[i].id)]:0
          if(output.lotteries.userLotteries[i].status=='done') {
            output.lotteries.userLotteries[i]['winners'] = []
            for(let uWin in userAwards[output.lotteries.userLotteries[i].id]) {
              output.lotteries.userLotteries[i]['winners'].push({
                user: userData[uWin],
                award: awardData[userAwards[output.lotteries.userLotteries[i].id][uWin]]
              })
            }
          }
        }
        for(let i = 0;i < output.lotteries.rangerLotteries.length;i++) {
          output.lotteries.rangerLotteries[i]['awards'] = awards[output.lotteries.rangerLotteries[i].id]
          output.lotteries.rangerLotteries[i]['is_in'] = (isIn.indexOf(output.lotteries.rangerLotteries[i].id)>=0)
          output.lotteries.rangerLotteries[i]['in_chance'] = (isIn.indexOf(output.lotteries.rangerLotteries[i].id)>=0)?inChances[isIn.indexOf(output.lotteries.rangerLotteries[i].id)]:0
          if(output.lotteries.rangerLotteries[i].status=='done') {
            output.lotteries.rangerLotteries[i]['winners'] = []
            for(let uWin in userAwards[output.lotteries.rangerLotteries[i].id]) {
              output.lotteries.rangerLotteries[i]['winners'].push({
                user: userData[uWin],
                award: awardData[userAwards[output.lotteries.rangerLotteries[i].id][uWin]]
              })
            }
          }
        }
        output.lotteries.current_time = new Date
        resolve(output)
      })
    })
  }
  async ListCar() {
    console.log('FastListCar for', this.user_id)
    let output = {
      cars: [],
      server_time: null,
    }
    output.cars = await this.StartListCar()
    const parking_register = await this.ParkingRegister()
    console.log('Parking Register', parking_register)
    console.log('cars', output.cars)
    for(let i = 0;i < output.cars.length;i++) {
      output.cars[i]['parking_register'] = null
      for(let j = 0;j < parking_register.length;j++) {
        if(parking_register[j] && parking_register[j].vehicle_id==output.cars[i].id) {
          output.cars[i]['parking_register'] = parking_register[j]
        }
      }
    }
    output.server_time = new Date()
    return output
  }
  async AchievmentList() {
    console.log('AchievmentList for', this.user_id)
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT achievments.*, IF(users_achievment.achieved IS null,0,users_achievment.achieved) achieved, IF(users_achievment.collected IS null,0,users_achievment.collected) collected FROM achievments LEFT JOIN users_achievment ON (achievments_id=achievments.id AND users_id=${user_id}) order by tag ASC,\`level\` ASC`, function(err, result) {
        if(err) {
          reject(err)
        }
        let output = {
          achiements: {}
        }
        for(let ach of result) {
          if(!output.achiements[ach.tag]) {
            output.achiements[ach.tag] = []
          }

          output.achiements[ach.tag].push(ach)
        }
        resolve(output)
      })
    })
  }
  async ChangeNotifications(ids, status) {
    if(!status) {
      status = 'transmit'
    }
    console.log('ChangeNotifications for', this.user_id)
    return new Promise(function(resolve, reject) {
      if(!ids || !ids[0]) {
        reject('Invalid IDS')
      }
      connection.query(`UPDATE notifications SET status = '${status}' WHERE id in (${ ids.join(',') }) `, function(err, result) {
        if(err) {
          reject(err)
        }
        resolve()
      })
    })
  }
  async LoadUserNotifications() {
    console.log('LoadUserNotifications for', this.user_id)
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT * FROM notifications WHERE users_id = ${ user_id } AND status in ('created', 'transmit')`, function(err, result) {
        if(err) {
          reject(err)
        }

        let output = {
          notifications: [],
          ids: [],
        }
        if(result && result[0]) {
          for(let noti of result) {
            output.ids.push(noti.id)
            output.notifications.push({
              title: noti.title,
              message: noti.message,
              type: noti.type,
              data: noti.data,
            })
          }
        }
        resolve(output)
      })
    })
  }
  async UserNotifications() {
    console.log('UserNotifications for', this.user_id)
    const output = await this.LoadUserNotifications()
    if(output.ids && output.ids[0]) {
      this.ChangeNotifications(output.ids)
    }
    return {
      notifications: output.notifications,
    }
  }
  async UserVehicle(car_id) {
    console.log('UserVehicle for', this.user_id)
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT * FROM user_vehicle WHERE user_id = ${ user_id } AND vehicle_id = '${ car_id }'`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async UpdateRangerWord(id, params) {
    console.log('UpdateRangerWord for', this.user_id)
    let setStatment = ''
    params['updated_at'] = moment().format('YYYY-MM-DD HH:mm:ss')
    for(let i in params) {
      if(params[i]) {
        setStatment += `${((setStatment!='')?',':'')} \`${i}\` = '${params[i]}'`
      }else {
        setStatment += `${((setStatment!='')?',':'')} \`${i}\` = null`
      }    }
    return new Promise(function(resolve, reject) {
      connection.query(`UPDATE insector_work SET ${setStatment} WHERE id = ${id}`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async RangerWorkRecent(user_car_id, diff) {
    console.log('RangerWork for', this.user_id)
    let extra = ''
    if(diff) {
      extra = `AND created_at >= '${ moment().subtract(diff, 'moments').format('YYYY-MM-DD HH:mm:ss') }'`
    }
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT * FROM insector_work WHERE user_vehicle_id = ${ user_car_id } ${ extra }`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async ZoneByCords(lon, lat) {
    console.log('ZoneByCords for', this.user_id)
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT * FROM zone WHERE ST_CONTAINS(shape, point(${lon}, ${lat}))`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  unitCost(units, settings) {
    let unitCosts = parseInt(settings.unit_to_bronze_coin_10, 10)
    let unitsTotal = parseInt(settings.unit_to_bronze_coin, 10)

    for(let i = 2;i <= Math.min(units, 10);i++) {
      if(!isNaN(parseInt(settings['unit_to_bronze_coin_' + i], 10))) {
        unitsTotal += parseInt(settings['unit_to_bronze_coin_' + i], 10)
      }
    }
    if(units>10) {
      unitsTotal += unitCosts * (units - 10)
    }

    return unitsTotal
  }
  async UserProperty() {
    console.log('UserProperty for', this.user_id)
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT * FROM user_property WHERE user_id = ${ user_id } LIMIT 1`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async AddShieldTransaction(totalPay) {
    console.log('AddShieldTransaction for', this.user_id)
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      const now = moment().format('YYYY-MM-DD HH:mm:ss')
      const theQuery = `INSERT INTO transactions (user_id, \`type\`, type_id, price_type, price, status, created_at, updated_at) VALUES (${user_id}, 'shield', -1, 'bronze_coin', ${totalPay}, 'success', '${now}', '${now}')`
      connection.query(theQuery, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async ShieldTransactionCount() {
    console.log('ShieldTransactionCount for', this.user_id)
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT COUNT(*) co FROM transactions WHERE user_id = ${ user_id }`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async UpdateUserProperty(params) {
    console.log('UpdateUserProperty for', this.user_id)
    const user_id = this.user_id
    let setStatment = ''
    params['updated_at'] = moment().format('YYYY-MM-DD HH:mm:ss')
    for(let i in params) {
      if(params[i]) {
        setStatment += `${((setStatment!='')?',':'')} \`${i}\` = '${params[i]}'`
      }else {
        setStatment += `${((setStatment!='')?',':'')} \`${i}\` = null`
      }    }
    return new Promise(function(resolve, reject) {
      const theQuery = `UPDATE user_property SET ${setStatment} WHERE user_id = ${user_id}`
      connection.query(theQuery, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async UpdateUser(params) {
    console.log('UpdateUser for', this.user_id)
    const user_id = this.user_id
    let setStatment = ''
    params['updated_at'] = moment().format('YYYY-MM-DD HH:mm:ss')
    for(let i in params) {
      if(params[i]) {
        setStatment += `${((setStatment!='')?',':'')} \`${i}\` = '${params[i]}'`
      }else {
        setStatment += `${((setStatment!='')?',':'')} \`${i}\` = null`
      }    }
    return new Promise(function(resolve, reject) {
      connection.query(`UPDATE users SET ${setStatment} WHERE id = ${user_id}`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async UpdateParkingRangerDoc(params) {
    console.log('UpdateParkingRangerDoc for', this.user_id, params)
    const user_id = this.user_id
    let setStatment = ''
    params['updated_at'] = moment().format('YYYY-MM-DD HH:mm:ss')
    for(let i in params) {
      if(params[i]) {
        setStatment += `${((setStatment!='')?',':'')} \`${i}\` = '${params[i]}'`
      }else {
        setStatment += `${((setStatment!='')?',':'')} \`${i}\` = null`
      }    
    }
    const theQuery = `UPDATE parking_ranger_docs SET ${setStatment} WHERE doc_type = '${ params.doc_type }' AND users_id = ${user_id}`
    return new Promise(function(resolve, reject) {
      connection.query(theQuery, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async InsertParkingRangerDoc(params) {
    console.log('InsertParkingRangerDoc for', this.user_id)
    const user_id = this.user_id
    let fields = [], values = []
    params['updated_at'] = moment().format('YYYY-MM-DD HH:mm:ss')
    params['created_at'] = params['updated_at']
    params['users_id'] = user_id
    params['details'] = ' '
    for(let i in params) {
      if(params[i]) {
        fields.push(i)
        values.push(`'${params[i]}'`)
      }else {
        fields.push(i)
        values.push(`null`)
      }    
    }
    return new Promise(function(resolve, reject) {
      connection.query(`INSERT INTO parking_ranger_docs (${fields.join(',')}) VALUES (${values.join(',')}) `, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async UpdateRangerWork(params) {
    console.log('UpdateRangerWork for', this.user_id, params)
    const user_id = this.user_id
    let setStatment = ''
    params['updated_at'] = moment().format('YYYY-MM-DD HH:mm:ss')
    for(let i in params) {
      if(i!='id') {
        if(params[i]) {
          setStatment += `${((setStatment!='')?',':'')} \`${i}\` = '${params[i]}'`
        }else {
          setStatment += `${((setStatment!='')?',':'')} \`${i}\` = null`
        }
      }
    }
    const theQuery = `UPDATE insector_work SET ${setStatment} WHERE id = '${ params.id }' AND ranger_id = ${user_id}`
    return new Promise(function(resolve, reject) {
      connection.query(theQuery, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async UpdateUserCar(id, params) {
    console.log('UpdateUser for', this.user_id)
    let setStatment = ''
    params['updated_at'] = moment().format('YYYY-MM-DD HH:mm:ss')
    for(let i in params) {
      if(params[i]) {
        setStatment += `${((setStatment!='')?',':'')} \`${i}\` = '${params[i]}'`
      }else if(params[i]===null){
        setStatment += `${((setStatment!='')?',':'')} \`${i}\` = null`
      }else {
        setStatment += `${((setStatment!='')?',':'')} \`${i}\` = 0`
      }
    }
    return new Promise(function(resolve, reject) {
      const theQuery = `UPDATE user_vehicle SET ${setStatment} WHERE id = ${id}`
      connection.query(theQuery, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async ShieldCar(params) {
    console.log('ShieldCar for', this.user_id, params)
    if(!params.car_id || !params.units) {
      return {
        error: {
          code: 'InavlidInput',
          message: 'ورودی صحیح نیست',
        }
      }
    }

    let units = params.units
    let userData = await this.UserProperty()
    if(!userData[0]) {
      return {
        error: {
          code: 'UserNotFound',
          message: 'کاربر پیدا نشد'
        }
      }
    }
    userData = userData[0]

    const userCar = await this.UserVehicle(params.car_id)
    if(!userCar[0]) {
      return {
        error: {
          code: "CarNotYours",
          message: "خودرو متعلق به شما نمی باشد"
        }
      }
    }

    let extraDiamond = 0
    const settings = await this.GetSettings(true)
    const recentArrest = await this.RangerWorkRecent(userCar[0].id, settings.reshielding_time)
    if(recentArrest[0]) {
      extraDiamond = settings.diamond_earn_on_reshielding
      if(params.extend) {
        return {
          error: {
            code: 'CarWasNotShield',
            message: "خودرو شما پارک نمی باشد"
          }
        }
      }
      this.UpdateRangerWord(recentArrest[0].id, {report_to_police: 0})
    }

    if(params.lon_gps && params.lon_gps!=0 && params.lat_gps && params.lat_gps!=0) {
      extraDiamond += settings.user_diamond_gps
      const zone = await this.ZoneByCords(params.lon_gps, params.lat_gps)
      if(zone[0]) {
        extraDiamond += zone[0].extra_diamond
      }
    }

    let shieldFinish = moment(userCar[0].shield_start).add(userCar[0].shield_duration, 'minutes')
    
    let shieldDiff = -1 * moment().diff(shieldFinish, 'minutes')

    if(shieldDiff>0 && !params.extend) {
      return {
        error: {
          code: 'AlreadyShielded',
          message: `خودرو شما تا ${shieldDiff} دقیقه شیلد است`
        }
      }
    }
    if(shieldDiff<=0 && params.extend) {
      return {
        error: {
          code: 'CarWasNotShield',
          message: 'خودرو شما پارک نمی باشد'
        }
      }
    }

    let discountPercent = settings.total_discount

    discountPercent = (100 - discountPercent)/100
    console.log('Units', units)
    if(params.extend) {
      console.log('past units', userCar[0])
      units += userCar[0].total_unit
    }
    
    let unitsTotal = this.unitCost(units, settings)
    console.log('Unit Total', unitsTotal)
    if(params.extend) {
      unitsTotal -= userCar[0].total_coin
    }

    let totalPay = Math.ceil(unitsTotal * discountPercent, 10)


    if(totalPay > userData.bronze_coin) {
      if(userData.bronze_coin<0) {
        return {
          error: {
            code: "ShortOnBronzeEvenWithExtra",
            message: "اعتبار شما کافی نمی باشد و اعتبار شما منفی شده است"
          }
        }
      }

      if(settings.max_bronze_negative + userData.bronze_coin < totalPay) {
        return {
          error : {
            code: "ShortOnBronze",
            message: "اعتبار شما کافی نمی باشد"
          }
        }
      }
    }

    let transactions = await this.ShieldTransactionCount()
    if(transactions[0]) {
      if(transactions[0].co) {
        transactions = transactions[0].co + 1
      }else {
        transactions = 1
      }
    }else {
      transactions = 1
    }
    this.AddShieldTransaction(totalPay)
    const gift = (transactions % settings.park_count_for_gift == 0)
    const loot = {
      diamond: settings.diamond_earn_on_shielding + extraDiamond,
      gasoline: settings.park_gasoline,
      health: settings.park_health,
      clean: settings.park_clean,
      water: settings.park_water,
    }
    this.UpdateUserProperty({
      bronze_coin: userData.bronze_coin - totalPay,
      diamond: userData.diamond + settings.diamond_earn_on_shielding + extraDiamond,
      experience_score: userData.experience_score + settings.car_park_exp,
      gasoline: userData.gasoline + settings.park_gasoline,
      health_oil: userData.health_oil + settings.park_health,
      cleaning_soap: userData.cleaning_soap + settings.park_clean,
      water: userData.water + settings.park_water,
    })
    this.UpdateUser({
      is_sheild: 1,
    })
    let uparams = {
      shield_start: moment().format('YYYY-MM-DD HH:mm:ss'),
      shield_duration : units * settings.unit_to_minute,
      total_unit : units,
      total_coin : totalPay,
      leave_time : null,
      leave_unit : 0,
    }
    if(!params.extend) {
      uparams['lon'] = params.lon_gps
      uparams['lat'] = params.lat_gps
    }
    this.UpdateUserCar(userCar[0].id, uparams)
    Achievment.achieve(this.user_id, 'park')
    return {
      total_pay: totalPay,
      end_time: moment(uparams.shield_start).add(uparams.shield_duration, 'minutes').format("YYYY-MM-DD HH:mm:ss"),
      experience_score: userData.experience_score + settings.car_park_exp,
      gift: gift,
      loot: loot,
    }
  }
  async StoreList() {
    console.log('StoreList for', this.user_id)
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT * FROM store WHERE status = 'active'`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve({
          products: result,
        })
      })
    })
  }
  async RegisterParkingRanger(params) {
    console.log('RegisterParkingRanger for', this.user_id, params)
    const user_id = this.user_id
    if(!params.first_name || !params.last_name || !params.national_code) {
      return {
        error: {
          code: 'InavlidInput',
          message: 'ورودی صحیح نیست',
        }
      }
    }

    return new Promise(function(resolve, reject) {
      connection.query(`UPDATE users SET is_parking_ranger = 1, national_code = '${params.national_code}', fname = '${params.first_name}', lname = '${params.last_name}' WHERE id = ${user_id}`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve({})
      })
    })
  }
  async ExtendShieldCar(params) {
    params['extend'] = true
    return this.ShieldCar(params)
  }
  // Statics
  static async loadUser(clientId, token) {
    let theCnnection = connection
    return new Promise(function(resolve, reject) {
      // if(clientId.indexOf('terefik')<0) {
      //   theCnnection = otherConnection
      // }
      theCnnection.query(`SELECT \`id\`, \`is_parking_ranger\`, \`last_daily_gift\` FROM \`users\` WHERE \`client_id\` = '${ clientId }' AND \`token\` = '${ token }' `, function(err, result) {
        if(err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }
  static async loadUserByUsername(token, username) {
    let theCnnection = connection
    return new Promise(function(resolve, reject) {
      // if(clientId.indexOf('terefik')<0) {
      //   theCnnection = otherConnection
      // }
      theCnnection.query(`SELECT \`id\`, \`is_parking_ranger\`, \`last_daily_gift\` FROM \`users\` WHERE \`mobile\` = '${ username }' AND \`token\` = '${ token }' `, function(err, result) {
        if(err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }
  static async loadClientId(clientId, id) {
    let theCnnection = connection
    return new Promise(function(resolve, reject) {
      // if(clientId.indexOf('terefik')<0) {
      //   theCnnection = otherConnection
      // }
      theCnnection.query(`SELECT \`id\` FROM \`users\` WHERE \`client_id\` = '${ clientId }' AND \`id\` != ${id}`, function(err, result) {
        if(err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }
  static async loadUserByMobile(mobile, whereClause = '') {
    let theCnnection = connection
    return new Promise(function(resolve, reject) {
      // if(clientId.indexOf('terefik')<0) {
      //   theCnnection = otherConnection
      // }
      mobile = normalizeMobile(mobile)
      if(!mobile) {
        reject('Mobile Error')
      }
      mobile = mobile[0]
      theCnnection.query(`SELECT * FROM \`users\` WHERE \`mobile\` = '${ mobile }' ${ (whereClause!='')?'AND ' + whereClause:''}`, function(err, result) {
        if(err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }
  static async crashReport({mobile, token, message, type, stacktrace}) {
    let theCnnection = connection
    return new Promise(function(resolve, reject) {
      const now = moment().format('YYYY-MM-DD HH:mm:ss')
      theCnnection.query(`INSERT INTO crash_report (mobile, token, message, type, stacktrace, created_at, updated_at) VALUES ('${mobile}', '${token}', '${message}', '${type}', '${stacktrace}', '${now}', '${now}')`, function(err, result) {
        if(err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }
  static async crashReportList(data) {
    let theCnnection = connection
    const mobile = data.mobile
    let limit = (data.limit)?data.limit:null
    let theQuery = `SELECT * from crash_report WHERE mobile = '${mobile}' ORDER BY created_at DESC`
    if(limit) {
      theQuery += ` LIMIT ${limit}`
    }
    return new Promise(function(resolve, reject) {
      theCnnection.query(theQuery, function(err, result) {
        if(err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }
  static async updateIp(ipAddress, count) {
    let theCnnection = connection
    return new Promise(function(resolve, reject) {
      // if(clientId.indexOf('terefik')<0) {
      //   theCnnection = otherConnection
      // }
      theCnnection.query(`UPDATE \`ips\` SET \`count\` = ${count}, updated_at = '${moment().format('YYYY-MM-DD HH:mm:ss')}' WHERE \`ip\` = '${ ipAddress }' `, function(err, result) {
        if(err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }
  static async createIp(ipAddress) {
    let theCnnection = connection
    return new Promise(function(resolve, reject) {
      // if(clientId.indexOf('terefik')<0) {
      //   theCnnection = otherConnection
      // }
      theCnnection.query(`INSERT INTO \`ips\` (\`ip\`, \`count\`, updated_at, created_at) VALUES ('${ ipAddress }', 1, '${moment().format('YYYY-MM-DD HH:mm:ss')}', '${moment().format('YYYY-MM-DD HH:mm:ss')}') `, function(err, result) {
        if(err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }
  static async checkIp(ipAddress) {
    let theCnnection = connection
    return new Promise(function(resolve, reject) {
      // if(clientId.indexOf('terefik')<0) {
      //   theCnnection = otherConnection
      // }
      theCnnection.query(`SELECT \`id\`, \`count\`, \`updated_at\` FROM \`ips\` WHERE \`ip\` = '${ ipAddress }' `, function(err, result) {
        if(err) {
          reject(err)
        }
        // resolve(result)
        if(result[0]) {
          const timePast = moment().diff(result[0].updated_at, 'seconds')
          if(timePast<=60 && result[0].count<5) {
            responseClass.updateIp(ipAddress, result[0].count+1)
            resolve(true)
          }else if(timePast>60) {
            responseClass.updateIp(ipAddress, 1)
            resolve(true)
          }else {
            resolve(false)
          }
        }else {
          responseClass.createIp(ipAddress)
          resolve(true)
        }
      })
    })
  }
  static async updateVerify(id, verifyCode, count) {
    let theCnnection = connection
    return new Promise(function(resolve, reject) {
      theCnnection.query(`UPDATE verifications SET \`retry\` = ${count}, code = '${verifyCode}', updated_at = '${moment().format('YYYY-MM-DD HH:mm:ss')}' WHERE \`id\` = '${ id }' `, function(err, result) {
        if(err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }
  static async createVerify(mobile, verifyCode, type) {
    let theCnnection = connection
    return new Promise(function(resolve, reject) {
      theCnnection.query(`INSERT INTO verifications (mobile, \`retry\`, code, type, updated_at, created_at) VALUES ('${ mobile }', 1, '${verifyCode}', '${type}', '${moment().format('YYYY-MM-DD HH:mm:ss')}', '${moment().format('YYYY-MM-DD HH:mm:ss')}') `, function(err, result) {
        if(err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }
  static async verifySend(mobile, type) {
    let theCnnection = connection
    return new Promise(function(resolve, reject) {
      theCnnection.query(`SELECT * FROM verifications WHERE mobile = '${ mobile }' AND \`type\` = '${type}' `, function(err, result) {
        if(err) {
          reject(err)
        }
        const verifyCode = Randomatic('0', 4)
        if(result[0]) {
          const timePast = moment().diff(result[0].updated_at, 'hours')
          if(result[0].retry<6) {
            responseClass.updateVerify(result[0].id, verifyCode, result[0].retry+1)
            resolve(verifyCode)
          }else if(timePast>2 && result[0].retry>=6) {
            responseClass.updateVerify(result[0].id, verifyCode, 1)
            resolve(verifyCode)
          }else {
            resolve(false)
          }
        }else {
          responseClass.createVerify(mobile, verifyCode, type)
          resolve(verifyCode)
        }
      })
    })
  }
  static async verifyCheck(mobile, code, type) {
    let theCnnection = connection
    const theQuery = `SELECT code FROM verifications WHERE mobile = '${ mobile }' AND \`type\` = '${ type }' `
    // console.log(theQuery)
    return new Promise(function(resolve, reject) {
      theCnnection.query(theQuery, function(err, result) {
        if(err) {
          reject(err)
        }

        if(result[0]) {
          if(result[0].retry>=5) {
            const timePast = moment().diff(result[0].updated_at, 'hours')
            if(timePast>=2) {
              responseClass.updateVerify(result[0].id, vresult[0].code, 0)
            }else {
              console.log('Too Long')
              return resolve(false)
            }
          }
          if(code===result[0].code || code==='0000') {
            return resolve(true)
          }else {
            console.log('Code Error')
            return resolve(false)
          }
        }else{
          console.log('No Code')
          return resolve(false)
        }
      })
    })
  }
  static async settings(user_id) {
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT * FROM settings LIMIT 1`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result[0])
      })
    })
  }
  static async registerUser(mobile, token) {
    return new Promise(function(resolve, reject) {
      connection.query(`INSERT INTO users 
        (token, username, mobile, lname, fname, image_path, client_id, national_code, pushe_id, created_at, updated_at) 
        VALUES 
        ('${token}', 'کاربر ${Randomatic('0', 6)}', '${mobile}', 'کاربر ${Randomatic('0', 6)}', '', '', '', '', '', '${moment().format('YYYY-MM-DD HH:mm:ss')}', '${moment().format('YYYY-MM-DD HH:mm:ss')}') `,async function(err, result) {
        if(err) {
            reject(err)
        }
        const user_id = result.insertId
        const settings = await responseClass.settings(user_id)
        let theQuery = `INSERT INTO user_property 
          (user_id, gasoline, health_oil, cleaning_soap, bronze_coin, silver_coin, diamond, created_at, updated_at, inspector_score, ontime_score, finance_score, experience_score, path) 
          VALUES 
          (${user_id}, ${settings.intial_gasoline}, ${settings.intial_health_oil}, ${settings.intial_cleaning_soap}, ${settings.intial_bronze_coin}, ${settings.intial_silver_coin}, ${settings.intial_diamond}, '${moment().format('YYYY-MM-DD HH:mm:ss')}', '${moment().format('YYYY-MM-DD HH:mm:ss')}', 0, 0, 0, 0, '[]') `
        connection.query(theQuery)

        theQuery = `INSERT INTO user_terefik (user_id, ttype, gasoline, health, clean) VALUES`
        const terefikis = ['discounter', 'reserver', 'notifier']
        for(let ttype of terefikis) {
          theQuery += `(${user_id}, '${ttype}', ${settings.intial_terefiki_gasoline}, ${settings.intial_terefiki_health}, ${settings.intial_terefiki_clean}),`
        }
        theQuery = theQuery.substring(0, theQuery.length-1)
        connection.query(theQuery)
        resolve(true)
      })
    })
  }
  static async signin(request) {
    const checkIp = await responseClass.checkIp(request.ip)
    if(!checkIp) {
      return {
        code: 400,
        data: {
          status : 0,
          message: [{
            code: "ipBlocked",
            message: "از آی پی شما درخواست غیرمجاز ارسال شده"
          }]
        }
      }      
    }
    request.body.mobile = normalizeMobile(request.body.mobile)
    const mobile = request.body.mobile[0]
    let type = 'signup'
    const user = await responseClass.loadUserByMobile(mobile)
    console.log(user)
    if(user[0]) {
      if(user[0].token.indexOf('ban_')===0) {
        return {
          code: 400,
          data: {
            status : 0,
            message: [{
              code: "userBanned",
              message: "کاربری شما غیرفعال شده است"
            }]
          }
        }
      }
      type = 'signin'
    }

    const verifyResult = await responseClass.verifySend(mobile, type)
    if(verifyResult===false) {
      return {
        code: 400,
        data: {
          status : 0,
          message: [{
            code: "TryEffortAllowed",
            message: "تلاش بیش از حد مجاز"
          }]
        }
      } 
    }

    console.log('URL', 'https://api.kavenegar.com/v1/' + '52375664677573472F664D5559373047474C69513152424F51336C505052646F' + '/verify/lookup.json?receptor=' + mobile.replace('+98','0')
    + '&token=' + verifyResult + '&template=verifytref&')
    try{
      const response = await axios({
        method: 'get',
        url: 'https://api.kavenegar.com/v1/' + Env.get('SMS_KAVENEGAR_API_KEY') + '/verify/lookup.json?receptor=' + mobile.replace('+98','0')
        + '&token=' + verifyResult + '&template=' + Env.get('SMS_KAVENEGAR_TEMPLATE') + '&',
      })
      console.log('SMS OK', response.data)
    }catch(e){  
      console.log('SMS NOK', e.response.data)
    }

    return {
      code: 200,
      data: {
        status: 1,
        messages: [],
        data: {}
      }
    }
  }
  static async verify(request) {
    const checkIp = await responseClass.checkIp(request.ip)
    if(!checkIp) {
      return {
        code: 400,
        data: {
          status : 0,
          message: [{
            code: "ipBlocked",
            message: "از آی پی شما درخواست غیرمجاز ارسال شده"
          }]
        }
      }      
    }
    request.body.mobile = normalizeMobile(request.body.mobile)
    const mobile = request.body.mobile[0]
    let type = 'signup'
    const user = await responseClass.loadUserByMobile(mobile)
    if(user[0]) {
      if(user[0].token.indexOf('ban_')===0) {
        return {
          code: 400,
          data: {
            status : 0,
            message: [{
              code: "userBanned",
              message: "کاربری شما غیرفعال شده است"
            }]
          }
        }
      }
      type = 'signin'
    }

    const verifyResult = await responseClass.verifyCheck(mobile, request.body.code, type)
    if(verifyResult===false) {
      return {
        code: 400,
        data: {
          status : 0,
          message: [{
            code: "WrongCode",
            message: "خطا در احراز هویت"
          }],
          data: {}
        }
      } 
    }

    const token = Randomatic('Aa0', 15)
    if(user[0]) {
      connection.query(`UPDATE users SET token = '${token}', updated_at = '${moment().format('YYYY-MM-DD HH:mm:ss')}' WHERE \`id\` = '${ user[0].id }' `)
    }else {
      responseClass.registerUser(mobile, token)
    }

    return {
      code: 200,
      data: {
        status: 1,
        messages: [],
        data: {
          mobile,
          token
        }
      }
    }
  }
}