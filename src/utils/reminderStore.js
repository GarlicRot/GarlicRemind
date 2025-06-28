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
  if (reminder.paused === undefined) reminder.paused = false;

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

        if (reminder.recurring && reminder.repeatMeta?.type) {
          const now = DateTime.fromMillis(reminder.remindAt);
          let next;

          const weekdays = {
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6,
            sunday: 7,
          };

          switch (reminder.repeatMeta.type) {
            case "hour":
              next = now.plus({ hours: 1 });
              break;
            case "day":
              next = now.plus({ days: 1 });
              break;
            case "week":
              next = now.plus({ weeks: 1 });
              break;
            case "month":
              next = now.plus({ months: 1 });
              if (reminder.repeatMeta.userDayOfMonth) {
                next = next.set({ day: reminder.repeatMeta.userDayOfMonth });
                if (next < now) next = next.plus({ months: 1 });
              }
              break;
            default:
              if (weekdays[reminder.repeatMeta.type]) {
                const targetWeekday = weekdays[reminder.repeatMeta.type];
                let daysToAdd = (targetWeekday - now.weekday + 7) % 7;
                if (daysToAdd === 0) daysToAdd = 7;
                next = now.plus({ days: daysToAdd });
              }
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
    } catch (dmErr) {
      logger.warn(
        `⚠️ Could not DM user ${reminder.userId} about failed reminder: ${dmErr.message}`
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
