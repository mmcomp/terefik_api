'use strict'

const Model = use('Model')

class Task extends Model {
    static get table () {
        return 'tasks'
    }

    static get createdAtColumn () {
        return 'created_at'
    }

    static get updatedAtColumn () {
        return 'updated_at'
    }
}

module.exports = Task
