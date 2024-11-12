// We use an ephemeral, in-memory chat history for this demo.
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { llm } from "./llm.js";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";

// Define the function that calls the model
const callModel = async (state) => {
  const systemPrompt =
    "You are a helpful assistant. " +
    "Answer all questions to the best of your ability.";
  const messages = [
    { role: "system", content: systemPrompt },
    ...state.messages,
  ];
  const response = await llm.invoke(messages);
  return { messages: response };
};

const workflow = new StateGraph(MessagesAnnotation)
  // Define the node and edge
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);

// Add simple in-memory checkpointer
const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });
