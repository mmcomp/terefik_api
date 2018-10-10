'use strict'

const Database = use('Database')
const UserZone = use('App/Models/UserZone')

const ArrestZoneHook = exports = module.exports = {}

ArrestZoneHook.zoneDetect = async (rangerWork) => {
    let zones = await UserZone.query().where('users_id', rangerWork.ranger_id).pluck('zone_id')
    rangerWork.zone_id = 0
    if(zones.length>0) {
        console.log('Zones', zones)

        let query = "SELECT id FROM zone WHERE id in (" + zones.join(',') + ") and st_intersects(shape, point(" + rangerWork.lon_gps + ", " + rangerWork.lat_gps + "))=1"
        let res = await Database.raw(query)
        console.log('Location Zone', res)
        if(res[0].length>0) {
            console.log('Zone Found')
            console.log(res[0][0].id)
            rangerWork.zone_id = res[0][0].id
        }else {
            throw new Error('Zone Not Allowd')
        }
    
    }else {
        throw new Error('Zone Not Allowd')
    }
}
