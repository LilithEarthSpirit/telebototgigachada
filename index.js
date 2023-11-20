import dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import {translateWords, getRandom} from './utils/dictionary.mjs'
import { LevelController, TaskController } from './controllers/index.mjs'

dotenv.config()

const bot = new TelegramBot(process.env.TOKEN,{polling:true})

bot.onText(/\/start/, async (ctx) => {
  bot.sendMessage(
    ctx.chat.id,
    `Привет, ${ctx.chat.first_name}, меня зовут EngliPal, давай вместе изучим английский язык`,
    {
      reply_markup: {
        keyboard: [
          [
            {
              text: 'Словарь',
            },
            {
              text: 'Ежедневный минимум',
            },
          ],
          [
            {
              text: 'Тесты',
            },
          ],
        ],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    }
  )
})

bot.onText(/Словарь/, (text) => {
  const msgId = text.from.id
  bot.sendMessage(msgId, 'Введите текст\nстоп комманд - /stop')
  let isStopped = false
  bot.on('message', async ({ text }) => {
    if (text === '/stop' || isStopped) {
      isStopped = true
    } else {
      const lang = /[wa-z]+/.test(text) ? 'en|ru' : 'ru|en'
      const translate = await translateWords(text, lang)
      bot.sendMessage(
        msgId,
        `${lang === 'en|ru' ? '🇬🇧' : '🇷🇺'}${translate.source} - ${
          lang === 'en|ru' ? '🇷🇺' : '🇬🇧'
        }${translate.target}`
      )
    }
  })
})

bot.onText(/Ежедневный минимум/, async (text) => {
  const translates = await getRandom()
  const msgId = text.from.id
  const output = translates.reduce((acc, translate) => {
    acc += `*${translate.source}* - *${translate.target}*\n`
    return acc
  }, '')
  await bot.sendMessage(
    msgId,
    'Вам представлен массив слов, которые нужно изучить, тварь, время тебе до завтра.'
  )
  bot.sendMessage(msgId, output, { parse_mode: 'Markdown' })
})

bot.onText(/Тесты/, async (text) => {
  const msgId = text.from.id
  const titles = await LevelController.getTitles()

  bot.sendMessage(msgId, 'Выберите уровень', {
    reply_markup: {
      keyboard: [titles],
      resize_keyboard: true,
    },
  })
})

const goToNextTask = async (chatId, {levelName, offset, rightLength}) => {
  const task = await TaskController.getOneWithButtons(levelName, offset, rightLength)
  bot.sendMessage(chatId, `Вопрос #${offset + 1}. ${task.question}`, {
    reply_markup: {
      inline_keyboard: task.buttons,
      parse_mode: 'Markdown',
    },
  })
  return task
}

bot.on('message', async (msg) => {
  const clientId = msg.from.id
  const textClient = msg?.text
  const titles = await LevelController.getTitles()

  if (titles.includes(textClient)) {
    await goToNextTask(clientId, {
      levelName: textClient,
      offset: 0,
      rightLength: 0
    })
  }
})

bot.on('callback_query', async (query) => {
  const chatId = query.from.id

  const { size, offset, qa } = JSON.parse(query.data)
  let {rightLength} = JSON.parse(query.data)
  const [userAnwer, rightAnswer, levelName] = qa.split('_')
  const isRight = userAnwer === rightAnswer

  bot.editMessageReplyMarkup(
    {
      inline_keyboard: [
        [
          {
            text: isRight ? 'Верно ✅' : 'Неверно ❌',
            callback_data: isRight ? 'aboba' : 'sad',
          },
        ],
      ],
    },
    { chat_id: chatId, message_id: query.message.message_id }
  )
  rightLength = isRight ? rightLength + 1 : rightLength
  if (+offset + 1 === +size) {
    await bot.answerCallbackQuery(query.id, {
      text: `Правильных ответов: ${rightLength} из ${size}`,
      show_alert: true,
    })
  } else {
    await goToNextTask(chatId, {
      levelName,
      offset: offset + 1,
      rightLength: rightLength,
    })
  }
})
