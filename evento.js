import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

/* =========================
   ⚙️ CONFIG
========================= */

const CANAL_EVENTO = "1477683908026961940";
const PARTICIPANTE_ROLE = "1492553421973356795";

const EVENTO_INICIO = new Date("2026-04-24T19:00:00-03:00");
const EVENTO_FIM = new Date("2026-04-24T20:30:00-03:00");

/* =========================
   📊 DADOS
========================= */

const ranking = new Map();
const alertasEnviados = new Set();
let msgId = null;

/* =========================
   🔥 EVENTO ATIVO
========================= */
function ativo() {
  const now = new Date();
  return now >= EVENTO_INICIO && now <= EVENTO_FIM;
}

/* =========================
   🏆 TOP 3
========================= */
function top3() {
  return [...ranking.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

/* =========================
   🎮 BOTÕES
========================= */
function buttons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("atender")
      .setLabel("🏥 Atender")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("chamar")
      .setLabel("📞 Chamado")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("rank")
      .setLabel("📊 Ranking")
      .setStyle(ButtonStyle.Secondary)
  );
}

/* =========================
   🎖 EMBED
========================= */
function embed() {
  const top = top3();
  const medal = ["🥇", "🥈", "🥉"];

  const list = top.length
    ? top.map(([id, p], i) =>
        `${medal[i]} <@${id}> — **${p} pontos**`
      ).join("\n")
    : "Sem participantes ainda.";

  return new EmbedBuilder()
    .setColor("#00ffcc")
    .setTitle("🏥 EVENTO HOSPITAL BELLA RP")
    .setDescription(`
━━━━━━━━━━━━━━━━━━━━━━
📅 24/04/2026
🕖 19:00 - 20:30 (Brasília)

🔥 COMPETIÇÃO ATIVA

🏆 TOP 3
${list}

💰 PREMIAÇÃO
🥇 75.000 + Cargo TOP 1  
🥈 50.000 + Cargo TOP 2  
🥉 25.000 + Cargo TOP 3  

━━━━━━━━━━━━━━━━━━━━━━
`)
    .setFooter({ text: "Hospital Bella RP • Sistema Automático" });
}

/* =========================
   🚨 ALERTA 20 MIN
========================= */
async function alertaEvento(client) {
  const now = new Date();
  const diff = (EVENTO_INICIO - now) / 60000;

  if (diff <= 20 && diff > 0 && !alertasEnviados.has("20")) {
    const canal = await client.channels.fetch(CANAL_EVENTO);

    await canal.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#ffcc00")
          .setTitle("🚨 EVENTO EM 20 MINUTOS")
          .setDescription("🏥 O Hospital Bella começa em breve!")
      ]
    });

    alertasEnviados.add("20");
  }
}

/* =========================
   🔁 UPDATE
========================= */
async function update(client) {
  const canal = await client.channels.fetch(CANAL_EVENTO);

  if (!msgId) {
    const msg = await canal.send({
      embeds: [embed()],
      components: [buttons()]
    });

    msgId = msg.id;
    return;
  }

  const msg = await canal.messages.fetch(msgId).catch(() => null);

  if (!msg) {
    const newMsg = await canal.send({
      embeds: [embed()],
      components: [buttons()]
    });

    msgId = newMsg.id;
    return;
  }

  await msg.edit({
    embeds: [embed()],
    components: [buttons()]
  });
}

/* =========================
   🎯 INTERAÇÕES
========================= */
function eventoInteractions(interaction) {
  if (!interaction.isButton()) return;

  const id = interaction.user.id;

  if (!ativo()) {
    return interaction.reply({
      content: "⏰ Evento não está ativo.",
      ephemeral: true
    });
  }

  if (!interaction.member.roles.cache.has(PARTICIPANTE_ROLE)) {
    return interaction.reply({
      content: "🚫 Sem permissão.",
      ephemeral: true
    });
  }

  ranking.set(id, (ranking.get(id) || 0) + 1);

  return interaction.reply({
    content: "✔ +1 ponto registrado!",
    ephemeral: true
  });
}

/* =========================
   ⏱ LOOP
========================= */
function startEventoLoops(client) {
  setInterval(() => update(client), 5000);
  setInterval(() => alertaEvento(client), 60000);
}

export {
  startEventoLoops,
  eventoInteractions
};
