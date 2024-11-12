import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const token = process.env.AMO_CRM_API_KEY;
export const amoCRM = axios.create({
	baseURL: "https://retention01.amocrm.ru/api/v4/",
	timeout: 1000,
	headers: { Authorization: `Bearer ${token}` },
});

export const yc = axios.create({
	baseURL: "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize",
  headers: { Authorization: `Bearer ${process.env.IAM_TOKEN}` },
})