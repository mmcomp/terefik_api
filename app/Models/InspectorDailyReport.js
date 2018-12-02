'use strict'

const Model = use('Model')

class InspectorDailyReport extends Model {
    static get table () {
        return 'inspector_daily_report'
    }
}

module.exports = InspectorDailyReport
