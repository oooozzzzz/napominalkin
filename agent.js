import {
	AIMessage,
	BaseMessage,
	HumanMessage,
	SystemMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph } from "@langchain/langgraph";
import { MemorySaver, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { llm } from "./llm.js";
import dotenv from "dotenv";
import { prompt } from "./prompt.js";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { trimMessages } from "@langchain/core/messages";
import { setReminderTool } from "./tools.js";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { OutputFixingParser } from "langchain/output_parsers";
import moment from "moment/moment.js";
dotenv.config();

const zodSchema = z.object({
	answer: z.string().describe("Твой ответ пользователю"),
	reminder: z
		.object({
			time: z.string().describe("Время и дата напоминания в формате ISOString. Например: 2024-11-11T18:31:34.507Z"),
			label: z.string().describe("Сообщение напоминания"),
		})
		.optional()
		.or(z.null())
		.describe("Информация о напоминании"),
});

const parser = StructuredOutputParser.fromZodSchema(zodSchema);
// Define trimmer
// count each message as 1 "token" (tokenCounter: (msgs) => msgs.length) and keep only the last two messages
const trimmer = trimMessages({
	strategy: "last",
	maxTokens: 6,
	tokenCounter: (msgs) => msgs.length,
});

// Define the graph state
// See here for more info: https://langchain-ai.github.io/langgraphjs/how-tos/define-state/
const StateAnnotation = Annotation.Root({
	messages: Annotation({
		reducer: (state, update) => state.concat(update),
		default: () => [],
	}),
});

// Define the tools for the agent to use

const tools = [setReminderTool];
const toolNode = new ToolNode(tools);
const model = llm;
function shouldContinue(state) {
	const messages = state.messages;
	const lastMessage = messages[messages.length - 1];
	// If the LLM makes a tool call, then we route to the "tools" node
	if (lastMessage.tool_calls?.length) {
		return "tools";
	}
	// Otherwise, we stop (reply to the user)
	return "__end__";
}

// Define the function that calls the model
async function callModel(state) {
	const time = moment().format()
	console.log(time);
	const trimmedMessages = await trimmer.invoke(state.messages);
	const systemPrompt =
		prompt.value +
		`\n\nсегодня ${time}\n\n${parser.getFormatInstructions()}`;
	const messages = [
		{ role: "system", content: systemPrompt },
		...trimmedMessages,
	];

	const response = await model.invoke(messages);

	return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph(StateAnnotation)
	.addNode("agent", callModel)
	.addNode("tools", toolNode)
	.addEdge("__start__", "agent")
	.addConditionalEdges("agent", shouldContinue)
	.addEdge("tools", "agent");

const checkpointer = SqliteSaver.fromConnString("./checkpoints.db");

const app = workflow.compile({ checkpointer });

export const getAgentAnswer = async (input, thread) => {
	const finalState = await app.invoke(
		{ messages: [new HumanMessage(input)] },
		{ configurable: { thread_id: thread } }
	);
	const response = finalState.messages[finalState.messages.length - 1].content;
	let output;
	try {
		output = await parser.invoke(response);
	} catch (error) {
		const parserWithFix = OutputFixingParser.fromLLM(model, parser);
		output = await parserWithFix.parse(response);
		console.log(output);
	}
	return output;
};
