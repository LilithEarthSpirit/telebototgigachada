import dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import { LevelController, TaskController } from './controllers/index.mjs'
import { getRandom, translateWords } from './utils/dictionary.mjs'

dotenv.config()

const bot = new TelegramBot(process.env.TOKEN, { polling: true })
const topics = ['Путешествия', 'Природа', 'Город']
const directions = [
  { label: 'Общее', value: 'common' },
  { label: 'Грамматика', value: 'grammar' },
]

bot.onText(/\/start/, async (ctx) => {
  bot.sendMessage(
    ctx.chat.id,
    `Привет, ${ctx.chat.first_name}, меня зовут EngliPal, давай вместе изучим английский язык`,
    {
      reply_markup: {
        keyboard: [
          [{ text: 'Словарь📖' }, { text: 'Ежедневный минимум🧠' }],
          [{ text: 'Тесты📝' }, { text: 'Источники📚' }],
        ],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    }
  )
})

bot.onText(/Словарь/, (msg) => {
  const msgId = msg.from.id
  bot.sendMessage(msgId, 'Введите текст\nстоп комманд - /stop')
  let isStopped = false
  const messageListener = async (msg) => {
    if (msg.text === '/stop' || isStopped) {
      isStopped = true
      bot.removeListener('message', messageListener)
    } else {
      const lang = /[wa-z]+/.test(msg.text) ? 'en|ru' : 'ru|en'
      const translate = await translateWords(msg.text, lang)
      bot.sendMessage(
        msgId,
        `${lang === 'en|ru' ? '🇬🇧' : '🇷🇺'}${translate.source} - ${
          lang === 'en|ru' ? '🇷🇺' : '🇬🇧'
        }${translate.target}`
      )
    }
  }
  bot.on('message', messageListener)
})

bot.onText(/Ежедневный минимум/, async (text) => {
  const msgId = text.from.id
  bot.sendMessage(msgId, 'Выберите тему:', {
    reply_markup: {
      keyboard: [
        ...topics.map((topic) => [{ text: topic }]),
        [{ text: 'Назад' }],
      ],
      resize_keyboard: true,
    },
  })
})

let selectedTopic = null

bot.on('message', async (msg) => {
  const clientId = msg.from.id
  const textClient = msg?.text

  if (textClient === 'Назад') {
    selectedTopic = null
    bot.sendMessage(clientId, 'Главное меню', {
      reply_markup: {
        keyboard: [
          [{ text: 'Словарь📖' }, { text: 'Ежедневный минимум🧠' }],
          [{ text: 'Тесты📝' }, { text: 'Источники📚' }],
        ],
        resize_keyboard: true,
      },
    })
  } else if (topics.includes(textClient)) {
    selectedTopic = textClient
    const translates = await getRandom(selectedTopic)
    const output = translates.reduce((acc, translate) => {
      acc += `*${translate.source.replace(
        /([\[\]\\])/g,
        '\\$1'
      )}* - *${translate.target.replace(/([\[\]\\])/g, '\\$1')}*\n`
      return acc
    }, '')
    await bot.sendMessage(
      clientId,
      `Вам представлен массив слов по теме "${selectedTopic}", которые нужно изучить за неделю. Время до следующего понедельника.`,
      { parse_mode: 'Markdown' }
    )
    bot.sendMessage(clientId, output, { parse_mode: 'Markdown' })
    selectedTopic = null
  }
})

bot.onText(/Тесты/, async (text) => {
  const msgId = text.from.id

  bot.sendMessage(msgId, 'Выберите направление', {
    reply_markup: {
      keyboard: [[directions[0].label, directions[1].label]],
      resize_keyboard: true,
    },
  })
})

bot.onText(/Источники/, async (text) => {
  const msgId = text.from.id
  bot.sendMessage(msgId, 'Выберите источник:', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Универсальный сайт для изучения английского языка',
            url: 'https://www.bistroenglish.com/',
          },
          { text: 'Грамматика', url: 'https://www.native-english.ru/grammar' },
        ],
        [
          {
            text: 'Тренировка чтения',
            url: 'https://nsportal.ru/shkola/inostrannye-yazyki/angliiskiy-yazyk/library/2017/12/01/pravila-chteniya-angliyskogo-yazyka',
          },
          {
            text: 'Изучение слов',
            url: 'https://online-london.com/blog/lexis/1000-slov-angliyskogo-yazyka/',
          },
        ],
      ],
    },
  })
})

const goToNextTask = async (
  chatId,
  { levelName, offset, rightLength, type }
) => {
  const task = await TaskController.getOneWithButtons(
    levelName,
    offset,
    rightLength,
    type
  )
  bot.sendMessage(chatId, `Вопрос #${offset + 1}. ${task.question}`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: task.buttons,
    },
  })
  return task
}

let selectedDirection = null
bot.on('message', async (msg) => {
  const clientId = msg.from.id
  const textClient = msg?.text
  const titles = await LevelController.getTitles()

  if (
    textClient === directions[0].label ||
    textClient === directions[1].label
  ) {
    selectedDirection = directions.find(
      (direction) => direction.label === textClient
    ).value
    bot.sendMessage(clientId, 'Выберите уровень', {
      reply_markup: {
        keyboard: [titles],
        resize_keyboard: true,
      },
    })
  } else if (titles.includes(textClient)) {
    await goToNextTask(clientId, {
      levelName: textClient,
      offset: 0,
      rightLength: 0,
      type: selectedDirection,
    })
    selectedDirection = null
  }
})

bot.on('callback_query', async (query) => {
  const chatId = query.from.id

  const { size, offset, qa } = JSON.parse(query.data)
  let { rightLength } = JSON.parse(query.data)
  const [userAnswer, rightAnswer, levelName, type] = qa.split('_')
  const isRight = userAnswer === rightAnswer
  bot.editMessageReplyMarkup(
    {
      inline_keyboard: [
        [
          {
            text: isRight ? 'Верно ✅' : 'Неверно ❌',
            callback_data: 'noop',
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
      type,
      offset: offset + 1,
      rightLength: rightLength,
    })
  }
})
