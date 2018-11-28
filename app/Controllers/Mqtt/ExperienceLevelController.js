'use strict'

const Property = use('App/Models/Property')

class ExperienceLevelController {
    static async index(params, user) {
        // await user.loadMany(['property'])
        let prts = await Property.all()

        return [{
            status: 1,
            messages: [],
            data: {
              out: prts.toJSON()
            }
          }]
      
    }
}

module.exports = ExperienceLevelController
