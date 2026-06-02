mod approvals;
mod audit;
mod commands;
mod policy;
mod providers;
mod runtime;
mod secrets;
mod tool_host;

use commands::{
    boundary::{get_runtime_boundary_snapshot, run_tool_request},
    overview::get_runtime_overview,
};
use runtime::state::RuntimeState;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Manager, Runtime,
};

const APP_NAME: &str = "Guardrail by Tenra";
const MENU_SETTINGS: &str = "settings";
const MENU_CLOSE_WINDOW: &str = "close-window";
const MENU_QUIT: &str = "quit";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .menu(build_app_menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            MENU_SETTINGS => {
                let _ = show_main_window(app);
            }
            MENU_CLOSE_WINDOW => {
                let _ = close_main_window(app);
            }
            MENU_QUIT => app.exit(0),
            _ => {}
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .manage(RuntimeState::new().expect("failed to load Guardrail by Tenra policy"))
        .invoke_handler(tauri::generate_handler![
            get_runtime_overview,
            get_runtime_boundary_snapshot,
            run_tool_request
        ])
        .build(tauri::generate_context!())
        .expect("error while building Guardrail by Tenra");

    app.run(|app_handle, event| match event {
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen {
            has_visible_windows: false,
            ..
        } => {
            let _ = show_main_window(app_handle);
        }
        _ => {}
    });
}

fn build_app_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let app_menu = Submenu::with_items(
        app,
        APP_NAME,
        true,
        &[
            &MenuItem::with_id(app, MENU_SETTINGS, "Settings...", true, Some("CmdOrCtrl+,"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                MENU_CLOSE_WINDOW,
                "Close Window",
                true,
                Some("CmdOrCtrl+W"),
            )?,
            &MenuItem::with_id(app, MENU_QUIT, "Quit", true, Some("CmdOrCtrl+Q"))?,
        ],
    )?;

    Menu::with_items(app, &[&app_menu])
}

fn show_main_window<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        window.show()?;
        window.set_focus()?;
    }

    Ok(())
}

fn close_main_window<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide()?;
    }

    Ok(())
}
