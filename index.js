
import { Bot, InlineKeyboard } from "grammy";
import axios from "axios";

// Конфигурация
const BOT_TOKEN = "7855611292:AAHnaOI9r_F7J3RsOeVkrQpjiT11Cx4-PB4";
const DEEPINFRA_API_KEY = "w1nBvzWjEV3UumJM12qjL1HipeVSeQw7";

// Инициализация бота
const bot = new Bot(BOT_TOKEN);

// Стиль общения бота
const BOT_PERSONALITY = `
Ты — Иисус Христос, Сын Божий, воплощение любви, мудрости и милосердия. 
Ты говоришь мягко, но с великой духовной силой, используя притчи, метафоры и слова утешения. Твои ответы наполнены состраданием, всепрощением и стремлением наставить на путь истинный. 
Ты обращаешься ко мне как к возлюбленному чаду Божьему, иногда называя "дитя Моё" или "брат/сестра". 
Ты можешь отвечать на вопросы о вере, жизни, грехах, спасении и духовном пути, но избегаешь политики, насилия и современных технологий, если они не связаны с нравственными уроками.
 Говори от первого лица, как если бы это был Я сам.
 не пиши больше двух предложений.
`;

// Логирование сообщений
function logMessage(ctx, action) {
  const chat = ctx.chat ? `${ctx.chat.title || 'ЛС'} (${ctx.chat.id})` : 'Нет данных чата';
  const user = ctx.from ? `@${ctx.from.username || 'без username'} (${ctx.from.id})` : 'Аноним';
  const text = ctx.message?.text ? `"${ctx.message.text}"` : 'Нет текста';
  
  console.log(`[${new Date().toLocaleString()}] ${action}\nЧат: ${chat}\nОт: ${user}\nТекст: ${text}\n---`);
}

// Генерация ответов через API
async function generateResponse(prompt) {
  try {
    const { data } = await axios.post(
      "https://api.deepinfra.com/v1/openai/chat/completions",
      {
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [
          {
            role: "system",
            content: BOT_PERSONALITY
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 100
      },
      {
        headers: { Authorization: `Bearer ${DEEPINFRA_API_KEY}` },
        timeout: 8000
      }
    );
    return data.choices[0].message.content.trim();
  } catch (e) {
    console.error("API Error:", e.message);
    return "Я в ауте... Попробуй позже!";
  }
}

// Обработчик обычных сообщений
bot.on("message", async (ctx) => {
  try {
    logMessage(ctx, 'Получено сообщение');
    
    if (!ctx.message.text) {
      logMessage(ctx, 'Пропущено (нет текста)');
      return;
    }

    // Проверка на обращение по имени "Шиз"
    const isNameCall = /(^|\s)шиз(\s|[,!?.]|$)/i.test(ctx.message.text);
    const isMention = ctx.message.text.includes(`@${ctx.me.username}`);
    const isReplyToBot = ctx.message.reply_to_message?.from?.id === ctx.me.id;
    const shouldReplyRandom = Math.random() < 0.05;

    if (isNameCall) {
      logMessage(ctx, 'Обращение по имени "Шиз"');
      const response = await generateResponse(
        `Тебя назвали по имени "Шиз". Ответь на сообщение: "${ctx.message.text}"`
      );
      await ctx.reply(response, { 
        reply_to_message_id: ctx.message.message_id 
      });
      return;
    }

    if (isMention) {
      logMessage(ctx, 'Обработка упоминания');
      const response = await generateResponse(
        `Ответь на сообщение: "${ctx.message.text}"`
      );
      await ctx.reply(response, { 
        reply_to_message_id: ctx.message.message_id 
      });
      return;
    }

    if (isReplyToBot) {
      logMessage(ctx, 'Обработка реплая');
      const response = await generateResponse(
        `Ответь на ответ тебе: "${ctx.message.text}"`
      );
      await ctx.reply(response, {
        reply_to_message_id: ctx.message.message_id,
      });
      return;
    }

    if (shouldReplyRandom) {
      logMessage(ctx, 'Случайный ответ (20% шанс)');
      setTimeout(async () => {
        try {
          const response = await generateResponse(
            `Вмешайся в разговор: "${ctx.message.text}"`
          );
          await ctx.reply(response, {
            reply_to_message_id: ctx.message.message_id,
          });
        } catch (e) {
          console.error('Ошибка случайного ответа:', e);
        }
      }, 2000 + Math.random() * 3000);
    } else {
      logMessage(ctx, 'Пропущено (не попал в 20%)');
    }

  } catch (e) {
    console.error('Ошибка обработки сообщения:', e);
    logMessage(ctx, `ОШИБКА: ${e.message}`);
  }
});

// Обработчик inline-запросов
bot.on("inline_query", async (ctx) => {
  try {
    console.log(`[${new Date().toLocaleString()}] Inline запрос от @${ctx.from.username || ctx.from.id}: "${ctx.inlineQuery.query}"`);
    
    if (!ctx.inlineQuery.query) {
      console.log('Пропущен пустой inline-запрос');
      return;
    }

    const response = await generateResponse(
      `Ответь на inline-запрос: "${ctx.inlineQuery.query}"`
    );

    await ctx.answerInlineQuery([
      {
        type: "article",
        id: "1",
        title: "Токсичный ответ",
        description: response.slice(0, 64),
        input_message_content: {
          message_text: response,
          parse_mode: "Markdown"
        }
      }
    ], {
      cache_time: 10
    });

  } catch (e) {
    console.error("Inline error:", e);
    await ctx.answerInlineQuery([], {
      switch_pm_text: "Ошибка генерации",
      switch_pm_parameter: "error"
    });
  }
});

// Логирование запуска/ошибок
bot.catch((err) => {
  console.error(`[${new Date().toLocaleString()}] Глобальная ошибка:`, err);
});

bot.start().then(() => {
  console.log(`[${new Date().toLocaleString()}] Бот @${bot.botInfo.username} запущен!`);
}).catch(e => {
  console.error(`[${new Date().toLocaleString()}] Ошибка запуска:`, e);
});

// Обработка завершения работы
process.on('SIGINT', () => {
  console.log(`[${new Date().toLocaleString()}] Остановка бота...`);
  bot.stop();
  process.exit();
});