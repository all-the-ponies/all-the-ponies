# All The Ponies

[![Discord](https://img.shields.io/discord/1459275396490072237?logo=discord&logoColor=white&label=Discord&color=%235865F2)](https://discord.gg/vk4KaFFggS "Join the discord server")
[![Translation status](https://hosted.weblate.org/widget/all-the-ponies/language-badge.svg)](https://hosted.weblate.org/engage/all-the-ponies/)
[![Translation status](https://hosted.weblate.org/widget/all-the-ponies/svg-badge.svg)](https://hosted.weblate.org/engage/all-the-ponies/)
![License](https://img.shields.io/github/license/all-the-ponies/all-the-ponies)
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/egolayatmanbay)

[All The Ponies](https://all-the-ponies.com) is a website built for the My Little Pony Gameloft game.

## Translating

All The Ponies uses [Weblate](https://hosted.weblate.org/engage/all-the-ponies/) to make translating easier. If you would like to help translate any of the following languages, you can go here: https://hosted.weblate.org/engage/all-the-ponies/, absolutely no programming knowledge is required.

[![Translation status](https://hosted.weblate.org/widget/all-the-ponies/multi-auto.svg)](https://hosted.weblate.org/engage/all-the-ponies/)

## Development

First install the dependencies

```sh
npm install
```

And then simply run the dev server

```sh
npm run dev
```

By default the dev server runs all Cloudflare bindings locally, so you don't need to be logged into Cloudflare. The local R2 bucket starts empty, so game data is read from `https://assets.all-the-ponies.com/` unless you configure a different source.

To use a local asset server (see the [game-data](https://github.com/all-the-ponies/game-data/) repository), set `DEV_ASSETS_URL` in `.env`:

```shell
DEV_ASSETS_URL="http://localhost:3000/all-the-ponies-assets"
```

To use the real remote bindings instead, set this in `.env` and keep using the same `npm run dev` command. This requires `wrangler login` or a `CLOUDFLARE_API_TOKEN` (this is really only if you actually have access or set up your own r2 instance, normally you won't use this).

```sh
CF_REMOTE_BINDINGS="true"
```

To build, run this

```sh
npm run build
```

The optional 3D model viewer and local game-resource demo are documented in
[3D model viewer](docs/3d-model-viewer.md).
