# Heroku Deployment Guide for Unieasy

## Prerequisites

- Heroku CLI installed: https://devcenter.heroku.com/articles/heroku-cli
- GitHub repository connected to Heroku (optional but recommended)
- All required environment variables ready

## Deployment Steps

### Option 1: Using Heroku CLI (Recommended for first-time setup)

1. **Login to Heroku**

   ```bash
   heroku login
   ```

2. **Create a new Heroku app**

   ```bash
   heroku create your-app-name
   ```

   Or let Heroku generate a name:

   ```bash
   heroku create
   ```

3. **Set environment variables**

   ```bash
   # Required variables
   heroku config:set SUPABASE_URL=your_supabase_url
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   heroku config:set GOOGLE_PLACES_API_KEY=your_google_api_key

   # Optional but recommended
   heroku config:set CLERK_SECRET_KEY=your_clerk_key
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**

   ```bash
   git push heroku main
   ```

5. **View logs**
   ```bash
   heroku logs --tail
   ```

### Option 2: Using GitHub Integration (for continuous deployment)

1. Connect your GitHub repository to Heroku
2. Click **"Deploy Branch"** from the app dashboard
3. (Optional) Enable **Automatic Deploys** to deploy on every push to main

### Option 3: Using app.json (One-click deployment)

Click this button to deploy directly:
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/your-username/Unieasy)

Then fill in the environment variables in the config vars section.

## Environment Variables Required

| Variable                    | Description                      | Required | Example                          |
| --------------------------- | -------------------------------- | -------- | -------------------------------- |
| `SUPABASE_URL`              | Your Supabase project URL        | ✅       | `https://xxx.supabase.co`        |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key        | ✅       | `eyJh...`                        |
| `GOOGLE_PLACES_API_KEY`     | Google Places API key            | ✅       | `AIza...`                        |
| `CLERK_SECRET_KEY`          | Clerk auth secret                | ❌       | `sk_...`                         |
| `PORT`                      | Server port (auto-set by Heroku) | ❌       | `8080`                           |
| `ALLOWED_ORIGIN`            | CORS origin (auto-generated)     | ❌       | `https://your-app.herokuapp.com` |
| `NODE_ENV`                  | Node environment                 | ❌       | `production`                     |

## Build Process

The Procfile automatically:

1. Installs dependencies for both root and `/server`
2. Builds the React frontend to `/dist`
3. Starts the Express server on Heroku's assigned PORT
4. Express serves static frontend files + API routes

## Monitoring & Logs

```bash
# Real-time logs
heroku logs --tail

# See last 50 lines
heroku logs -n 50

# Filter by app
heroku logs --app your-app-name
```

## Scaling

```bash
# View current dyno
heroku ps

# Scale to multiple dynos
heroku ps:scale web=2

# Change dyno type
heroku dyno:type Standard-1X
```

## Database Migrations

If you need to run migrations:

```bash
heroku run "cd server && npm run migrate"
```

## Health Checks

The app exposes health check endpoints:

- `/healthz` - Database connectivity check
- `/api/health` - Basic health status

## Troubleshooting

### Deployment fails during build

- Check logs: `heroku logs --tail`
- Ensure Node version is compatible: `node: >=18` in package.json
- Verify all dependencies are in package.json (no implicit installs)

### App crashes after deployment

- Check environment variables: `heroku config`
- Verify database connectivity: `heroku logs --tail`
- Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set

### Frontend not loading

- Verify build succeeded: `heroku logs --tail | grep "dist"`
- Check that WEB_DIST_DIR exists in server/index.js

### CORS errors

- Set `ALLOWED_ORIGIN` to your Heroku app URL
- Verify `CLIENT_ORIGIN` if using custom domain

## Custom Domain

```bash
heroku domains:add www.yourdomain.com
```

Then update your DNS records according to Heroku's instructions.

## Useful Commands

```bash
# Open app in browser
heroku open

# Run one-off command
heroku run node -e "console.log(process.env.SUPABASE_URL)"

# Restart app
heroku restart

# View app settings
heroku config

# View app info
heroku apps:info

# Delete app (if needed)
heroku apps:destroy --app your-app-name
```

## Additional Resources

- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Procfile Documentation](https://devcenter.heroku.com/articles/procfile)
- [Configuration and Config Vars](https://devcenter.heroku.com/articles/config-vars)
