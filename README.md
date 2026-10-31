# Two Player Arena

An online two-player arena game built with React, Vite, and Socket.IO. A four-digit room code lets players join the same match. The Node server is authoritative for movement, bullets, collisions, and HP.

## Run locally

Install dependencies once:

```sh
npm ci
```

Start the Socket.IO server in one terminal:

```sh
npm run server
```

Start the React development server in a second terminal:

```sh
npm run dev
```

Vite serves the frontend. The browser connects directly to the Socket.IO server on port `3001`; Vite does not proxy the connection. Create a room and share the code with the other player.

## Deploy to production with Render

The included [render.yaml](render.yaml) configures one Render web service. It builds the React app and runs the Node server, which serves both the built frontend and Socket.IO on the same public URL.

1. Create a GitHub repository and upload this project, including `package-lock.json` and `render.yaml`.
2. Create a Render account and choose **New + → Blueprint**.
3. Connect your GitHub account and select this repository. Render will read `render.yaml`; review the service settings and choose a compute plan.
4. Click **Apply**. Wait for the first deploy to finish, then open the `onrender.com` URL shown on the service page.
5. Share that URL with the other player. One player creates a room and shares its four-digit code; the other enters the code.

The app listens on Render's `PORT`, serves a `/health` endpoint for deployment checks, and uses the same origin for the frontend and Socket.IO. You do not need to configure a WebSocket URL or CORS for this single-service setup. Later pushes to the connected branch can trigger deployments automatically.

Render's free web services can sleep after 15 minutes without inbound traffic; the next connection may take about a minute to start. For a game you expect people to reach at any time, choose an always-on paid compute plan. Render supports WebSocket connections on web services. See [Render's web service docs](https://render.com/docs/web-services), [WebSocket docs](https://render.com/docs/websocket), and [free instance limits](https://render.com/docs/free).

## Controls

- Both players: WASD or arrow keys to move, Space to fire.
