'use strict'

const Model = use('Model')
const RangerWork = use('App/Models/RangerWork')
const Car = use('App/Models/Car')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

class InspectorDailyReport extends Model {
    static get table () {
        return 'inspector_daily_report'
    }

    user () {
        return this.belongsTo('App/Models/User', 'user_id', 'id')
    }

    async calculateImageProcessCount (current) {
        console.log('calculateImageProcessCount', this.user_id)
        let rangerNotImageProcessCount = 0
        let imageProcessingFails = 0
        let currentCar = null, currentPlateNumber = ''
        if(current) {
            currentCar = await Car.query().where('id', current.vehicle_id).first()
            if(currentCar) {
                currentPlateNumber = `${currentCar.number_3}${currentCar.number_ch}${currentCar.number_2}${currentCar.number_ir}`
            }
        }
        let result = await RangerWork.query().where('ranger_id', this.user_id).where('created_at', 'like', Time().format('YYYY-MM-DD') + '%').with('cars').fetch()
        let plateNumber = ''
        result = result.toJSON()
        console.log('Work Count', result.length)
        for(let res of result) {
            console.log('ID', res.id)
            console.log('image_processing_result', res.image_processing_result)
            if(!res.image_processing_result || res.image_processing_result=='')
            {
                rangerNotImageProcessCount++
                imageProcessingFails++
            }else {
                plateNumber = `${res.cars.number_3}${res.cars.number_ch}${res.cars.number_2}${res.cars.number_ir}`
                if(plateNumber!=res.image_processing_result) {
                    if(currentPlateNumber=='' || (currentPlateNumber!='' && currentPlateNumber!=res.image_processing_result)) {
                        rangerNotImageProcessCount++
                    }
                }
            }
        }
        console.log('rangerNotImageProcessCount', rangerNotImageProcessCount)
        console.log('imageProcessingFails', imageProcessingFails)
        // await InspectorDailyReport.query().where('id', this.id).update({
            // image_process_percent: rangerNotImageProcessCount,
            // image_process_fails: imageProcessingFails,
        // })
        return {
            image_process_percent: rangerNotImageProcessCount,
            image_process_fails: imageProcessingFails,
        }
    }
}

module.exports = InspectorDailyReport
