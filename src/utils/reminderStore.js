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
const { DateTime } = require("luxon");

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
      // ⏸️ Skip paused reminders
      if (reminder.paused) {
        logger.info(`⏸️ Skipping paused reminder: ${reminder.id}`);
        continue;
      }

      const timeLeft = reminder.remindAt - Date.now();
      const userTag = await logger.getUsername(client, reminder.userId);

      if (timeLeft <= 0) {
        logger.warn(
          `⏰ Overdue reminder for ${userTag} (ID: ${
            reminder.id
          }) overdue by ${Math.abs(timeLeft)}ms`
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
              id: reminder.messageId || reminder.id,
              createdTimestamp: Date.now(),
            },
          });

          await channel.send({
            content: `<@${reminder.userId}>`,
            embeds: [embed],
          });

          logger.success(
            `✅ Sent overdue reminder (ID: ${reminder.id}) for ${userTag}`
          );
          await removeReminder(reminder.id);
        } catch (err) {
          logger.error(
            `❌ Failed to send overdue reminder (ID: ${reminder.id}): ${err.message}`
          );
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
  if (reminder.paused === undefined) reminder.paused = false; // Default if not set

  await db
    .collection("discord")
    .doc("reminders")
    .collection("entries")
    .doc(reminder.id)
    .set(reminder);

  const userTag = await logger.getUsername(client, reminder.userId);
  logger.success(
    `⏰ Reminder saved for ${userTag} (ID: ${reminder.id}) – ${new Date(
      reminder.remindAt
    ).toISOString()} in channel ${reminder.channelId}`
  );

  if (!reminder.paused) {
    scheduleSingle(reminder, client);
  } else {
    logger.info(`⏸️ Reminder ${reminder.id} is paused. Not scheduled.`);
  }
}

async function scheduleSingle(reminder, client) {
  if (reminder.paused) {
    logger.info(`⏸️ Reminder ${reminder.id} is paused. Skipping schedule.`);
    return;
  }

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
            id: reminder.messageId || undefined,
            createdTimestamp: reminder.remindAt,
          },
        });

        await channel.send({
          content: `<@${reminder.userId}>`,
          embeds: [embed],
        });

        const userTag = await logger.getUsername(client, reminder.userId);
        logger.success(
          `🔔 Reminder sent to ${userTag} in ${reminder.channelId} (ID: ${reminder.id})`
        );

        // 🔁 Reschedule if recurring and not paused
        if (reminder.recurring && reminder.repeatMeta?.type) {
          const now = DateTime.fromMillis(reminder.remindAt);
          let next;

          switch (reminder.repeatMeta.type) {
            case "daily":
              next = now.plus({ days: 1 });
              break;
            case "weekly":
              next = now.plus({ weeks: 1 });
              break;
            case "monthly":
              next = now.plus({ months: 1 });
              break;
            case "weekdays":
              let offset = 1;
              do {
                next = now.plus({ days: offset++ });
              } while (next.weekday > 5);
              break;
            default:
              logger.warn(
                `⚠️ Unknown repeat type: ${reminder.repeatMeta.type}`
              );
              next = null;
          }

          if (next) {
            reminder.remindAt = next.toMillis();
            await scheduleReminder(reminder, client);
          } else {
            await removeReminder(reminder.id);
          }
        } else {
          await removeReminder(reminder.id);
        }
      } catch (sendErr) {
        logger.error(
          `❌ Failed to send reminder (ID: ${reminder.id}): ${sendErr.message}`
        );
      }
    }, delay);

    activeTimeouts[reminder.id] = timeout;
  } catch (err) {
    const userTag = await logger.getUsername(client, reminder.userId);

    logger.warn(
      `⚠️ Could not schedule reminder (ID: ${reminder.id}) for ${userTag}: ${err.message}`
    );

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
        `⚠️ Could not DM user ${reminder.userId} about failed reminder: ${userErr.message}`
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

  logger.info(`🧼 Removed reminder (ID: ${id})`);
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
