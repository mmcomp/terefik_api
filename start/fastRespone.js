'use strict'

const mqttclient = require('mqtt')
const Env = use('Env')
const mysql = require('mysql')
const moment = require('moment')

var connection = mysql.createPool({
  connectionLimit : 10,
  host     : Env.get('DB_HOST'),
  user     : Env.get('DB_USER'),
  password : Env.get('DB_PASSWORD'),
  database : Env.get('DB_DATABASE')
});

async function loadUser(clientId, token) {
  return new Promise(function(resolve, reject) {
    connection.query(`SELECT \`id\`, \`is_parking_ranger\`, \`last_daily_gift\` FROM \`users\` WHERE \`client_id\` = '${ clientId }' AND \`token\` = '${ token }' `, function(err, result) {
      if(err) {
        reject(err)
      }
      resolve(result)
    })
  })
}
class responseClass {
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
        connection.query(`SELECT COUNT(id) cid FROM notifications WHERE users_id = ${ user_id }`, function(err, res) {
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
    let fields = `unit_to_minute, unit_to_bronze_coin, unit_to_bronze_coin_2, unit_to_bronze_coin_3, unit_to_bronze_coin_4, unit_to_bronze_coin_5, unit_to_bronze_coin_6, unit_to_bronze_coin_7, unit_to_bronze_coin_8, unit_to_bronze_coin_9, unit_to_bronze_coin_10, unit_max, last_critical_version, last_version, user_diamond_gps`
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
    console.log('GetSettings for', this.user_id)
    const user_id = this.user_id
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT * FROM parking_registers WHERE users_id = ${ user_id } AND expired_at > '${ moment().format('YYYY-MM-DD HH:mm:ss') }'`, function(err, result) {
        if(err) {
          reject(err)
        }

        resolve(result)
      })
    })
  }
  async ListCar() {
    console.log('ListCar for', this.user_id)
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
          cars[i]['shieldDiff'] = (moment().diff(shieldFinish, 'seconds')>0)?null:-1*moment().diff(shieldFinish, 'seconds')
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
      output.cars = await this.ListCar()
      const parking_register = await this.ParkingRegister()
      for(let i = 0;i < output.cars.length;i++) {
        output.cars[i]['parking_register'] = null
        for(let j = 0;j < parking_register.length;j++) {
          if(parking_register[j].vehicle_id==output.cars[i].id) {
            if(!output.cars[i]['parking_register']){
              output.cars[i]['parking_register'] = []
            }
            output.cars[i]['parking_register'].push(parking_register[j])
          }
        }
      }
    }else {
      output.AllGift = await this.AllGift()
    }
    output.server_time = new Date()
    return output
  }
}



let fastclient = mqttclient.connect(Env.get('SERVER_MQTT'), {
  username: Env.get('FAST_USERNAME'),
  password: Env.get('FAST_PASSWORD'),
  clientId: Env.get('FAST_CLIENT')
})
fastclient.on('connect', function () {
  fastclient.subscribe(Env.get('FAST_SENDER_TOPIC'))
  console.log('FAST MQTT connected ...')
})
fastclient.on('message', async function(topic, message) {
  console.log('FAST Message:', message.toString())
  try{
    message = JSON.parse(message)
  }catch(e){
    console.log('FAST MQTT: Error in Message')
    console.log(e)
    message = null
  }
  if(message) {
    try{
      let user_id = await loadUser(message.client_id, message.token)
      const is_parking_ranger = user_id[0].is_parking_ranger
      const last_daily_gift = user_id[0].last_daily_gift
      user_id = user_id[0].id
      console.log('FAST MQTT: User ID',user_id)
      const theResponse = new responseClass(user_id, is_parking_ranger, last_daily_gift)
      let output = await theResponse[message.type]()
      output = {
        status: 1,
        messages: [],
        data: output,
        type: message.type,
      }
      fastclient.publish(`client_${ message.token }/${ message.type }`, JSON.stringify(output))
      console.log('Exec', message.type)
      console.log(JSON.stringify(output))
    }catch(e){
      console.log('FAST MQTT: User Error')
      console.log(e)
    }
  }
})
fastclient.on('error', function(err) {
  console.log('FAST MQTT ERROR', err)
})
