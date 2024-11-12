import { makeAdmin, getAdminPassword } from "../db.js";
import { adminMenu } from "../menus/adminMenu.js";

export const adminHandler = async (ctx) => {
	await ctx.msg.delete();
	// await makeAdmin(ctx.from.id);
	try {
		await ctx.reply("Добро пожаловать в панель администратора", {
			reply_markup: adminMenu,
		});
	} catch (error) {
		console.error("Error:", error);
	}
};
