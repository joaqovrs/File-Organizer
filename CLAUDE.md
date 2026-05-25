# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## App Purpose

A desktop app that organizes files in a selected directory by grouping them into subfolders named after their extension (e.g. all PDFs go into `pdf/`, all Word docs into `docx/`, all PNGs into `png/`, etc.). The UI is a single button — pressing it creates the necessary folders (if they don't exist) and moves every file into its corresponding folder.

## Commands

```bash
# Run the app in dev mode (starts Vite + Tauri together)
npm run tauri dev

# Build the full desktop app (frontend + Rust binary)
npm run tauri build

# Type-check the frontend
npx tsc --noEmit

# Check/compile Rust only (faster than full Tauri build)
cd src-tauri && cargo check
cd src-tauri && cargo build
```

## Architecture

This is a **Tauri v2** desktop application. The frontend calls into Rust for all filesystem operations via Tauri's IPC bridge.

### Frontend (`src/`)
- React 19 + TypeScript, bundled by Vite (dev server on port 1420)
- Calls Rust commands via `invoke("command_name", { args })` from `@tauri-apps/api/core`
- Entry: `src/main.tsx` → `src/App.tsx`
- UI goal: minimalist, single-button interaction to trigger file organization

### Backend (`src-tauri/`)
- Rust crate split into `src/lib.rs` (all logic) and `src/main.rs` (thin entry point that calls `lib::run()`)
- Tauri commands are defined with `#[tauri::command]` and registered in `tauri::generate_handler![...]` inside `run()`
- `tauri.conf.json` — app window config, build hooks, bundle settings
- `capabilities/default.json` — controls which Tauri APIs the frontend can call; filesystem access requires adding the appropriate permissions here

### Adding a new Rust command
1. Define `#[tauri::command] fn my_cmd(...) -> Result<T, String>` in `src-tauri/src/lib.rs`
2. Register it in `tauri::generate_handler![..., my_cmd]` inside `run()`
3. Call from frontend: `await invoke("my_cmd", { param })`

### Dependencies
- Frontend: `@tauri-apps/api` (IPC), `@tauri-apps/plugin-opener`
- Rust: `tauri`, `tauri-plugin-opener`, `serde`/`serde_json`
