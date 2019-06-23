'use strict'

const mqttclient = require('mqtt')
const Env = use('Env')
const mysql = require('mysql')

var connection = mysql.createPool({
  connectionLimit : 10,
  host     : Env.get('DB_HOST'),
  user     : Env.get('DB_USER'),
  password : Env.get('DB_PASSWORD'),
  database : Env.get('DB_DATABASE')
});

async function loadUser(clientId, token) {
  return new Promise(function(resolve, reject) {
    connection.query(`SELECT \`id\` FROM \`users\` WHERE \`client_id\` = '${ clientId }' AND \`token\` = '${ token }' `, function(err, result) {
      if(err) {
        reject(err)
      }
      resolve(result)
    })
  })
}
class responseClass {
  constructor(user_id) {
    this.user_id = user_id
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
      user_id = user_id[0].id
      console.log('FAST MQTT: User ID',user_id)
      const theResponse = new responseClass(user_id)
      let output = await theResponse[message.type]()
      output = {
        status: 1,
        messages: [],
        data: output,
        type: message.type,
      }
      console.log('Exec', message.type)
      console.log(JSON.stringify(output))
      fastclient.publish(`client_${ message.token }/${ message.type }`, JSON.stringify(output))
    }catch(e){
      console.log('FAST MQTT: User Error')
      console.log(e)
    }
  }
})
fastclient.on('error', function(err) {
  console.log('FAST MQTT ERROR', err)
})
