'use strict'

const Model = use('Model')

class InspectorDailyReport extends Model {
    static get table () {
        return 'inspector_daily_report'
    }

    user () {
        return this.belongsTo('App/Models/User', 'user_id', 'id')
    }
}

module.exports = InspectorDailyReport
