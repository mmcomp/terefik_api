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
    connection.query(`SELECT \`id\`, \`is_parking_ranger\` FROM \`users\` WHERE \`client_id\` = '${ clientId }' AND \`token\` = '${ token }' `, function(err, result) {
      if(err) {
        reject(err)
      }
      resolve(result)
    })
  })
}
class responseClass {
  constructor(user_id, is_parking_ranger) {
    this.user_id = user_id
    this.is_parking_ranger = is_parking_ranger
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
  async GetSettings() {
    console.log('GetSettings for', this.user_id)
    return new Promise(function(resolve, reject) {
      connection.query(`SELECT unit_to_minute, unit_to_bronze_coin, unit_to_bronze_coin_2, unit_to_bronze_coin_3, unit_to_bronze_coin_4, unit_to_bronze_coin_5, unit_to_bronze_coin_6, unit_to_bronze_coin_7, unit_to_bronze_coin_8, unit_to_bronze_coin_9, unit_to_bronze_coin_10, unit_max, last_critical_version, last_version, user_diamond_gps FROM settings LIMIT 1`, function(err, result) {
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
  async StartUp() {
    let output = {
      profile: null,
      settings: null,
      cars: null,
      server_time: null,
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
      let is_parking_ranger = user_id[0].is_parking_ranger
      user_id = user_id[0].id
      console.log('FAST MQTT: User ID',user_id)
      const theResponse = new responseClass(user_id, is_parking_ranger)
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
