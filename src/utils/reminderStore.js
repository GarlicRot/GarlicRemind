/**
 * -----------------------------------------------------------
 * GarlicRemind - Reminder Storage Utility (Firestore)
 * -----------------------------------------------------------
 *
 * Description: Handles loading, storing, and scheduling reminders
 *              across restarts using Firebase Firestore.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { v4: uuidv4 } = require("uuid");
const { buildEmbed } = require("./embedBuilder");
const logger = require("./logger");
const { db } = require("../config/firebase");

const activeTimeouts = {};

async function loadReminders(client) {
  try {
    const snapshot = await db
      .collection("discord")
      .doc("reminders")
      .collection("entries")
      .get();

    const reminders = snapshot.docs.map((doc) => doc.data());
    logger.info(`🔁 Loaded ${reminders.length} reminder(s) from Firestore.`);

    for (const reminder of reminders) {
      const timeLeft = reminder.remindAt - Date.now();

      if (timeLeft <= 0) {
        logger.warn(
          `⏰ Reminder ${reminder.id} for ${
            reminder.userId
          } is overdue by ${Math.abs(timeLeft)}ms`
        );

        try {
          const channel = await client.channels.fetch(reminder.channelId);
          const user = await client.users.fetch(reminder.userId);

          const embed = buildEmbed({
            title: "⏰ Reminder!",
            description: `**Message:** ${
              reminder.message || "*No message provided*"
            }`,
            type: "notify",
            interaction: {
              user,
              client,
              guildId: channel.guildId,
              channelId: channel.id,
              id: reminder.messageId || reminder.id, // use messageId if available
              createdTimestamp: Date.now(),
            },
          });

          await channel.send({
            content: `<@${reminder.userId}>`,
            embeds: [embed],
          });
          logger.success(`✅ Sent overdue reminder ${reminder.id}`);
          await removeReminder(reminder.id);
        } catch (err) {
          logger.error(`❌ Failed to send overdue reminder: ${err.message}`);
        }
      } else {
        scheduleSingle(reminder, client);
      }
    }
  } catch (err) {
    logger.error(`❌ Failed to load reminders from Firestore: ${err.message}`);
  }
}

async function scheduleReminder(reminder, client) {
  reminder.id = reminder.id || uuidv4();

  await db
    .collection("discord")
    .doc("reminders")
    .collection("entries")
    .doc(reminder.id)
    .set(reminder);

  logger.success(
    `⏰ Reminder set for ${reminder.userId} in ${
      reminder.channelId
    } at ${new Date(reminder.remindAt).toISOString()} (ID: ${reminder.id})`
  );

  scheduleSingle(reminder, client);
}

async function scheduleSingle(reminder, client) {
  const delay = reminder.remindAt - Date.now();
  if (delay < 0) return;

  try {
    const channel = await client.channels.fetch(reminder.channelId);

    const timeout = setTimeout(async () => {
      try {
        const user = await client.users.fetch(reminder.userId);

        const embed = buildEmbed({
          title: "⏰ Reminder!",
          description: `**Message:** ${
            reminder.message || "*No message provided*"
          }`,
          type: "notify",
          interaction: {
            user,
            client,
            guildId: channel.guildId,
            channelId: channel.id,
            id: reminder.messageId || undefined, // 🟢 Jump link fix
            createdTimestamp: reminder.remindAt,
          },
        });

        await channel.send({
          content: `<@${reminder.userId}>`,
          embeds: [embed],
        });

        logger.success(
          `🔔 Reminder delivered to ${reminder.userId} in ${reminder.channelId} (ID: ${reminder.id})`
        );

        await removeReminder(reminder.id);
      } catch (sendErr) {
        logger.error(
          `❌ Failed to send reminder ${reminder.id}: ${sendErr.message}`
        );
      }
    }, delay);

    activeTimeouts[reminder.id] = timeout;
  } catch (err) {
    logger.warn(`⚠️ Could not restore reminder ${reminder.id}: ${err.message}`);

    try {
      const user = await client.users.fetch(reminder.userId);
      await user.send({
        embeds: [
          buildEmbed({
            title: "⚠️ Reminder Could Not Be Restored",
            description: `**Reason:** ${err.message}\n**Message:** ${
              reminder.message || "*No message*"
            }\n**Scheduled for:** <t:${Math.floor(
              reminder.remindAt / 1000
            )}:f>`,
            type: "warning",
            interaction: { user, client },
          }),
        ],
      });
    } catch (userErr) {
      logger.warn(
        `⚠️ Could not notify user ${reminder.userId}: ${userErr.message}`
      );
    }
  }
}

async function removeReminder(id) {
  if (activeTimeouts[id]) {
    clearTimeout(activeTimeouts[id]);
    delete activeTimeouts[id];
  }

  await db
    .collection("discord")
    .doc("reminders")
    .collection("entries")
    .doc(id)
    .delete();

  logger.info(`🧼 Removed reminder with ID ${id}`);
}

async function getReminders() {
  const snapshot = await db
    .collection("discord")
    .doc("reminders")
    .collection("entries")
    .get();
  return snapshot.docs.map((doc) => doc.data());
}

module.exports = {
  loadReminders,
  scheduleReminder,
  removeReminder,
  getReminders,
};
