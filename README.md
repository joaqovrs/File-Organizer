# File Organizer

Una aplicación de escritorio minimalista que organiza los archivos de una carpeta agrupándolos automáticamente en subcarpetas según su extensión.

Seleccionas una carpeta y, con un solo clic, todos sus archivos se mueven a subcarpetas nombradas según su tipo: los `.pdf` van a `pdf/`, los `.png` a `png/`, los `.docx` a `docx/`, etc.

## ✨ Características

- **Un solo botón**: eliges la carpeta y la app hace el resto.
- **Agrupación por extensión**: crea automáticamente una subcarpeta por cada tipo de archivo (en minúsculas).
- **Archivos sin extensión**: se agrupan en una carpeta `otros/`.
- **No destructivo**: si en el destino ya existe un archivo con el mismo nombre, lo omite y te avisa en vez de sobrescribirlo.
- **Resumen claro**: al terminar muestra cuántos archivos se movieron, qué carpetas se crearon y cualquier advertencia.
- **Nativa y liviana**: construida con Tauri (binario pequeño, sin Electron).

> **Nota:** la organización **no es recursiva**. Solo se mueven los archivos que están directamente en la carpeta elegida; las subcarpetas existentes se ignoran.

## 📥 Descargar (usuarios)

Si solo quieres usar la app sin compilarla, descarga el instalador desde la sección **[Releases](https://github.com/joaqovrs/File-Organizer/releases)**.

1. Entra a la última release.
2. Descarga el instalador para tu sistema operativo:
   - **Windows**: `.msi` o `.exe`
   - **macOS**: `.dmg`
   - **Linux**: `.AppImage` o `.deb`
3. Instala y abre la aplicación.

## 🚀 Uso

1. Abre **File Organizer**.
2. Haz clic en **Seleccionar carpeta**.
3. Elige la carpeta que quieres ordenar en el selector nativo.
4. Listo: los archivos quedan agrupados en subcarpetas por extensión y verás un resumen de la operación.

## 🛠️ Compilar desde el código fuente (desarrolladores)

### Prerequisitos

- [Node.js](https://nodejs.org/) (incluye npm)
- [Rust y Cargo](https://www.rust-lang.org/tools/install)
- Las [dependencias de sistema de Tauri](https://tauri.app/start/prerequisites/) para tu sistema operativo

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/joaqovrs/File-Organizer.git
cd File-Organizer

# 2. Instalar las dependencias del frontend
npm install

# 3. Ejecutar en modo desarrollo (Vite + Tauri)
npm run tauri dev

# 4. O generar el instalador / binario de producción
npm run tauri build
```

El instalador generado por `npm run tauri build` queda en:

```
src-tauri/target/release/bundle/
```

### Otros comandos útiles

```bash
# Verificar tipos del frontend
npx tsc --noEmit

# Compilar solo el backend de Rust (más rápido que el build completo)
cd src-tauri && cargo check
```

## 🧱 Stack tecnológico

- **[Tauri v2](https://tauri.app/)** — framework de escritorio (backend en Rust)
- **[React 19](https://react.dev/)** + **TypeScript** — interfaz de usuario
- **[Vite](https://vitejs.dev/)** — bundler y servidor de desarrollo

## 📂 Estructura del proyecto

```
File-Organizer/
├── src/                  # Frontend React + TypeScript
│   ├── App.tsx           # UI principal y lógica de estado
│   └── main.tsx          # Punto de entrada
├── src-tauri/            # Backend Rust (Tauri)
│   ├── src/lib.rs        # Comando `organize_files` (mueve los archivos)
│   ├── src/main.rs       # Punto de entrada del binario
│   ├── tauri.conf.json   # Configuración de la app y del bundle
│   └── capabilities/     # Permisos de las APIs de Tauri
└── package.json          # Dependencias y scripts del frontend
```

## ⚙️ Cómo funciona

El frontend invoca el comando Rust `organize_files` pasándole la ruta seleccionada. El backend recorre los archivos directos del directorio, determina la extensión de cada uno, crea la subcarpeta correspondiente si no existe y mueve el archivo dentro. El movimiento se hace con `fs::rename`, que es atómico cuando origen y destino están en el mismo sistema de archivos. Al finalizar devuelve un resumen (archivos movidos, carpetas creadas y advertencias) que la UI muestra al usuario.
