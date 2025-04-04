# lala-companion

3D personified desktop assistants, tuned for you, powered by AI vision and voice.

Early access in-development.

## Features

- 3D VRM react-three-fiber avatars.
- Always on microphone, voice to voice AI conversations.
- Screen vision with GPT4-V. Self operating computer functions.
- Install Lala Companion on Linux, Windows or Mac.
- Resizable transparent overlay frame, always on-top AI interface for desktops.

## Join Lalaland

[Discord](https://discord.gg/ypgqHYpEWw) |
[X](https://twitter.com/lalaland_chat)

## Examples:

![image](https://github.com/lalaland-ai/lala-companion/assets/27584221/91a7a062-1d46-4bd7-90f2-f407a39a28d8)

![image](https://github.com/lalaland-ai/lala-companion/assets/27584221/a155d512-a953-4560-9290-1bc5b73992de)

https://github.com/lalaland-ai/lala-companion/assets/27584221/bdc2e66b-4bbb-4cf1-9802-43f234ed0196

## Dev Local Setup

Copy `.env.example` to `.env` and fill in the `OPENAI_API_KEY`.

```bash
npm i

NODE_OPTIONS="--no-experimental-strip-types" npm run start
```

## Dev Notes

This Electron React app consists of 2 main renderers or "views" that talk to eachother through IPC.
The reason being, is its hard to build nice GUIs in an also fully transparent, click through, focus-less threejs 3D scene.

As a rule, no buttons or 2D layers go in the 3D overlay. Only threejs 3D. Vanilla UIs go in "main".
It ruins the vibe to mix.
