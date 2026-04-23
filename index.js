import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

/* =========================
   ⏰ CONFIG DO EVENTO
========================= */

const CANAL_EVENTO = "1477683908026961940";

// 👮 STAFF
const STAFF_ROLE = "1490431614055088128";

// 👤 PARTICIPANTES AUTORIZADOS
const PARTICIPANTE_ROLE = "1492553421973356795";

// 🏆 CARGOS TOP 3
const TOP1_ROLE = "1477683902100410424";
const TOP2_ROLE = "1495374426815074304";
const TOP3_ROLE = "1495374557404594267";

// 📅 HORÁRIO BRASILIA
const EVENTO_INICIO = new Date("2026-04-24T19:00:00-03:00");
const EVENTO_FIM = new Date("2026-04-24T20:30:00-03:00");

// 🔔 controle de alertas
const ALERTA_ENVIADO = new Set();

const rankingEvento = new Map();
let msgEventoId = null;

/* =========================
   🔥 VERIFICAR SE EVENTO ESTÁ ATIVO
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
   🎖 EMBED PREMIUM
========================= */
function embedEvento() {
  const top = getTop();
  const medalhas = ["🥇", "🥈", "🥉"];

  const lista = top.length
    ? top.map(([id, p], i) => `${medalhas[i]} <@${id}> — **${p} pts**`).join("\n")
    : "Ainda sem participantes.";

  return new EmbedBuilder()
    .setColor("#00ffcc")
    .setTitle("🏥 EVENTO HOSPITAL BELLA — COMPETIÇÃO OFICIAL")
    .setDescription(`
━━━━━━━━━━━━━━━━━━━━━━
📅 **HORÁRIO OFICIAL (BRASILIA)**

🕖 Início: 24/04/2026 - 19:00  
🕣 Fim: 24/04/2026 - 20:30  

━━━━━━━━━━━━━━━━━━━━━━

🏆 **TOP PARTICIPANTES**
${lista}

━━━━━━━━━━━━━━━━━━━━━━

💰 **PREMIAÇÃO FINAL**
🥇 75.000 + Cargo TOP 1  
🥈 50.000 + Cargo TOP 2  
🥉 25.000 + Cargo TOP 3  

━━━━━━━━━━━━━━━━━━━━━━

⚡ Evento automático • Hospital Bella RP
━━━━━━━━━━━━━━━━━━━━━━
`)
    .setFooter({ text: "Hospital Bella RP • Sistema Premium" });
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
      .setLabel("📊 Meu Ranking")
      .setStyle(ButtonStyle.Secondary)
  );
}

/* =========================
   🚨 ALERTA 20 MIN ANTES
========================= */
async function alertaEvento(client) {
  try {
    const agora = new Date();
    const diffMin = Math.floor((EVENTO_INICIO - agora) / 60000);

    if (diffMin <= 20 && diffMin > 0 && !ALERTA_ENVIADO.has("20min")) {

      const canal = await client.channels.fetch(CANAL_EVENTO);

      const embed = new EmbedBuilder()
        .setColor("#ffcc00")
        .setTitle("🚨 EVENTO HOSPITAL BELLA")
        .setDescription(`
━━━━━━━━━━━━━━━━━━━━━━
⏰ **ATENÇÃO!**

🏥 O EVENTO HOSPITAL BELLA  
COMEÇA EM **20 MINUTOS!**

📅 Horário de Brasília:
🕖 24/04/2026 às 19:00

━━━━━━━━━━━━━━━━━━━━━━

🔥 Preparem-se para competir!
💉 Atendimento e ranking valendo pontos
🏆 Premiação em dinheiro + cargos

━━━━━━━━━━━━━━━━━━━━━━
`)
        .setFooter({ text: "Hospital Bella RP • Aviso Automático" });

      await canal.send({ embeds: [embed] });

      ALERTA_ENVIADO.add("20min");
    }

  } catch (err) {
    console.log("❌ Erro alerta:", err.message);
  }
}

/* =========================
   🔁 UPDATE EVENTO
========================= */
export async function updateEvento(client) {
  try {
    const canal = await client.channels.fetch(CANAL_EVENTO);

    const embed = embedEvento();

    if (!msgEventoId) {
      const msg = await canal.send({
        embeds: [embed],
        components: [rowEvento()]
      });

      msgEventoId = msg.id;
    } else {
      const msg = await canal.messages.fetch(msgEventoId).catch(() => null);

      if (msg) {
        await msg.edit({
          embeds: [embed],
          components: [rowEvento()]
        });
      }
    }

  } catch (err) {
    console.log("❌ Erro update evento:", err.message);
  }
}

/* =========================
   🎯 INTERAÇÕES
========================= */
export async function eventoInteractions(interaction) {
  if (!interaction.isButton()) return;

  const member = interaction.member;
  const id = interaction.user.id;

  // ⛔ fora do horário
  if (!eventoAtivo()) {
    return interaction.reply({
      content: "⏰ O evento ainda não começou ou já foi encerrado.",
      ephemeral: true
    });
  }

  // 🔒 permissão
  if (!member.roles.cache.has(PARTICIPANTE_ROLE)) {
    return interaction.reply({
      content: "🚫 Você não tem permissão para participar do evento.",
      ephemeral: true
    });
  }

  // 🏥 ATENDER
  if (interaction.customId === "evento_atender") {
    rankingEvento.set(id, (rankingEvento.get(id) || 0) + 1);

    return interaction.reply({
      content: "🏥 +1 ponto por atendimento!",
      ephemeral: true
    });
  }

  // 📞 CHAMADO
  if (interaction.customId === "evento_chamar") {
    rankingEvento.set(id, (rankingEvento.get(id) || 0) + 1);

    return interaction.reply({
      content: "📞 +1 ponto por chamado!",
      ephemeral: true
    });
  }

  // 📊 RANKING
  if (interaction.customId === "evento_ranking") {
    const pontos = rankingEvento.get(id) || 0;

    return interaction.reply({
      content: `📊 Você tem **${pontos} pontos** no evento.`,
      ephemeral: true
    });
  }
}

/* =========================
   ⏱ LOOP AUTOMÁTICO (NO READY)
========================= */
export function startEventoLoops(client) {
  setInterval(() => updateEvento(client), 5000);
  setInterval(() => alertaEvento(client), 60000);
}
