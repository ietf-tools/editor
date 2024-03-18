<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-text-dark.png">
  <img alt="DraftForge" src="docs/assets/logo-text-light.png" height="175">
</picture>

[![Release](https://img.shields.io/github/release/ietf-tools/editor.svg?style=flat&maxAge=300)](https://github.com/ietf-tools/editor/releases)
[![GitHub Issues](https://img.shields.io/github/issues/ietf-tools/editor?style=flat&logo=github)](https://github.com/ietf-tools/editor/issues)
[![Downloads](https://img.shields.io/github/downloads/ietf-tools/editor/total.svg?style=flat&logo=github)](https://github.com/ietf-tools/editor/releases)
[![Build + Publish](https://github.com/ietf-tools/editor/actions/workflows/build.yml/badge.svg)](https://github.com/ietf-tools/editor/actions/workflows/build.yml)

#### A fully featured editor to write, review and publish Internet Drafts / RFCs.

</div>

- [Install](#install)
  - [Supported Platforms](#supported-platforms)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Build](#build)

---

![](docs/assets/draftforge-screenshot.png)

# Install

Simply download the [latest release](https://github.com/ietf-tools/editor/releases/latest) for your platform.

## Supported Platforms

- Linux (x64, arm64)
- macOS (Intel, Apple Sillicon)
- Windows (x64, arm64)

# Development

## Prerequisites

- Git
- [Node.js](https://nodejs.org/en/download/) `20.x` or later

## Setup

- Clone the repository
- Install NPM dependencies: `npm install`
- Run in dev mode: `npm run dev`

## Build

- Run `npm run build` to build a binary for your platform.

Once the build succeeds, the executable will be located in `dist/electron/Packaged`.
