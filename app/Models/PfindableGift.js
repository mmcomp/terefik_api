'use strict'

const Model = use('Model')

class PfindableGift extends Model {
  static get table () {
    return 'pfindable_gifts'
  }

  static get createdAtColumn () {
    return 'created_at'
  }

  static get updatedAtColumn () {
    return 'updated_at'
  }
}

module.exports = PfindableGift
