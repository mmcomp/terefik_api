require('./fast')
const phone = require('phone')
const Env = use('Env')
const fastify = require('fastify')({ logger: false })
const responseClass = require('./fast')
const fs = require('fs')
const pump = require('pump')
const Randomatic = require('randomatic')

function normalizeMobile (mobile, country = 'IR') {
  const normalMobile = phone(mobile, country)

  if (normalMobile.length) {
    return normalMobile
  }

  return false
}

fastify.register(require('fastify-multipart'))

fastify.register(require('fastify-formbody'))

// Mqtt Broker
fastify.post('/mqtt/auth', async (request, reply) => {
  if (Env.get('SERVER_CLIENT') == request.body.clientid || Env.get('SERVER_CLIENT') == `ad_${request.body.clientid}` || request.body.clientid == 'terefik' || Env.get('FAST_CLIENT') == request.body.clientid) {
    return {}
  }

  request.body['username'] = normalizeMobile(request.body.username)
  if(request.body.username===false) {
    return reply.code(401).send({})
  }
  request.body.username = request.body.username[0]

  const user = await responseClass.loadUserByUsername(request.body.password, request.body.username)
  if(!user[0]) {
    return reply.code(401).send({})
  }
  const clientId = await responseClass.loadClientId(request.body.clientid, user[0].id)
  if(clientId[0]) {
    return reply.code(401).send({})
  }
  let responseObject = new responseClass(user[0].id, user[0].is_parking_ranger, user[0].last_daily_gift)
  responseObject.UpdateUser({
    client_id: request.body.clientid
  })
  return {}
})
fastify.post('/mqtt/superuser', async (request, reply) => {
  return {}
})
fastify.get('/mqtt/acl', async (request, reply) => {
  console.log('/mqtt/acl')
  console.log(request.params)
  return { hello: 'world' }
})
// Crash report
fastify.post('/crashreport', async (request, reply) => {
  responseClass.crashReport(request.body)
  return {}
})
fastify.get('/crashreport/:mobile/:limit', async (request, reply) => {
  const result = await responseClass.crashReportList(request.params)
  return result
})
fastify.get('/crashreport/:mobile', async (request, reply) => {
  const result = await responseClass.crashReportList(request.params)
  return result
})
// File Upload Download
fastify.post('/upload', async (req, reply) => {
  let newFileName = '', body = {}
  const mp = req.multipart(handler,async function (err) {
    if(!normalizeMobile(body.mobile)) {
      reply.code(400).send()
    }else {
      body.mobile = normalizeMobile(body.mobile)[0]
      const user = await responseClass.loadUserByUsername(body.token, body.mobile)
      if(!user[0]) {
        reply.code(401).send({})
      }else {
        const doc_type = (body['doc_type'])?body['doc_type']:'profile'
        let responseObject = new responseClass(user[0].id, user[0].is_parking_ranger, user[0].last_daily_gift)
        if(doc_type=='profile') {
          console.log('change profile')
          responseObject.UpdateUser({
            image_path: newFileName,
          })
          reply.code(200).send()
        }else if(doc_type!='arrest' && doc_type!='texture') {
          let result = await responseObject.UpdateParkingRangerDoc({
            file_path: newFileName,
            doc_type
          })
          if(result.affectedRows==0 && result.changedRows==0) {
            result = responseObject.InsertParkingRangerDoc({
              file_path: newFileName,
              doc_type: doc_type,
            })
          }
          reply.code(200).send()
        }else if(doc_type=='arrest') {
          // console.log('Body', body)
          if(!body.arrest_id) {
            reply.code(400).send()
          }else {
            responseObject.UpdateRangerWork({
              image_path: newFileName,
              id: body.arrest_id
            })
            reply.code(200).send()
          }
        }
      }
    }
  })
  mp.on('field', function (key, value) {
    // console.log('form-data', key, value)
    body[key] = value
  })

  function handler (field, file, filename, encoding, mimetype) {
    let fileExt = 'jpg'
    if(filename.split('.').length>1) {
      fileExt = filename.split('.')[filename.split('.').length-1]
    }
    newFileName = `${Randomatic('Aa0', 15)}.${fileExt}`
    console.log('File Path', `${__dirname.replace(/start/g, 'tmp')}/uploads/${newFileName}`)
    pump(file, fs.createWriteStream(`${__dirname.replace(/start/g, 'tmp')}/uploads/${newFileName}`))
    // console.log(newFileName)
  }
})
// Start
const start = async () => {
  try {
    await fastify.listen(3334, '0.0.0.0')
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()