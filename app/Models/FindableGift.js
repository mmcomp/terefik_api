'use strict'

const Model = use('Model')

class FindableGift extends Model {
  static get table () {
    return 'findable_gifts'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }
}

module.exports = FindableGift
