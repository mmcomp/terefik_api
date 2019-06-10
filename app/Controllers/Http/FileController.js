'use strict'

const Helpers = use('Helpers')
const fs = use('fs')
const readFile = Helpers.promisify(fs.readFile)

const User = use('App/Models/User')
const UserTerefik = use('App/Models/UserTerefik')
const ParkingRangerDoc = use('App/Models/ParkingRangerDoc')
const UserFindableGift = use('App/Models/UserFindableGift')
const UserPfindableGift = use('App/Models/UserPfindableGift')
const Notification = use('App/Models/Notification')

const Redis = use('Redis')

const Zone = use('App/Models/Zone')

const Moment = use('App/Libs/Moment')
const Time = Moment.moment()

class FileController {
  async upload ({
    request,
    response
  }) {
    console.log('File Upload Started')
    try{
      if(!request.file('the_file') || !request.all()['mobile'] || !request.all()['token']) {
        console.log('InputError')
        return response.status(400).send({
          status: 0,
          messages: [{
            code: 'InputError',
            message: 'داده های ورودی کافی نمی باشد'
          }],
          data: {}
        })
      }
  
      if(request.all()['mobile'].indexOf('9')!=0 && request.all()['mobile'].indexOf('09')!=0 && request.all()['mobile'].indexOf('+989')!=0) {
        console.log('MobileNotCurrect')
        return response.status(400).send({
          status: 0,
          messages: [{
            code: 'MobileNotCurrect',
            message: 'شماره موبایل صحیح نمی باشد'
          }],
          data: {}
        })
      }
      
      if(request.all()['mobile'].indexOf('9')==0) {
        request.all()['mobile'] = '0' + request.all()['mobile']
      }
  
      let user = await User.query().where('mobile', request.all()['mobile']).where('token', request.all()['token']).first()
      if(!user) {
        return response.status(400).send({
          status: 0,
          messages: [{
            code: 'UserNotFound',
            message: 'کاربری شما معتبر نمی باشد'
          }],
          data: {}
        })
      }
  
      let doc_type = (request.all()['doc_type'])?request.all()['doc_type']:'profile'

      const profilePic = request.file('the_file', {
        types: ['image'],
        size: '2mb'
      })
  
      let filename = User.getToken()
      let ext = profilePic.clientName.split('.')[profilePic.clientName.split('.').length-1]
      filename = filename + '.' + ext

      await profilePic.move(Helpers.tmpPath('uploads'), {
        name: filename
      })
  
      if (!profilePic.moved()) {
        console.log('Upload Error')
        console.log(profilePic.error())
        let err = profilePic.error()
        if(err.type=='size') {
          return response.status(400).send({
            status: 0,
            messages: [{
              code: 'UploadError',
              message: 'حجم عکس می بایست حداکثر ۲ مگابایت باشد'
            }],
            data: {}
          })  
        }else {
          return response.status(400).send({
            status: 0,
            messages: [{
              code: 'UploadError',
              message: 'ذخیره تصویر در سرور با مشکل مواجه شد'
            }],
            data: {}
          })  
        }
      }
  
      if(doc_type=='profile') {
        user.image_path = filename
        await user.save()
      } else if(doc_type!='arrest' && doc_type!='texture') {
        let parkingRangerDoc = await ParkingRangerDoc.query().where('doc_type', doc_type).where('users_id', user.id).first()

        if(parkingRangerDoc) {
          parkingRangerDoc.details = (request.all()['details'])?request.all()['details']:''
          parkingRangerDoc.file_path = filename
        } else {
          parkingRangerDoc = new ParkingRangerDoc
          parkingRangerDoc.doc_type = doc_type
          parkingRangerDoc.details = (request.all()['details'])?request.all()['details']:''
          parkingRangerDoc.file_path = filename
          parkingRangerDoc.users_id = user.id  
        }

        await parkingRangerDoc.save()
      }else if(doc_type=='texture') {
        if(request.all()['terefiki_id']) {
          let userTrefik = await UserTerefik.find(request.all()['terefiki_id'])
          if(!userTrefik) {
            return response.status(400).send({
              status: 0,
              messages: [{
                code: 'TerefikNotFound',
                message: 'ترفیکی مورد نظر یافت نشد'
              }],
              data: {}
            })
          }
          userTerefik.body_texture = filename
          userTrefik.body_texture_time = Moment.now('YYYY-MM-DD HH:mm:ss')
          await userTrefik.save();          
        }
      }

      return response.send({
        status: 1,
        messages: [],
        data: {
          image_path: filename
        }
      })
    }catch(e) {
      console.log('Upload Error:')
      console.log(e)
      return response.status(400).send({
        status: 0,
        messages: [{
          code: 'UploadError',
          message: 'ارسال تصویر با مشکل مواجه شد'
        }],
        data: {}
      })
    }
  }

  async download ({
    request,
    response,
    params
  }) {
    try{
      console.log(request.method())
      console.log('Params')
      console.log(params)
      if(!params || !params.filename) {
        response.header('Error', 'FilenameNeeded')
        return response.status(400).send({
          status: 0,
          messages: [{
            code: 'FilenameNeeded',
            message: 'ورود نام فایل الزامی است'
          }],
          data: {}
        })
      }
      let filePath = Helpers.appRoot() + '/tmp/uploads/' + params.filename
      if (!fs.existsSync(filePath)) {
        response.header('Error', 'FileNotFound')
        return response.status(400).send({
          status: 0,
          messages: [{
            code: 'FileNotFound',
            message: 'فایل مورد نظر پیدا نشد'
          }],
          data: {}
        })
      }

      if(request.method()=='GET') {
        console.log('Reading ' + filePath)
        let contents = await readFile(Helpers.appRoot() + '/tmp/uploads/' + params.filename)
        response.header('File-Updated-At', Moment.now('YYYY-MM-DD HH:mm:ss'))
        return response.send(contents)  
      }else if(request.method()=='HEAD') {
        console.log('Head request')
        let userTrefik = await UserTerefik.query().where('body_texture', params.filename).first()
        if(!userTrefik) {
          console.log('Terefiki not found')
          response.header('Error', 'TerefikiNotFound')
          return response.status(400).send({
            status: 0,
            messages: [{
              code: 'TerefikiNotFound',
              message: 'ترفیکی مورد نظر پیدا نشد'
            }],
            data: {}
          })
        }
        console.log('Adding to Header')
        response.header('File-Updated-At', userTrefik.body_texture_time)
        return response.status(200)
      }
    }catch(e){
      console.log(e)
      return response.status(400).send({
        status: 0,
        messages: [{
          code: 'FileDownloadError',
          message: 'دریافت فایل با مشکل مواجه شد'
        }],
        data: {}
      })
    }
  }

  async testGift ({
    request,
    response,
    params
  }) {
    try{
      // let gift_id = await UserPfindableGift.tryToGetGift(3, 4)
      // console.log('test gift result', gift_id)
      // let notification = new Notification
      // notification.title = 'AAAA'
      // notification.message = 'BBB'
      // notification.users_id = 3
      // notification.data = JSON.stringify({
      //   gasoline: -100,
      //   health: -19,
      //   cleaning: -14,
      //   diamond: -12,
      //   arrest_id: 120,
      // })
      // notification.type = 'user_arrest'
      // notification.save()
      // await Zone.addCar(1 ,1)
      // const zone_id = 3
      // const car_id = 1

      // const stageKey = `car_${ car_id }_${ zone_id }`
      // await Redis.select(1)
      // let tmp = await Redis.hgetall(stageKey)
      // if(tmp.zone_id) {
      // }else {
      //   await Redis.hmset(stageKey, ['zone_id', zone_id])
      //   let theZone = await Zone.find(zone_id)
      //   if(theZone) {
      //     theZone.current_car_count++
      //     if(theZone.current_car_count>theZone.max_car_count) {
      //       theZone.max_car_count = theZone.current_car_count
      //     }
      //     await theZone.save()
      //   }
      // }
      // await Redis.expire(stageKey, 10)
      // console.log(tmp)
      Notification.sendSms('09120172768', 'test')

    }catch(e) {
      console.log('test gift error')
      console.log(e)
    }
    return 'OK'
  }
}

module.exports = FileController
