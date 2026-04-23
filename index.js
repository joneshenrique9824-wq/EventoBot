import "dotenv/config";
import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import { startEventoLoops, eventoInteractions } from "./evento.js";

/* =========================
   🌐 KEEP ALIVE
========================= */
const app = express();
app.get("/", (_, res) => res.send("🏥 Hospital Bella Online"));
app.listen(3000);

/* =========================
   🤖 BOT
========================= */
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* =========================
   READY
========================= */
client.once("ready", () => {
  console.log(`🏥 Logado como ${client.user.tag}`);
  startEventoLoops(client);
});

/* =========================
   INTERAÇÕES
========================= */
client.on("interactionCreate", eventoInteractions);

/* =========================
   LOGIN
========================= */
client.login(process.env.TOKEN);
