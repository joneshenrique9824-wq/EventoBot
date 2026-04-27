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

/* 📅 EVENTO HOJE */
const EVENTO_INICIO = new Date("2026-04-27T21:00:00-03:00");
const EVENTO_FIM = new Date("2026-04-27T22:00:00-03:00");

/* =========================
   📊 DADOS
========================= */

const ranking = new Map();
const alertasEnviados = new Set();

let msgId = null;
let eventoCancelado = false;
let aviso10minEnviado = false;

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
      .setCustomId("atendimento")
      .setLabel("🏥 Atendimento")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("chamado")
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
    : "Nenhum participante ainda.";

  return new EmbedBuilder()
    .setColor("#00ffcc")
    .setTitle("🏥 EVENTO HOSPITAL BELLA RP")
    .setDescription(`
━━━━━━━━━━━━━━━━━━━━━━
📅 **HOJE - 27/04/2026**
🕘 21:00 até 22:00

🏥 **EVENTO DE ATENDIMENTO MÉDICO**

🔥 Realize atendimentos e chamados para ganhar pontos!

🏆 TOP 3
${list}

💰 PREMIAÇÃO
🥇 100.000 + Cargo VIP  
🥈 60.000 + Cargo Destaque  
🥉 30.000 + Cargo Participante  

━━━━━━━━━━━━━━━━━━━━━━
`)
    .setFooter({ text: "Hospital Bella RP • Sistema de Evento" });
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
          .setDescription("🏥 O evento começa às 21:00!")
      ]
    });

    alertasEnviados.add("20");
  }
}

/* =========================
   ⏰ ALERTA 10 MIN
========================= */
async function alerta10Min(client) {
  const now = new Date();
  const diff = (EVENTO_INICIO - now) / 60000;

  if (diff <= 10 && diff > 0 && !aviso10minEnviado) {
    const canal = await client.channels.fetch(CANAL_EVENTO);

    await canal.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#ff8800")
          .setTitle("⏰ FALTAM 10 MINUTOS")
          .setDescription("🏥 O evento de atendimento está prestes a começar!")
      ]
    });

    aviso10minEnviado = true;
  }
}

/* =========================
   ❌ CANCELAR EVENTO
========================= */
async function cancelarEvento(client) {
  eventoCancelado = true;

  const canal = await client.channels.fetch(CANAL_EVENTO);

  await canal.send({
    embeds: [
      new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ EVENTO CANCELADO")
        .setDescription("🏥 O evento foi cancelado por falta de participantes.")
    ]
  });
}

/* =========================
   🔁 UPDATE
========================= */
async function update(client) {
  if (eventoCancelado) return;

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

  if (eventoCancelado) {
    return interaction.reply({
      content: "❌ Evento cancelado.",
      ephemeral: true
    });
  }

  const id = interaction.user.id;

  if (!ativo()) {
    return interaction.reply({
      content: "⏰ Evento não está ativo.",
      ephemeral: true
    });
  }

  if (!interaction.member.roles.cache.has(PARTICIPANTE_ROLE)) {
    return interaction.reply({
      content: "🚫 Sem permissão para participar.",
      ephemeral: true
    });
  }

  ranking.set(id, (ranking.get(id) || 0) + 1);

  return interaction.reply({
    content: "✔ Atendimento registrado! +1 ponto",
    ephemeral: true
  });
}

/* =========================
   ⏱ LOOP
========================= */
function startEventoLoops(client) {
  setInterval(() => update(client), 5000);
  setInterval(() => alertaEvento(client), 60000);
  setInterval(() => alerta10Min(client), 60000);
}

export {
  startEventoLoops,
  eventoInteractions,
  cancelarEvento
};
