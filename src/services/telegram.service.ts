import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatIdRaw = process.env.TELEGRAM_GROUP_ID;

if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN in env");
if (!chatIdRaw) throw new Error("Missing TELEGRAM_GROUP_ID in env");

const chatId = Number(chatIdRaw);

export const telegramBot = new TelegramBot(token, { polling: false });

function esc(s: any) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type TgPatientMedia = {
  mimetype: string;
  absPath: string;
  originalname?: string;
};

export async function sendPatientToTelegram(params: {
  first_name: string;
  second_name: string;
  third_name?: string | null;
  phone_number: string;
  problem: string;
  media?: TgPatientMedia[];
}) {
  const text =
    `🆕 <b>Yangi qabul</b>\n\n` +
    `👤 <b>F.I.SH:</b> ${esc(params.first_name)} ${esc(params.second_name)} ${esc(params.third_name || "")}\n` +
    `📞 <b>Telefon raqami:</b> ${esc(params.phone_number)}\n\n` +
    `📝 <b>Muammo:</b>\n${esc(params.problem)}`;

  await telegramBot.sendMessage(chatId, text, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });

  const media = (params.media || [])
    .filter((m) => m?.mimetype?.startsWith("image/") || m?.mimetype?.startsWith("video/"))
    .filter((m) => m?.absPath && fs.existsSync(m.absPath));

  if (!media.length) return;

  const chunks: TgPatientMedia[][] = [];
  for (let i = 0; i < media.length; i += 10) chunks.push(media.slice(i, i + 10));

  for (const chunk of chunks) {
    if (chunk.length === 1) {
      const one = chunk[0];
      if (one.mimetype.startsWith("image/")) {
        await telegramBot.sendPhoto(chatId, fs.createReadStream(one.absPath));
      } else {
        await telegramBot.sendVideo(chatId, fs.createReadStream(one.absPath));
      }
      continue;
    }

    const inputMedia = chunk.map((m) => {
      const type = m.mimetype.startsWith("image/") ? "photo" : "video";
      return {
        type,
        media: fs.createReadStream(m.absPath),
      } as any;
    });

    await telegramBot.sendMediaGroup(chatId, inputMedia);
  }
}