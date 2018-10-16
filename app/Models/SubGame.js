'use strict'

const Model = use('Model')

class SubGame extends Model {
    static get table () {
        return 'sub_games'
    }

    static get createdAtColumn () {
        return 'created_at'
    }

    static get updatedAtColumn () {
        return 'updated_at'
    }
}

module.exports = SubGame
