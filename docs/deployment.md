# LaunchLab Deployment — Tailscale Funnel

Host LaunchLab on your ai-lab server and share it via a public HTTPS URL.

## Prerequisites

- Node 25.x and `uv` (Python 3.12) installed on the ai-lab server
- Tailscale installed and running on the ai-lab server
- Tailscale Funnel enabled for your tailnet (see Step 2)

## Step 1: Clone & Configure

```bash
# On your ai-lab server
git clone <your-repo-url> ~/LaunchLab
cd ~/LaunchLab/backend
cp .env.example .env
```

Edit `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-real-key
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=https://ai-lab.tailnet-name.ts.net
```

Replace `ai-lab.tailnet-name.ts.net` with your actual Tailscale machine name
(run `tailscale status` to find it).

## Step 2: Enable Tailscale Funnel

Funnel must be enabled in your tailnet's ACL policy. In the Tailscale admin console
(https://login.tailscale.com/admin/acls), add this to your ACL file:

```json
{
  "nodeAttrs": [
    {
      "target": ["autogroup:member"],
      "attr": ["funnel"]
    }
  ]
}
```

This allows any machine in your tailnet to use Funnel. You can also target a
specific machine instead of `autogroup:member`.

## Step 3: Build & Start

```bash
cd ~/LaunchLab
./scripts/deploy.sh
```

This builds the frontend, runs migrations, and starts the server on port 8000.

To split the steps (useful for rebuilds):
```bash
./scripts/deploy.sh --build-only   # just rebuild frontend
./scripts/deploy.sh --run-only     # just start the server
```

## Step 4: Expose via Tailscale Funnel

In a separate terminal:
```bash
tailscale funnel 8000
```

This gives you a public URL like:
```
https://ai-lab.tailnet-name.ts.net/
```

That URL is accessible from anywhere on the internet — no VPN needed for visitors.

To verify it's working:
```bash
curl https://ai-lab.tailnet-name.ts.net/api/health
```

## Step 5: Keep It Running (Optional)

To keep LaunchLab running after you close the terminal, use a systemd service
or just run it in a `tmux`/`screen` session:

```bash
# Using tmux
tmux new -s launchlab
cd ~/LaunchLab && ./scripts/deploy.sh --run-only
# Ctrl+B, D to detach

# Funnel in another tmux window
tmux new -s funnel
tailscale funnel 8000
# Ctrl+B, D to detach
```

To make Funnel persistent across reboots:
```bash
tailscale funnel --bg 8000
```

## Updating

```bash
cd ~/LaunchLab
git pull
./scripts/deploy.sh
```

## Troubleshooting

- **"Funnel not available"**: Check that your ACL policy includes the `funnel` attribute (Step 2).
- **502 errors**: Make sure the LaunchLab server is actually running on port 8000.
- **CORS errors**: Update `CORS_ORIGINS` in `backend/.env` to match your Tailscale Funnel URL exactly.
- **Blank page**: Run `./scripts/deploy.sh --build-only` to rebuild the frontend.
