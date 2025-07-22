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

function calculateNextOccurrence(reminder) {
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

  return next;
}

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

      scheduleSingle(reminder, client);
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
    const timeout = setTimeout(async () => {
      let channel;
      try {
        channel = await client.channels.fetch(reminder.channelId);
      } catch (fetchErr) {
        logger.warn(
          `⚠️ Channel fetch failed for reminder (ID: ${reminder.id}): ${fetchErr.message}. Falling back to user DM.`
        );
      }

      let success = false;
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
            guildId: channel?.guildId,
            channelId: channel?.id,
            id: reminder.messageId || undefined,
            createdTimestamp: reminder.remindAt,
          },
        });

        if (channel) {
          await channel.send({
            content: `<@${reminder.userId}>`,
            embeds: [embed],
          });
        } else {
          // Fallback to direct DM
          await user.send({ embeds: [embed] });
          logger.info(
            `📩 Fell back to DM for reminder (ID: ${reminder.id}) as original channel unavailable.`
          );
        }

        success = true;
        const userTag = await logger.getUsername(client, reminder.userId);
        logger.success(`🔔 Reminder sent to ${userTag} (ID: ${reminder.id})`);

        // Reset failure count on success
        if (reminder.failureCount > 0) {
          await db
            .collection("discord")
            .doc("reminders")
            .collection("entries")
            .doc(reminder.id)
            .set({ failureCount: 0 }, { merge: true });
        }
      } catch (err) {
        logger.error(
          `❌ Failed to fetch user/send reminder (ID: ${reminder.id}): ${err.message}`
        );

        // Increment failure count on any error
        const failureCount = (reminder.failureCount || 0) + 1;
        await db
          .collection("discord")
          .doc("reminders")
          .collection("entries")
          .doc(reminder.id)
          .set({ failureCount }, { merge: true });

        // Auto-pause if threshold reached for recurring
        if (reminder.recurring && failureCount >= 3) {
          await db
            .collection("discord")
            .doc("reminders")
            .collection("entries")
            .doc(reminder.id)
            .set({ paused: true, pausedAt: Date.now() }, { merge: true });
          logger.warn(
            `⏸️ Auto-paused recurring reminder (ID: ${reminder.id}) after ${failureCount} failures. User can resume with /remindme resume.`
          );
          return; // Skip rescheduling
        }
      }

      // Manage lifecycle: reschedule only if not auto-paused (for recurring)
      if (reminder.recurring && reminder.repeatMeta?.type) {
        const next = calculateNextOccurrence(reminder);
        if (next) {
          reminder.remindAt = next.toMillis();
          await scheduleReminder(reminder, client); // Saves updated remindAt and re-schedules
          logger.info(
            `⏩ Rescheduled recurring reminder (ID: ${
              reminder.id
            }) to ${next.toISO()}`
          );
        } else {
          await removeReminder(reminder.id);
          logger.info(
            `🧼 Removed recurring reminder (ID: ${reminder.id}) as no next occurrence found.`
          );
        }
      } else {
        await removeReminder(reminder.id);
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

async function cleanupStaleReminders() {
  const THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  const cutoff = Date.now() - THRESHOLD_MS;

  try {
    const snapshot = await db
      .collection("discord")
      .doc("reminders")
      .collection("entries")
      .where("paused", "==", true)
      .where("pausedAt", "<", cutoff)
      .get();

    if (snapshot.empty) {
      logger.info("[Cleanup] No stale paused reminders found.");
      return;
    }

    for (const doc of snapshot.docs) {
      await removeReminder(doc.id);
      logger.info(`🗑️ Deleted stale paused reminder (ID: ${doc.id}) after 30+ days.`);
    }

    logger.success(`[Cleanup] Deleted ${snapshot.size} stale paused reminders.`);
  } catch (err) {
    logger.error(`[Cleanup] Failed to clean up stale reminders: ${err.message}`);
  }
}

module.exports = {
  loadReminders,
  scheduleReminder,
  removeReminder,
  getReminders,
  cleanupStaleReminders,
};
