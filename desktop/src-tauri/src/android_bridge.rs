//! Android VpnService ve JNI FFI Köprüsü.
//!
//! Kotlin tarafındaki `AnticoreBridge` ve `AnticoreVpnService` sınıflarıyla
//! iki yönlü iletişim kurar:
//! 1. Kotlin -> Rust: `onTunReady(fd)`, `onTunClosed()`, `onVpnPermissionDenied()`
//! 2. Rust -> Kotlin: `start_vpn_service()`, `stop_vpn_service()`, `protect_socket(fd)`

use std::sync::atomic::{AtomicBool, AtomicI32};
#[allow(unused_imports)]
use std::sync::atomic::Ordering;
#[cfg(target_os = "android")]
use std::sync::OnceLock;

#[cfg(target_os = "android")]
static JVM: OnceLock<jni::JavaVM> = OnceLock::new();

#[allow(dead_code)]
static TUN_FD: AtomicI32 = AtomicI32::new(-1);
#[allow(dead_code)]
static VPN_ACTIVE: AtomicBool = AtomicBool::new(false);
#[allow(dead_code)]
static PERMISSION_DENIED: AtomicBool = AtomicBool::new(false);

#[cfg(target_os = "android")]
#[no_mangle]
pub extern "system" fn JNI_OnLoad(
    vm: *mut jni::sys::JavaVM,
    _reserved: *mut std::ffi::c_void,
) -> jni::sys::jint {
    unsafe {
        if let Ok(jvm) = jni::JavaVM::from_raw(vm) {
            let _ = JVM.set(jvm);
        }
    }
    jni::sys::JNI_VERSION_1_6
}

/// JNI Callback: Kotlin'den TUN dosya tanıtıcısı hazır olduğunda çağrılır.
#[cfg(target_os = "android")]
#[no_mangle]
pub extern "system" fn Java_com_anticore_desktop_AnticoreBridge_onTunReady(
    mut env: jni::JNIEnv,
    _class: jni::objects::JClass,
    fd: i32,
) -> bool {
    if let Ok(jvm) = env.get_java_vm() {
        let _ = JVM.set(jvm);
    }
    TUN_FD.store(fd, Ordering::SeqCst);
    VPN_ACTIVE.store(true, Ordering::SeqCst);
    PERMISSION_DENIED.store(false, Ordering::SeqCst);
    true
}

/// JNI Callback: Kotlin'den TUN kapatıldığında çağrılır.
#[cfg(target_os = "android")]
#[no_mangle]
pub extern "system" fn Java_com_anticore_desktop_AnticoreBridge_onTunClosed(
    _env: jni::JNIEnv,
    _class: jni::objects::JClass,
) {
    TUN_FD.store(-1, Ordering::SeqCst);
    VPN_ACTIVE.store(false, Ordering::SeqCst);
}

/// JNI Callback: Kullanıcı VPN iznini reddettiğinde çağrılır.
#[cfg(target_os = "android")]
#[no_mangle]
pub extern "system" fn Java_com_anticore_desktop_AnticoreBridge_onVpnPermissionDenied(
    _env: jni::JNIEnv,
    _class: jni::objects::JClass,
) {
    PERMISSION_DENIED.store(true, Ordering::SeqCst);
    VPN_ACTIVE.store(false, Ordering::SeqCst);
}

/// Android VpnService'i başlatmak için MainActivity üzerinden izin ve servis çağrısı yapar.
#[cfg(target_os = "android")]
pub fn start_vpn_service() -> Result<(), String> {
    PERMISSION_DENIED.store(false, Ordering::SeqCst);
    let jvm = JVM.get().ok_or_else(|| "JVM başlatılmamış".to_string())?;
    let mut env = jvm
        .attach_current_thread()
        .map_err(|e| format!("JVM iş parçacığı bağlanamadı: {e}"))?;

    let class_name = "com/anticore/desktop/AnticoreBridge";
    let res = env.call_static_method(class_name, "startVpnFromNative", "()Z", &[])
        .map_err(|e| format!("startVpnFromNative çağrı hatası: {e}"))?;

    match res.z() {
        Ok(true) => Ok(()),
        Ok(false) => Err("MainActivity örneği bulunamadı veya VPN başlatılamadı".into()),
        Err(e) => Err(format!("startVpnFromNative dönüş hatası: {e}")),
    }
}

/// Android VpnService'i durdurur.
#[cfg(target_os = "android")]
pub fn stop_vpn_service() -> Result<(), String> {
    VPN_ACTIVE.store(false, Ordering::SeqCst);
    TUN_FD.store(-1, Ordering::SeqCst);
    let jvm = match JVM.get() {
        Some(j) => j,
        None => return Ok(()),
    };
    if let Ok(mut env) = jvm.attach_current_thread() {
        let class_name = "com/anticore/desktop/AnticoreBridge";
        let _ = env.call_static_method(class_name, "stopVpnFromNative", "()Z", &[]);
    }
    Ok(())
}

/// Soketi VPN tüneli döngüsünden muaf tutar (protect).
#[cfg(target_os = "android")]
pub fn protect_socket(socket_fd: i32) -> bool {
    let jvm = match JVM.get() {
        Some(j) => j,
        None => return false,
    };
    if let Ok(mut env) = jvm.attach_current_thread() {
        let class_name = "com/anticore/desktop/AnticoreBridge";
        if let Ok(res) = env.call_static_method(
            class_name,
            "protectSocketFromNative",
            "(I)Z",
            &[jni::objects::JValue::Int(socket_fd)],
        ) {
            if let Ok(ok) = res.z() {
                return ok;
            }
        }
    }
    false
}

#[cfg(target_os = "android")]
pub fn get_tun_fd() -> i32 {
    let current = TUN_FD.load(Ordering::SeqCst);
    if current >= 0 {
        return current;
    }
    // JVM üzerinden doğrudan servisin dosya tanıtıcısını sorgula
    if let Some(jvm) = JVM.get() {
        if let Ok(mut env) = jvm.attach_current_thread() {
            let class_name = "com/anticore/desktop/AnticoreBridge";
            if let Ok(res) = env.call_static_method(class_name, "getTunFdFromNative", "()I", &[]) {
                if let Ok(fd) = res.i() {
                    if fd >= 0 {
                        TUN_FD.store(fd, Ordering::SeqCst);
                        VPN_ACTIVE.store(true, Ordering::SeqCst);
                        return fd;
                    }
                }
            }
        }
    }
    -1
}

#[cfg(target_os = "android")]
pub fn is_vpn_running() -> bool {
    VPN_ACTIVE.load(Ordering::SeqCst)
}

#[cfg(target_os = "android")]
pub fn is_permission_denied() -> bool {
    PERMISSION_DENIED.load(Ordering::SeqCst)
}

// Fallbacks for non-Android targets
#[cfg(not(target_os = "android"))]
pub fn start_vpn_service() -> Result<(), String> {
    Err("VpnService yalnızca Android platformunda geçerlidir".into())
}

#[cfg(not(target_os = "android"))]
pub fn stop_vpn_service() -> Result<(), String> {
    Ok(())
}

#[cfg(not(target_os = "android"))]
pub fn protect_socket(_socket_fd: i32) -> bool {
    true
}

#[cfg(not(target_os = "android"))]
pub fn get_tun_fd() -> i32 {
    -1
}

#[cfg(not(target_os = "android"))]
pub fn is_vpn_running() -> bool {
    false
}

#[cfg(not(target_os = "android"))]
pub fn is_permission_denied() -> bool {
    false
}
