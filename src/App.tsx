import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import folderLogo from "./assets/folder.svg";
import "./App.css";

// Estructura que espeja OrganizeResult del backend Rust
interface OrganizeResult {
  files_moved: number;
  folders_created: string[];
  errors: string[];
}

// Estados posibles de la app
type AppState = "idle" | "organizing" | "done" | "error";

function App() {
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<OrganizeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleOrganize() {
    // Abre el selector de carpetas nativo del sistema operativo
    const selected = await open({ directory: true, multiple: false });

    // El usuario cerró el diálogo sin seleccionar nada
    if (!selected) return;

    setState("organizing");
    setResult(null);
    setErrorMsg("");

    try {
      // Llama al comando Rust `organize_files` con la ruta elegida
      const res = await invoke<OrganizeResult>("organize_files", {
        path: selected as string,
      });
      setResult(res);
      setState("done");
    } catch (err) {
      // El comando Rust devolvió Err(String)
      setErrorMsg(String(err));
      setState("error");
    }
  }

  function reset() {
    setState("idle");
    setResult(null);
    setErrorMsg("");
  }

  return (
    <main className="container">
      {/* Encabezado siempre visible */}
      <div className="header">
        <img src={folderLogo} alt="File Organizer" className="icon" />
        <h1>File Organizer</h1>
        <p className="subtitle">
          Agrupa automáticamente tus archivos por tipo en subcarpetas
        </p>
      </div>

      {/* Estado: esperando acción del usuario */}
      {state === "idle" && (
        <div className="card">
          <p className="hint">
            Selecciona una carpeta y todos sus archivos serán movidos
            a subcarpetas según su extensión.
          </p>
          <button className="btn-primary" onClick={handleOrganize}>
            Seleccionar carpeta
          </button>
        </div>
      )}

      {/* Estado: procesando */}
      {state === "organizing" && (
        <div className="card center">
          <div className="spinner" />
          <p>Organizando archivos...</p>
        </div>
      )}

      {/* Estado: operación completada */}
      {state === "done" && result && (
        <div className="card">
          <p className="result-headline">
            ✓ {result.files_moved} archivo{result.files_moved !== 1 ? "s" : ""} organizado{result.files_moved !== 1 ? "s" : ""}
          </p>

          {/* Carpetas que se crearon en esta ejecución */}
          {result.folders_created.length > 0 && (
            <div className="section">
              <p className="section-label">Carpetas creadas</p>
              <ul className="tag-list">
                {result.folders_created.map((f) => (
                  <li key={f} className="tag">{f}/</li>
                ))}
              </ul>
            </div>
          )}

          {/* Errores no fatales (archivos duplicados, permisos, etc.) */}
          {result.errors.length > 0 && (
            <div className="section">
              <p className="section-label warning">
                {result.errors.length} advertencia{result.errors.length !== 1 ? "s" : ""}
              </p>
              <ul className="error-list">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <button className="btn-secondary" onClick={reset}>
            Organizar otra carpeta
          </button>
        </div>
      )}

      {/* Estado: error fatal devuelto por Rust */}
      {state === "error" && (
        <div className="card center">
          <p className="error-text">✗ {errorMsg || "Error inesperado"}</p>
          <button className="btn-secondary" onClick={reset}>
            Reintentar
          </button>
        </div>
      )}
    </main>
  );
}

export default App;
