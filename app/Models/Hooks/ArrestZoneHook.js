'use strict'

const Database = use('Database')
const UserZone = use('App/Models/UserZone')
const Property = use('App/Models/Property')
const InspectorDailyReport = use('App/Models/InspectorDailyReport')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

const ArrestZoneHook = exports = module.exports = {}

ArrestZoneHook.zoneDetect = async (rangerWork) => {
    let zones = await UserZone.query().where('users_id', rangerWork.ranger_id).pluck('zone_id')
    rangerWork.zone_id = 0
    if(zones.length>0) {
        let query = "SELECT id FROM zone WHERE id in (" + zones.join(',') + ") and st_intersects(shape, point(" + rangerWork.lon_gps + ", " + rangerWork.lat_gps + "))=1"
        let res = await Database.raw(query)
        if(res[0].length>0) {
            rangerWork.zone_id = res[0][0].id
        }
    }

    let userProperty = await Property.query().where('user_id', rangerWork.ranger_id).first()
    userProperty.inspector_work_count++
    await userProperty.save()

    let inspectorDailyReport = await InspectorDailyReport.query().where('user_id', rangerWork.ranger_id).whereRaw("created_at like  '" + Moment.now('YYYY-MM-DD') + "%'").first()
    if(!inspectorDailyReport) {
        inspectorDailyReport = new InspectorDailyReport
        inspectorDailyReport.user_id = rangerWork.ranger_id
        inspectorDailyReport.report_count = 0
    }
    inspectorDailyReport.report_count += 1
    await inspectorDailyReport.save()
}
