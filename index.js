import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

/* =========================
   ⏰ CONFIGURAÇÃO
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
   🏆 TOP 3
========================= */
function getTop() {
  return [...rankingEvento.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

/* =========================
   🎮 BOTÕES
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
   🎖 EMBED BONITO
========================= */
function embedEvento() {
  const top = getTop();
  const medalhas = ["🥇", "🥈", "🥉"];

  const lista = top.length
    ? top.map(([id, p], i) =>
        `${medalhas[i]} <@${id}> — **${p} pontos**`
      ).join("\n")
    : "Sem participantes ainda.";

  return new EmbedBuilder()
    .setColor("#00ffcc")
    .setTitle("🏥 EVENTO HOSPITAL BELLA RP")
    .setDescription(`
━━━━━━━━━━━━━━━━━━━━━━
🏥 **EVENTO OFICIAL HOSPITAL BELLA**

📅 24/04/2026  
🕖 19:00 até 20:30 (Brasília)

━━━━━━━━━━━━━━━━━━━━━━

🔥 **COMPETIÇÃO ATIVA**
Atendimentos e chamados geram pontos em tempo real.

━━━━━━━━━━━━━━━━━━━━━━

🏆 **RANKING**
${lista}

━━━━━━━━━━━━━━━━━━━━━━

💰 **PREMIAÇÃO**
🥇 75.000 + Cargo TOP 1  
🥈 50.000 + Cargo TOP 2  
🥉 25.000 + Cargo TOP 3  

━━━━━━━━━━━━━━━━━━━━━━

⚡ Apenas participantes autorizados
🏥 Hospital Bella RP
━━━━━━━━━━━━━━━━━━━━━━
`)
    .setFooter({ text: "Sistema Automático • Hospital Bella RP" });
}

/* =========================
   🚨 ALERTA 20 MIN
========================= */
async function alertaEvento(client) {
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
            .setDescription("🏥 O Hospital Bella vai começar em breve!")
        ]
      });

      ALERTA_ENVIADO.add("20");
    }
  } catch (err) {
    console.log("Erro alerta:", err.message);
  }
}

/* =========================
   🔁 UPDATE PAINEL
========================= */
async function updateEvento(client) {
  try {
    const canal = await client.channels.fetch(CANAL_EVENTO);
    if (!canal) return;

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
function eventoInteractions(interaction) {
  if (!interaction.isButton()) return;

  const id = interaction.user.id;

  if (!eventoAtivo()) {
    return interaction.reply({
      content: "⏰ Evento ainda não está ativo.",
      ephemeral: true
    });
  }

  if (!interaction.member.roles.cache.has(PARTICIPANTE_ROLE)) {
    return interaction.reply({
      content: "🚫 Você não pode participar.",
      ephemeral: true
    });
  }

  rankingEvento.set(id, (rankingEvento.get(id) || 0) + 1);

  return interaction.reply({
    content: "✔ +1 ponto registrado!",
    ephemeral: true
  });
}

/* =========================
   ⏱ LOOP
========================= */
function startEventoLoops(client) {
  setInterval(() => updateEvento(client), 5000);
  setInterval(() => alertaEvento(client), 60000);
}

export {
  startEventoLoops,
  eventoInteractions
};
