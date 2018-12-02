'use strict'

const Validations = use('App/Libs/Validations')
const Property = use('App/Models/Property')

class UserController {
  static async profile (params, user) {
    await user.loadMany(['property.experience', 'property.inspector', 'terefik'])


    return [{
      status: 1,
      messages: [],
      data: {
        profile: user.toJSON()
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
      let users = await Property.query().with('user').orderBy('experience_score', 'desc').limit(50).fetch()
      users = users.toJSON()
      let leads = []

      for(let theUser of users) {
        leads.push({
          image_path: theUser.user.image_path,
          score: theUser.experience_score
        })
      }
      return [{
        status: 1,
        messages: [],
        data: {
          experience_leaders: leads
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

  static async finLeader (params, user) {
    try{
      let users = await Property.query().with('user').orderBy('finance_score', 'desc').limit(50).fetch()
      users = users.toJSON()
      let leads = []

      for(let theUser of users) {
        leads.push({
          image_path: theUser.user.image_path,
          score: theUser.finance_score
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
          score: theUser.ontime_score
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
      let users = await Property.query().with('user').orderBy('inspector_score', 'desc').limit(50).fetch()
      users = users.toJSON()
      let leads = []

      for(let theUser of users) {
        leads.push({
          image_path: theUser.user.image_path,
          score: theUser.inspector_score
        })
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
}

module.exports = UserController
