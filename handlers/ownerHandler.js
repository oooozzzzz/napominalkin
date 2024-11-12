import { makeAdmin } from "../db.js";
import { ownerMenu } from "../menus/ownerMenu.js";

export const ownerHandler = async (ctx) => {
	try {
		await ctx.msg.delete();
		await makeAdmin(ctx.from.id);
		await ctx.reply("Добро пожаловать в панель владельца", {
			reply_markup: ownerMenu,
		});
	} catch (error) {
		console.error("Error in ownerHandler:", error);
	}
};
