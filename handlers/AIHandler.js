import { getAgentAnswer } from "../agent.js";
import { clearMessageHistory, setReminder } from "../services.js";

export const AIHandler = async (ctx, text) => {
	if (ctx?.msg?.text) console.log(ctx.msg.text);
	// if (ctx.session.toChat) {
	await ctx.api.sendChatAction(ctx.from.id, "typing");
	const thread = ctx.session.thread_id;

	const config = {
		configurable: {
			sessionId: thread,
		},
	};

	let query;
	text ? (query = text) : (query = ctx.msg.text);
	const response = await getAgentAnswer(query, thread);

	if (response?.reminder) {
		await setReminder({ ...response.reminder, user_tg_id: ctx.from.id });
		clearMessageHistory(ctx.session.thread_id);
	}
	console.log(response);
	try {
		await ctx.reply(response?.answer);
	} catch (error) {
		await ctx.reply("Что-то пошло не так.. Попробуйте снова");
	}
};
