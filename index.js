import "dotenv/config";
import express from "express";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes
} from "discord.js";

/* =========================
   🌐 KEEP ALIVE
========================= */
const app = express();
app.get("/", (_, res) => res.send("🏥 Hospital Bella Bot Online"));
app.listen(3000);

/* =========================
   🔐 CONFIG
========================= */
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

/* =========================
   🤖 CLIENT
========================= */
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* =========================
   🏥 SISTEMA HOSPITAL
========================= */
const pontos = new Map();
const chamados = new Map();
const stats = new Map();

/* =========================
   📅 EVENTO
========================= */
const CANAL_EVENTO = "1477683908026961940";

const PARTICIPANTE_ROLE = "1492553421973356795";

const EVENTO_INICIO = new Date("2026-04-24T19:00:00-03:00");
const EVENTO_FIM = new Date("2026-04-24T20:30:00-03:00");

const rankingEvento = new Map();
const ALERTA_ENVIADO = new Set();

let msgEventoId = null;

/* =========================
   🔥 EVENTO ATIVO
========================= */
function eventoAtivo() {
  const agora = new Date();
  return agora >= EVENTO_INICIO && agora <= EVENTO_FIM;
}

/* =========================
   🏆 TOP EVENTO
========================= */
function getTop() {
  return [...rankingEvento.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

/* =========================
   🎖 EMBED EVENTO
========================= */
function embedEvento() {
  const top = getTop();
  const medalhas = ["🥇", "🥈", "🥉"];

  const lista = top.length
    ? top.map(([id, p], i) => `${medalhas[i]} <@${id}> — **${p} pts**`).join("\n")
    : "Sem participantes ainda.";

  return new EmbedBuilder()
    .setColor("#00ffcc")
    .setTitle("🏥 EVENTO HOSPITAL BELLA RP")
    .setDescription(`
📅 24/04/2026 — 19:00 até 20:30 (Brasília)

🏆 TOP:
${lista}

💰 Premiação:
🥇 75.000
🥈 50.000
🥉 25.000
`);
}

/* =========================
   🎮 BOTÕES EVENTO
========================= */
function rowEvento() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("evento_atender")
      .setLabel("🏥 Atender")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("evento_chamar")
      .setLabel("📞 Chamado")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("evento_ranking")
      .setLabel("📊 Ranking")
      .setStyle(ButtonStyle.Secondary)
  );
}

/* =========================
   🚨 ALERTA 20 MIN
========================= */
async function alertaEvento() {
  try {
    const agora = new Date();
    const diff = (EVENTO_INICIO - agora) / 60000;

    if (diff <= 20 && diff > 0 && !ALERTA_ENVIADO.has("20")) {
      const canal = await client.channels.fetch(CANAL_EVENTO);

      await canal.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#ffcc00")
            .setTitle("🚨 EVENTO EM 20 MINUTOS")
            .setDescription("🏥 Hospital Bella começa em breve!")
        ]
      });

      ALERTA_ENVIADO.add("20");
    }
  } catch (err) {
    console.log("Erro alerta:", err.message);
  }
}

/* =========================
   🔁 UPDATE EVENTO
========================= */
async function updateEvento() {
  try {
    const canal = await client.channels.fetch(CANAL_EVENTO);

    if (!msgEventoId) {
      const msg = await canal.send({
        embeds: [embedEvento()],
        components: [rowEvento()]
      });

      msgEventoId = msg.id;
      return;
    }

    const msg = await canal.messages.fetch(msgEventoId).catch(() => null);

    if (!msg) {
      const newMsg = await canal.send({
        embeds: [embedEvento()],
        components: [rowEvento()]
      });

      msgEventoId = newMsg.id;
      return;
    }

    await msg.edit({
      embeds: [embedEvento()],
      components: [rowEvento()]
    });

  } catch (err) {
    console.log("Erro update:", err.message);
  }
}

/* =========================
   🎯 INTERAÇÕES
========================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const id = interaction.user.id;

  // ⛔ fora do evento
  if (!eventoAtivo()) {
    return interaction.reply({
      content: "⏰ Evento não está ativo.",
      ephemeral: true
    });
  }

  // 🔒 permissão
  if (!interaction.member.roles.cache.has(PARTICIPANTE_ROLE)) {
    return interaction.reply({
      content: "🚫 Sem permissão.",
      ephemeral: true
    });
  }

  // 🏥 ações
  rankingEvento.set(id, (rankingEvento.get(id) || 0) + 1);

  return interaction.reply({
    content: "✔ +1 ponto registrado!",
    ephemeral: true
  });
});

/* =========================
   ⏱ LOOP AUTOMÁTICO
========================= */
client.once("ready", () => {
  console.log(`🏥 Logado como ${client.user.tag}`);

  setInterval(updateEvento, 5000);
  setInterval(alertaEvento, 60000);
});

/* =========================
   🚀 LOGIN
========================= */
client.login(TOKEN);
