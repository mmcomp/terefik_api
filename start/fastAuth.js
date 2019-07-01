require('./fast')
const phone = require('phone')
const Env = use('Env')
const fastify = require('fastify')({ logger: true })
const responseClass = require('./fast')

function normalizeMobile (mobile, country = 'IR') {
  const normalMobile = phone(mobile, country)

  if (normalMobile.length) {
    return normalMobile
  }

  return false
}

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