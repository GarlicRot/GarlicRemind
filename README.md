<p align="center">
  <img src="icon.png" width="300" alt="GarlicRemind logo" />
</p>

<h1 align="center">GarlicRemind</h1>

<p align="center">
  <a href="https://discord.com/oauth2/authorize?client_id=1381036586304667820&scope=bot+applications.commands&permissions=2147576832">
    <img src="https://img.shields.io/badge/Invite-Bot-5865F2?logo=discord&logoColor=white" alt="Invite" />
  </a>
  <a href="https://discord.gg/X4rwss4DRg">
    <img src="https://img.shields.io/badge/Support-Server-5865F2?logo=discord&logoColor=white" alt="Support Server" />
  </a>
  <a href="https://github.com/GarlicRot/GarlicRemind">
    <img src="https://img.shields.io/github/repo-size/GarlicRot/GarlicRemind" alt="Repo Size" />
  </a>
  <a href="https://github.com/GarlicRot/GarlicRemind/actions/workflows/ci.yml">
    <img src="https://github.com/GarlicRot/GarlicRemind/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </a>
</p>

<p align="center">
  <strong>GarlicRemind</strong> is a fast, lightweight Discord bot for setting reminders.  
  Supports natural durations, exact dates, timezone awareness, and recurring schedules.
</p>

---

## Features

-  **Flexible Reminders** – Use durations (`10m`, `2h`), specific dates (`06-20-2025`), or times (`07:00 PM`)
-  **Timezone Support** – Set your timezone once with `/remindme timezone`, and all reminders auto-adjust
-  **Recurring Reminders** – Daily, weekly, monthly, or specific weekdays
-  **Persistent Storage** – Survives restarts; reminders are saved and restored automatically
-  **Autocomplete** – Smart suggestions for time, date, and timezone fields
-  **Minimalist UX** – Clean embeds, no spam, no distractions
-  **Built-in Help** – `/help` gives a quick breakdown of all commands

> [!TIP]
> Use natural time formats like `10m`, `2h`, `01:30 PM`, or `MM-DD-YYYY`.

<p align="center">
  <img src="https://garlic.tulipterminal.com/SeRU1/kaWoPate64.gif/raw" alt="GarlicRemind demo" width="600" />
</p>

---

## Commands

| Command              | Description                                                 |
|----------------------|-------------------------------------------------------------|
| `/remindme in`       | Set a reminder after a duration (e.g., 10m, 2h)             |
| `/remindme at`       | Set a reminder for a time later today (e.g., 07:00 PM)      |
| `/remindme on`       | Set a reminder for a specific date & time                   |
| `/remindme every`    | Set a recurring reminder (e.g., every Friday 3:00 PM)       |
| `/remindme view`     | View your active reminders                                  |
| `/remindme cancel`   | Cancel a specific reminder                                  |
| `/remindme clear`    | Clear all your reminders                                    |
| `/remindme pause`    | Pause a reminder without deleting it                        |
| `/remindme resume`   | Resume a previously paused reminder                         |
| `/remindme timezone` | Set your local timezone                                     |
| `/help`              | Show all supported commands                                 |

> [!IMPORTANT]
> You must set your timezone before using `/remindme on`, `/remindme at`, or `/remindme every`.

---

## Compliance

GarlicRemind is currently undergoing Discord bot verification.

- [Terms of Service](https://garlicremind.github.io/terms)  
- [Privacy Policy](https://garlicremind.github.io/privacy)

---

## About

Created by [GarlicRot](https://github.com/GarlicRot)  
Licensed under the [MIT License](./LICENSE)
