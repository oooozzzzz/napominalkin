import { bot } from "./bot.js";
import { AIHandler } from "./handlers/AIHandler.js";
import { startHandler } from "./handlers/startHandler.js";
import { getTranscription } from "./services.js";

bot.command("start", async (ctx) => {
	await ctx.msg.delete();
	await startHandler(ctx);
});

bot.on(":text", async (ctx) => {
	const text = ctx.msg.text;
	switch (text) {
		default:
			await AIHandler(ctx);
			break;
	}
});
bot.on(":voice", async (ctx) => {
	const text = await getTranscription(ctx)
	await AIHandler(ctx, text);
});

bot.catch((error) => {
	console.error(error);
	bot.start();
});
bot.start();
