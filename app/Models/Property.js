'use strict'

const Model = use('Model')

class Property extends Model {
  static boot () {
    super.boot()
    // this.addHook('afterFind', 'UserHook.loadExperienceLevel')
    // this.addHook('afterFetch', 'UserHook.loadExperienceLevels')
  }

  static get table () {
    return 'user_property'
  }


  // Relations
  user () {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }

  experience () {
    return this.hasOne('App/Models/ExperienceLevel', 'experience_level', 'id')
  }

  inspector () {
    return this.belongsTo('App/Models/InspectorLevel', 'inspector_level', 'id')
  }
}

module.exports = Property
