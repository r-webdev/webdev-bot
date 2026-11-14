# Reading Logs on the VPS

How to find out what the bot is doing (or why it is not doing something) after you SSH into the VPS.

## 1. Find the container

The container is named `webdev-bot` (see `container_name` in `docker-compose.yml`).

```bash
docker ps        # running containers; the name is in the NAMES column
docker ps -a     # also shows stopped/crashed containers
```

Read the `STATUS` column:

| Status                    | Meaning                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `Up 3 days`               | Running normally                                                   |
| `Up 5 seconds`            | Recently (re)started. If this keeps resetting, it is crash-looping |
| `Exited (1) 2 min ago`    | Crashed. The logs will usually say why                             |
| not listed in `docker ps` | Stopped. Check `docker ps -a`                                      |

## 2. Read the logs

```bash
docker logs --tail 200 webdev-bot          # last 200 lines
docker logs -f --tail 100 webdev-bot       # follow live (Ctrl+C to stop)
docker logs --since 1h webdev-bot          # last hour
docker logs --since 2026-11-14T16:00:00 --until 2026-11-14T16:30:00 webdev-bot
docker logs -t --tail 100 webdev-bot       # add timestamps
```

Always add `2>&1` (send stderr to the same place as stdout) when piping. `docker logs` replays the container's error output on stderr, and a pipe only carries stdout, so without it `grep` would miss the errors:

```bash
docker logs webdev-bot 2>&1 | grep -n -i -E "error|failed|warn"
```

Compose equivalent (run from the project directory containing `docker-compose.yml`):

```bash
docker compose logs --tail 200 bot
docker compose logs --tail 200 migrate    # database migration step
```

## 3. What a healthy startup looks like

Read the first lines of a fresh start:

```bash
docker logs webdev-bot 2>&1 | head -80
```

Startup is sequential. If a step hangs or throws, later steps never run, so a missing line tells you where it stopped. Look for lines like:

- `Initializing Advent of Code scheduler...` / `Advent of Code scheduler initialized`
- `Initializing showcase digest scheduler...` / `Showcase digest scheduler initialized`

A feature whose "initialized" line is missing was never started. Check for a `Failed to initialize ...` line next to it.

## 4. Reading an error

Errors print a message, then a stack trace. Read in this order:

1. **The first line.** It has the error type and code, for example `DiscordAPIError[50013]: Missing Permissions`.
2. **`url:` and `method:` near the bottom.** They show which Discord request failed. For `/channels/<id>/messages` the ID is the channel the bot tried to post in.
3. **Stack lines starting with `file:///app/dist/features/...`.** The folder name tells you which feature threw. Lines inside `node_modules` are library internals.

## 5. Common errors

| Error                                        | Likely cause                                                  | Fix                                                                                                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DiscordAPIError[50013] Missing Permissions` | Bot lacks permission in that channel or for that action       | Check the channel's permission overrides for the bot's role: View Channel, Send Messages. Role pings need the role to be mentionable or the bot to have Mention Everyone |
| `DiscordAPIError[50001] Missing Access`      | Bot cannot see the channel                                    | Give the bot View Channel on it, or check the channel ID in the env                                                                                                      |
| `DiscordAPIError[50035] Invalid Form Body`   | The bot sent a malformed payload (bug in code)                | Read the `errors:` section for the invalid field, then fix in code                                                                                                       |
| `DiscordAPIError[10062] Unknown interaction` | Bot took more than 3 seconds to respond to a command          | Acknowledge the interaction sooner (`deferReply`)                                                                                                                        |
| Missing environment variable on boot         | A variable required in `src/env.ts` is not set on the VPS     | Add it to the VPS env file and recreate the container                                                                                                                    |
| Command not in Discord's `/` menu            | Slash commands are registered separately from the running bot | Run the command deploy step (`pnpm deploy`)                                                                                                                              |
| A feature has no startup log lines           | The container runs an old image                               | Rebuild and redeploy, see below                                                                                                                                          |

## 6. Is the container running the latest code?

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.CreatedAt}}\t{{.Status}}"
```

If the container was created before your last deploy, rebuild and recreate it:

```bash
git pull
docker compose up -d --build
docker logs -f --tail 50 webdev-bot
```

Changes to environment variables also require recreating the container (`docker compose up -d`). A plain `docker restart` does not reload `env_file`.

## 7. Useful extras

```bash
docker stats --no-stream webdev-bot        # CPU and memory usage
docker inspect -f '{{.State.OOMKilled}}' webdev-bot   # true = killed for running out of memory
docker exec -it webdev-bot sh              # open a shell inside the container
df -h                                      # check the VPS disk is not full
```
