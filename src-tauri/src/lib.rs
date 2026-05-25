use std::collections::HashSet;
use std::fs;
use std::path::Path;
use serde::Serialize;

/// Resultado que se serializa a JSON y se devuelve al frontend
#[derive(Serialize)]
pub struct OrganizeResult {
    pub files_moved: u32,
    pub folders_created: Vec<String>,
    pub errors: Vec<String>,
}

/// Mueve todos los archivos del directorio `path` a subcarpetas
/// nombradas según su extensión (p.ej. pdf/, png/, docx/).
/// Solo opera sobre archivos directos del directorio, no recursivo.
#[tauri::command]
fn organize_files(path: String) -> Result<OrganizeResult, String> {
    let dir = Path::new(&path);

    if !dir.is_dir() {
        return Err("La ruta seleccionada no es un directorio válido".to_string());
    }

    let mut files_moved: u32 = 0;
    let mut folders_created: Vec<String> = Vec::new();
    let mut errors: Vec<String> = Vec::new();
    // Rastrea las carpetas ya creadas en esta ejecución para no repetirlas
    let mut created_set: HashSet<String> = HashSet::new();

    let entries = fs::read_dir(dir).map_err(|e| format!("No se pudo leer el directorio: {}", e))?;

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(e) => {
                errors.push(format!("Error leyendo entrada: {}", e));
                continue;
            }
        };

        let file_path = entry.path();

        // Ignorar subdirectorios: solo procesamos archivos directos
        if !file_path.is_file() {
            continue;
        }

        // Determinar extensión; archivos sin extensión van a "otros"
        let extension = file_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("otros")
            .to_lowercase();

        let target_dir = dir.join(&extension);

        // Crear la subcarpeta si todavía no existe
        if !target_dir.exists() {
            if let Err(e) = fs::create_dir(&target_dir) {
                errors.push(format!("No se pudo crear la carpeta '{}': {}", extension, e));
                continue;
            }
            // Registrar solo la primera vez que se crea cada carpeta
            if created_set.insert(extension.clone()) {
                folders_created.push(extension.clone());
            }
        }

        let file_name = file_path.file_name().unwrap();
        let target_path = target_dir.join(file_name);

        // Si ya existe un archivo con el mismo nombre en el destino, saltarlo
        if target_path.exists() {
            errors.push(format!(
                "Ya existe '{}' en la carpeta '{}', se omitió",
                file_name.to_string_lossy(),
                extension
            ));
            continue;
        }

        // Mover el archivo (rename es atómico en el mismo filesystem)
        if let Err(e) = fs::rename(&file_path, &target_path) {
            errors.push(format!(
                "No se pudo mover '{}': {}",
                file_name.to_string_lossy(),
                e
            ));
        } else {
            files_moved += 1;
        }
    }

    Ok(OrganizeResult {
        files_moved,
        folders_created,
        errors,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init()) // plugin para el selector de carpetas nativo
        .invoke_handler(tauri::generate_handler![organize_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
