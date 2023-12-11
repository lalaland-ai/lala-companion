# lala-companion

3D personified desktop assistants, tuned for you, powered by AI vision and voice.

Early access in-development.

## Join Lalaland

[Discord](https://discord.gg/ypgqHYpEWw) |
[X](https://twitter.com/lalaland_chat)

## Examples:

![image](https://github.com/lalaland-ai/lala-companion/assets/27584221/91a7a062-1d46-4bd7-90f2-f407a39a28d8)

![Screenshot from 2023-12-10 15-57-24](https://github.com/lalaland-ai/lala-companion/assets/27584221/49f6da56-6c9d-430a-9991-75365a221651)

![Screenshot from 2023-12-09 17-03-28](https://github.com/lalaland-ai/lala-companion/assets/27584221/38e654d0-e157-4d57-8c6f-d0c374cf5f1e)

## Dev Local Setup

```bash
npm i --force

npm run start
```

## Dev Notes

This Electron React app consists of 2 main renderers or "views" that talk to eachother through IPC.
The reason being, is its hard to build nice GUIs in an also fully transparent, click through, focus-less threejs 3D scene.

As a rule, no buttons or 2D layers go in the 3D overlay. Only threejs 3D. Vanilla UIs go in "main".
It ruins the vibe to mix.

The main lego blocks:

1. The typical "main" process in Electron. Controls IPC to the "Overlay" and hosts the boring 2d settings stuff to configure the app.

2. The "Overlay". Responsible for rendering the threejs scene and playing / recording audio. This where the magic happens. This by default is always transparent + borderless frame. It should be minimalistic, focused mostly on just the avatar 3d as to not clutter the user desktop space.

Use Typescript.

AI Streaming is done with ai package from Vercel. useChat hook is good.

We are hosting public AI APIs connected in source code from Lalaland company as a donation out of good faith, these will be subject to logins, rate limits and API keys soon.

A local backend mode would also be nice, coming soon.
