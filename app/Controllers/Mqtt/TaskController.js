'use strict'

const User = use('App/Models/User')
const Task = use('App/Models/Task')

const Env = use('Env')
const Moment = use('App/Libs/Moment')
const Time = Moment.moment()
const Validations = use('App/Libs/Validations')
const _ = require('lodash')

class TaskController {
  static async get(params, user) {
    let tasks = await Task.all()
    tasks = tasks.toJSON()
    
    return [{
      status: 1,
      messages: [],
      data: {
        tasks: tasks
      }
    }]
  }
}

module.exports = TaskController
