# Docker Setup Guide

This document explains how to run the webdev-bot using Docker.

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)
- `.env` file with required environment variables

## Node Version Management

The Docker setup uses `.nvmrc` as the single source of truth for the Node.js version. The Dockerfile automatically reads this version at build time via the `NODE_VERSION` build argument. No need to manually sync versions between `.nvmrc` and Docker files.

## Environment Variables

Before running the bot, create a `.env` file in the project root with the following variables:

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
```

These variables are loaded automatically by docker-compose and used by `src/env.ts`.

## Quick Start

### Development Mode

Run the bot with hot reload enabled for development:

```bash
pnpm run docker:dev
```

Or using docker-compose directly:

```bash
docker compose --profile dev up
```

In development mode:
- Code changes in `src/` are automatically detected and the bot restarts
- Full development dependencies are available
- Logs are streamed to your terminal

To stop the development container:

```bash
pnpm run docker:stop
# or
docker compose --profile dev down
```

### Production Mode

Run the bot in production mode with optimized image:

```bash
pnpm run docker:prod
```

Or using docker-compose directly:

```bash
docker compose --profile prod up -d
```

In production mode:
- Minimal image size (only production dependencies)
- Optimized for runtime performance
- Runs in detached mode by default

To stop the production container:

```bash
docker compose --profile prod down
```

## Manual Docker Commands

### Build the Image

Build the production image:

```bash
docker build -t webdev-bot:latest \
  --build-arg NODE_VERSION=$(cat .nvmrc | tr -d 'v') \
  --target production .
```

Build the development image:

```bash
docker build -t webdev-bot:dev \
  --build-arg NODE_VERSION=$(cat .nvmrc | tr -d 'v') \
  --target development .
```

### Run Without Compose

Run the production container manually (after building with the NODE_VERSION arg):

```bash
docker run -d \
  --name webdev-bot \
  --env-file .env \
  --restart unless-stopped \
  webdev-bot:latest
```

Run the development container manually (after building with the NODE_VERSION arg):

```bash
docker run -it \
  --name webdev-bot-dev \
  --env-file .env \
  -v $(pwd)/src:/app/src:ro \
  webdev-bot:dev
```

## Troubleshooting

### Bot Not Starting

1. Check if environment variables are set correctly:
   ```bash
   docker compose --profile dev run --rm bot-dev env | grep DISCORD
   ```

2. View container logs:
   ```bash
   docker compose --profile dev logs bot-dev
   # or
   docker logs webdev-bot-dev
   ```

### Permission Issues

If you encounter permission issues with mounted volumes, ensure that the files have appropriate read permissions:

```bash
chmod -R 644 src/
chmod 755 src/
```

### Hot Reload Not Working

If code changes aren't being detected in development mode:

1. Verify the volume mounts are correct:
   ```bash
   docker inspect webdev-bot-dev | grep Mounts -A 10
   ```

2. Restart the container:
   ```bash
   docker compose --profile dev restart
   ```

### Image Size Concerns

The production image is optimized for size using:
- Alpine Linux base image
- Multi-stage builds (dev dependencies not included)
- Only compiled `dist/` folder and production dependencies

To check image size:

```bash
docker images webdev-bot
```

### Rebuilding After Dependency Changes

If you modify `package.json` or `pnpm-lock.yaml`, rebuild the image:

```bash
pnpm run docker:build
# or
docker compose build --no-cache
```

## Best Practices

1. **Never commit `.env`** - Keep your secrets secure
2. **Use production profile for deployment** - Smaller, more secure images
3. **Keep development profile for local testing** - Faster iteration with hot reload
4. **Node version is managed in `.nvmrc`** - Update `.nvmrc` to change Node version for Docker
5. **Regularly update the base image** - Rebuild images after updating `.nvmrc`
6. **Monitor container resources** - Use `docker stats` to check resource usage

## Additional Commands

View running containers:
```bash
docker ps
```

View all containers (including stopped):
```bash
docker ps -a
```

Remove all stopped containers:
```bash
docker compose down -v
```

View container logs in real-time:
```bash
docker compose --profile dev logs -f bot-dev
```

Execute commands inside the container:
```bash
docker compose --profile dev exec bot-dev sh
```

