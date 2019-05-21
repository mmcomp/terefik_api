'use strict'

// همانطور که قیلا گفته شد بازی ها در سیستم بروی redis اجرا می شوند و به ازای هر بازی یک داده روی redis ذخیره می شه به همراه مقدار expire که این مقدار به ازای هر بازی متفاوت است .
// از expire به زمانی استفاده می شود که کاربر وسط اجرای مین روبی یا اسمشر بازی از بازی خارج می شود و عملا بازی به پایان نمی رسد
// در این زمان پس از expire شدن آن کلید در redis خود redis یک event فایر می کند که این یعنی زمان expire این داده فرا رسیده است و ما در این فایل چک می کنیم که این داده که expire شده مربوط به کدام بازی است و اعمالی که برای باخت و یا کنسلی بازیکن در نظر گرفته ایم را روی کاربر اجرا می کنیم .
// به این شکل بازی هایی که به پایان نرسیده اند و وسط بازی کاربر خارج شده اند نیز هندل می شوند .

const GameSession = use('App/Models/GameSession')
const Property = use('App/Models/Property')
const Message = use('App/Models/Message')
const User = use('App/Models/User')
const Zone = use('App/Models/Zone')

const Redis = use('Redis')

Redis.select('1')
Redis.psubscribe('__keyevent@?__:expired', async (message, channel, pattern) => {
  try {
    const channelParse = channel.split('_')
    let gameSession
    switch (channelParse[0]) {
      case 'car':
        if(channelParse.length===3) {
          const zone_id = channelParse[2]
          let theZone = await Zone.find(zone_id)
          if(theZone && theZone.current_car_count>0) {
            theZone.current_car_count--
            theZone.save()
          }
        }
        break
      case 'attack':
        gameSession = await GameSession.query().where('type', '!=', 'system').where('session_id', channel).first()
        if (gameSession) {
          // let user = await User.query().where('id', gameSession.user_id).first()
          // user.game_lose++
          // user.courage('sub', 1)

          // await user.save()

          let award = {
            gasoline: 0,
            health_oil: 0,
            cleaning_soap : 0,
            win: false,
            revenge: true,
          }

          await Message.create({
            user_id: gameSession.userDefence,
            sender_id: user.id,
            type: 'attack',
            status: 'unread',
            sticker_id: -1,
            message: JSON.stringify(award)
          })

          await gameSession.delete()
        }
        break
    }
  } catch (error) {
    // SentryException.captureException(error)
  }
})
