'use strict'
const UserAchievment = use('App/Models/UserAchievment')
const Model = use('Model')

class Achievment extends Model {
  static async achieve(user_id, action_type) {
    console.log('Checking Achievments')
    let possibleAchievments = await Achievment.query().where('action_type', action_type).pluck('id')
    console.log('Possible Achievment IDS for ' + action_type)
    console.log(possibleAchievments)
    let userAchievments = await UserAchievment.query().with('achievment').whereIn('achievments_id', possibleAchievments).where('users_id', user_id)/*.where('collected', 0)*/.fetch()
    let userAchievmentsData = userAchievments.toJSON()
    let userAchievmentIds = []
    console.log('Achievments that User Have of possibles')
    console.log(userAchievmentsData)
    for(let uAch of userAchievmentsData) {
      userAchievmentIds.push(uAch.achievments_id)
      if(uAch.collected==0) {
        if(uAch.achieved<uAch.achievment.total) {
          await UserAchievment.query().where('id', uAch).update({
            achieved: uAch.achieved+1
          })
        }else {
          console.log('Nailed Achiement id', uAch.achievment.id)
        }  
      }
    }

    let possibleAchievmentTags = await Achievment.query().where('action_type', action_type).groupBy('tag').pluck('tag'), newAchievment, newUserAchievment
    console.log('All Possicle Achievment Tags')
    console.log(possibleAchievmentTags)
    for(let tag of possibleAchievmentTags) {
      newAchievment = await Achievment.query().where('tag', tag).whereNotIn('id', userAchievmentIds).orderBy('level').first()
      if(newAchievment) {
        console.log('Next Level Achievment')
        console.log(newAchievment.toJSON())
        newUserAchievment = new UserAchievment
        newUserAchievment.users_id = user_id
        newUserAchievment.achievments_id = newAchievment.id
        newUserAchievment.achieved = 1
        await newUserAchievment.save()
      }
    }
  }
}

module.exports = Achievment
