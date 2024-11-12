
import * as dotenv from "dotenv";
dotenv.config();

import { Bot, session } from "grammy";
import { hydrate } from "@grammyjs/hydrate";
import { I18n } from "@grammyjs/i18n";
import { conversations, createConversation } from "@grammyjs/conversations";
import { hydrateReply, parseMode } from "@grammyjs/parse-mode";
import { v4 as uuidv4 } from 'uuid';

const token = process.env.TOKEN;

export const bot = new Bot(token);

bot.use(hydrateReply);

// Set the default parse mode for ctx.reply.
bot.api.config.use(parseMode("HTML"));

const i18n = new I18n({
	defaultLocale: "ru",
	useSession: true, // whether to store user language in session
	directory: "locales", // Load all translation files from locales/.
});

bot.api.setMyCommands([{
	command: "start", description: "Начать работу с Напоминалкиным"
}])

bot.use(hydrate());
bot.use(
	session({
		initial() {
			return {
				toChat: false,
				thread_id: uuidv4(),
				hasPhoneNumber: false
			};
		},
	})
);

bot.use(i18n);

bot.use(conversations());
// bot.use(createConversation(setShopUrl));
