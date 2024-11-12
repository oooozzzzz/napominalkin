import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const setReminderTool = tool(
	async (input) => {
		// This is a placeholder for the actual implementation
		console.log(input);
		return '';
	},
	{
		name: "setReminder",
		description: "Вызови, чтобы установить напоминание",
		schema: z.object({
			time: z.string().describe("Время напоминания"),
			label: z.string().describe("Сообщение напоминания"),
		}),
	}
);
