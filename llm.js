import { setReminderTool } from "./tools.js";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

export const llm = new ChatOpenAI({
	configuration: { baseURL: "https://api.proxyapi.ru/openai/v1/" },
	modelName: "gpt-4o-mini",
	temperature: 0.6,
	// topP: 0.6
	// topLogprobs: 2,
	// logprobs: true
	// topP: 0.2,
})
