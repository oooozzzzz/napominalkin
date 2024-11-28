import { HumanMessage, RemoveMessage } from "@langchain/core/messages";
import * as XLSX from "xlsx/xlsx.mjs";
import * as fs from "fs";
import http from "http";
import https from "https";
import { Readable } from "stream";
import { readFileSync } from "fs";
import { read } from "xlsx/xlsx.mjs";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import sqlite3 from "sqlite3";
import { scheduleJob } from "node-schedule";
import { Api } from "grammy";
import { yc } from "./axiosClient.js";

dotenv.config();
XLSX.set_fs(fs);
XLSX.stream.set_readable(Readable);
const api = new Api(process.env.TOKEN);

export function combineDocuments(docs) {
	return docs.map((doc) => doc.pageContent).join("\n\n");
}

export const getAnswer = async (input, thread_id) => {
	console.log(input);
	const config = { configurable: { thread_id: thread_id } };
	try {
		const agentFinalState = await agent.invoke(
			{ messages: [new HumanMessage(input)] },
			config,
		);

		// console.log((await agent.getState(config)).values.messages);
		// console.log(agent.messages);

		const response =
			agentFinalState.messages[agentFinalState.messages.length - 1];
		const output = await parser.invoke(response);
		return output;
	} catch (error) {
		console.log(error);
	}
};

async function asyncForEach(arr, callback) {
	for (let i = 0; i < arr.length; i++) await callback(arr[i], i, arr);
}

export const convertFileToCSV = async (inputFilename, outputFilename) => {
	const buf = readFileSync(inputFilename);
	const workbook = read(buf);
	const ws = workbook.Sheets[workbook.SheetNames[0]];

	const csv = XLSX.utils.sheet_to_csv(ws, {
		// FS: ",",
		// RS: ";",
	});
	// console.log(csv);

	fs.writeFile(
		"./menu.csv",
		csv,
		(err) => {},
		// { bookType: "csv",}
	);
	console.log("CSV file created successfully");
};

export const downloadRecord = (url, file) => {
	return new Promise((resolve, reject) => {
		let localFile = fs.createWriteStream(file);
		const client = url.startsWith("https") ? https : http;
		client.get(url, (response) => {
			response.on("end", () => {
				console.log("Download of the record is complete");
				resolve(file);
			});
			response.pipe(localFile);
		});
	});
};

export const deleteFile = async (path) => {
	fs.unlinkSync(path);
};
export const getFileLink = async (ctx) => {
	const file = await ctx.getFile(); // valid for at least 1 hour
	const path = file.file_path;
	return `https://api.telegram.org/file/bot${process.env.TOKEN}/${path}`;
};

export const getTranscription = async (ctx) => {
	const url = await getFileLink(ctx);
	const path = `voices/${ctx.from.username}.oga`;
	await downloadRecord(url, path);

	const data = fs.createReadStream(path);
	try {
		const transcription = await yc.post("", data, {
			params: {
				folderId: "b1g418tami5o5juot9g6",
				topic: "general",
			},
		});
		console.log(transcription.data.result);
		deleteFile(path);
		// 	const response = transcription.text;
		return transcription.data.result;
	} catch (error) {}
};

export const voiceToText = async (ctx) => {};

export const execute = async (db, sql, params = []) => {
	if (params && params.length > 0) {
		return new Promise((resolve, reject) => {
			db.run(sql, params, (err) => {
				if (err) reject(err);
				resolve();
			});
		});
	}
	return new Promise((resolve, reject) => {
		db.exec(sql, (err) => {
			if (err) reject(err);
			resolve();
		});
	});
};

export const clearMessageHistory = async (thread_id) => {
	const db = new sqlite3.Database("checkpoints.db", sqlite3.OPEN_READWRITE);
	const sql = `DELETE FROM checkpoints WHERE thread_id = '${thread_id}'`;
	try {
		await execute(db, sql);
	} catch (err) {
		console.log(err);
	} finally {
		db.close();
	}
};

export const setReminder = async ({ time, label, user_tg_id }) => {
	console.log("напоминание");
	try {
		const job = scheduleJob(time, async function () {
			await api.sendMessage(user_tg_id, label);
		});
	} catch (error) {
		console.log(error);
	}
};
