<p align="center">
  <img src="icon.png" width="300" alt="GarlicRemind logo" />
</p>

<h1 align="center">GarlicRemind</h1>

<p align="center">
  <a href="https://discord.com/oauth2/authorize?client_id=1381036586304667820&scope=bot+applications.commands&permissions=2147576832">
    <img src="https://img.shields.io/badge/Invite-Bot-5865F2?logo=discord&logoColor=white" alt="Invite" />
  </a>
  <a href="https://github.com/GarlicRot/GarlicRemind">
    <img src="https://img.shields.io/github/repo-size/GarlicRot/GarlicRemind" alt="Repo Size" />
  </a>
  <a href="https://github.com/GarlicRot/GarlicRemind/actions/workflows/ci.yml">
    <img src="https://github.com/GarlicRot/GarlicRemind/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
</p>

<p align="center">
  GarlicRemind is a precise and lightweight Discord bot for setting reminders. It supports durations, specific dates, today-at scheduling, recurring events, and full timezone support. Designed to be simple, useful, and clutter-free.
</p>


---

## Features

- **Flexible Reminders**  
  Set reminders using durations (`/remindme in`), exact dates (`/remindme on`), or specific times today (`/remindme at`).

- **Timezone Awareness**  
  Reminders are automatically scheduled in your local timezone using `/remindme timezone`.

- **Recurring Scheduling**  
  Supports daily, weekly, monthly, and custom weekday reminders with `/remindme every`.

- **Persistent Storage**  
  Reminders are saved and restored automatically even after bot restarts.

- **Minimalist Design**  
  Focused on functionality with clean embeds and zero noise.

- **Built-in Help Command**  
  Use `/help` to get a detailed breakdown of all available commands.

---

> [!TIP]
> Use natural time formats like `10m`, `2h`, `01:30 PM`, or `MM-DD-YYYY` when using the bot.

<p align="center">
  <img src="https://garlic.tulipterminal.com/SeRU1/kaWoPate64.gif/raw" alt="GarlicRemind demo" width="600" />
</p>

---

> [!NOTE]
> The bot supports autocomplete for time, date, and timezone entries to speed up your workflow.

## Commands

| Command              | Description                                                 |
|----------------------|-------------------------------------------------------------|
| `/remindme in`       | Set a reminder after a duration (e.g., 10m, 2h)             |
| `/remindme at`       | Set a reminder at a specific time today (e.g., 07:00 PM)    |
| `/remindme on`       | Set a reminder for a specific date and time                |
| `/remindme every`    | Set a recurring reminder (e.g., every Friday at 3:00 PM)    |
| `/remindme view`     | View your active reminders                                  |
| `/remindme cancel`   | Cancel a specific reminder                                  |
| `/remindme clear`    | Remove all reminders at once                                |
| `/remindme timezone` | Set your local timezone                                     |
| `/help`              | Display a list of all supported commands                    |

---

> [!WARNING]
> Timezone must be configured before using `/remindme on`, `/remindme at`, or `/remindme every`.

---

## Compliance

GarlicRemind is in the process of verification. The following links will be used for compliance purposes:

- [Terms of Service](https://garlicremind.github.io/terms)
- [Privacy Policy](https://garlicremind.github.io/privacy)

---

## About

Developed by [GarlicRot](https://github.com/GarlicRot)  
Licensed under the [MIT License](./LICENSE)
