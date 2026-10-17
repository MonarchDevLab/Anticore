//! Android VpnService ve JNI FFI Köprüsü.
//!
//! Kotlin tarafındaki `AnticoreBridge` ve `AnticoreVpnService` sınıflarıyla
//! iki yönlü iletişim kurar:
//! 1. Kotlin -> Rust: `onTunReady(fd)`, `onTunClosed()`, `onVpnPermissionDenied()`
//! 2. Rust -> Kotlin: `start_vpn_service()`, `stop_vpn_service()`, `protect_socket(fd)`

use std::sync::atomic::{AtomicBool, AtomicI32, AtomicU16};
#[allow(unused_imports)]
use std::sync::atomic::Ordering;
#[cfg(target_os = "android")]
use std::sync::OnceLock;

#[cfg(target_os = "android")]
static JVM: OnceLock<jni::JavaVM> = OnceLock::new();
#[cfg(target_os = "android")]
static BRIDGE_CLASS: OnceLock<jni::objects::GlobalRef> = OnceLock::new();

#[allow(dead_code)]
static TUN_FD: AtomicI32 = AtomicI32::new(-1);
#[allow(dead_code)]
static VPN_ACTIVE: AtomicBool = AtomicBool::new(false);
#[allow(dead_code)]
static PERMISSION_DENIED: AtomicBool = AtomicBool::new(false);
static SOCKS_PORT: AtomicU16 = AtomicU16::new(10808);

pub fn set_socks_port(port: u16) {
    SOCKS_PORT.store(port, Ordering::SeqCst);
}

pub fn get_socks_port() -> u16 {
    SOCKS_PORT.load(Ordering::SeqCst)
}

#[cfg(target_os = "android")]
fn cache_jvm_and_class(env: &mut jni::JNIEnv, class: &jni::objects::JClass) {
    if let Ok(jvm) = env.get_java_vm() {
        let _ = JVM.set(jvm);
    }
    if BRIDGE_CLASS.get().is_none() && !class.is_null() {
        if let Ok(global_ref) = env.new_global_ref(class) {
            let _ = BRIDGE_CLASS.set(global_ref);
        }
    }
}

#[cfg(target_os = "android")]
fn clear_and_describe_exception(env: &mut jni::JNIEnv) -> Option<String> {
    if !env.exception_check().unwrap_or(false) {
        return None;
    }
    let exc = match env.exception_occurred() {
        Ok(e) => e,
        Err(_) => {
            let _ = env.exception_clear();
            return Some("Bilinmeyen JNI istisnası".into());
        }
    };
    let _ = env.exception_clear();
    if exc.is_null() {
        return None;
    }
    if let Ok(val) = env.call_method(&exc, "toString", "()Ljava/lang/String;", &[]) {
        if let Ok(obj) = val.l() {
            if !obj.is_null() {
                let jstr = jni::objects::JString::from(obj);
                let msg = env.get_string(&jstr).ok().map(|s| s.to_string_lossy().into_owned());
                if let Some(m) = msg {
                    return Some(m);
                }
            }
        }
    }
    let _ = env.exception_clear();
    Some("Java istisnası fırlatıldı".into())
}

#[cfg(target_os = "android")]
fn resolve_bridge_class<'a>(env: &mut jni::JNIEnv<'a>) -> Result<jni::objects::JClass<'a>, String> {
    if let Some(global) = BRIDGE_CLASS.get() {
        let obj = unsafe { jni::objects::JObject::from_raw(global.as_obj().as_raw()) };
        return Ok(jni::objects::JClass::from(obj));
    }
    match env.find_class("com/anticore/desktop/AnticoreBridge") {
        Ok(cls) => {
            if let Ok(global_ref) = env.new_global_ref(&cls) {
                let _ = BRIDGE_CLASS.set(global_ref);
            }
            Ok(cls)
        }
        Err(e) => {
            let detail = clear_and_describe_exception(env).unwrap_or_else(|| e.to_string());
            Err(format!("AnticoreBridge sınıfı çözümlenemedi: {detail}"))
        }
    }
}

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

/// JNI Callback: Kotlin initBridge çağrısından JVM ve sınıf referansını yakalar.
#[cfg(target_os = "android")]
#[no_mangle]
pub extern "system" fn Java_com_anticore_desktop_AnticoreBridge_initNativeBridge(
    mut env: jni::JNIEnv,
    class: jni::objects::JClass,
) -> bool {
    cache_jvm_and_class(&mut env, &class);
    JVM.get().is_some() && BRIDGE_CLASS.get().is_some()
}

/// JNI Callback: Kotlin'den TUN dosya tanıtıcısı hazır olduğunda çağrılır.
#[cfg(target_os = "android")]
#[no_mangle]
pub extern "system" fn Java_com_anticore_desktop_AnticoreBridge_onTunReady(
    mut env: jni::JNIEnv,
    class: jni::objects::JClass,
    fd: i32,
) -> bool {
    cache_jvm_and_class(&mut env, &class);
    TUN_FD.store(fd, Ordering::SeqCst);
    VPN_ACTIVE.store(true, Ordering::SeqCst);
    PERMISSION_DENIED.store(false, Ordering::SeqCst);
    anticore_core::proxy::set_socket_protector(|s_fd| {
        protect_socket(s_fd)
    });
    true
}

/// JNI Callback: Kotlin'den TUN kapatıldığında çağrılır.
#[cfg(target_os = "android")]
#[no_mangle]
pub extern "system" fn Java_com_anticore_desktop_AnticoreBridge_onTunClosed(
    mut env: jni::JNIEnv,
    class: jni::objects::JClass,
) {
    cache_jvm_and_class(&mut env, &class);
    TUN_FD.store(-1, Ordering::SeqCst);
    VPN_ACTIVE.store(false, Ordering::SeqCst);
}

/// JNI Callback: Kullanıcı VPN iznini reddettiğinde çağrılır.
#[cfg(target_os = "android")]
#[no_mangle]
pub extern "system" fn Java_com_anticore_desktop_AnticoreBridge_onVpnPermissionDenied(
    mut env: jni::JNIEnv,
    class: jni::objects::JClass,
) {
    cache_jvm_and_class(&mut env, &class);
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

    let bridge_class = resolve_bridge_class(&mut env)?;
    let port = SOCKS_PORT.load(Ordering::SeqCst) as i32;
    let _ = env.call_static_method(
        &bridge_class,
        "setSocksPortFromNative",
        "(I)V",
        &[jni::objects::JValue::Int(port)],
    );
    let _ = clear_and_describe_exception(&mut env);

    let res = env
        .call_static_method(&bridge_class, "startVpnFromNative", "()Z", &[])
        .map_err(|e| {
            let detail = clear_and_describe_exception(&mut env).unwrap_or_else(|| e.to_string());
            format!("startVpnFromNative çağrı hatası: {detail}")
        })?;

    let _ = clear_and_describe_exception(&mut env);

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
        if let Ok(bridge_class) = resolve_bridge_class(&mut env) {
            let _ = env.call_static_method(&bridge_class, "stopVpnFromNative", "()Z", &[]);
            let _ = clear_and_describe_exception(&mut env);
        }
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
        if let Ok(bridge_class) = resolve_bridge_class(&mut env) {
            if let Ok(res) = env.call_static_method(
                &bridge_class,
                "protectSocketFromNative",
                "(I)Z",
                &[jni::objects::JValue::Int(socket_fd)],
            ) {
                let _ = clear_and_describe_exception(&mut env);
                if let Ok(ok) = res.z() {
                    return ok;
                }
            } else {
                let _ = clear_and_describe_exception(&mut env);
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
            if let Ok(bridge_class) = resolve_bridge_class(&mut env) {
                if let Ok(res) = env.call_static_method(&bridge_class, "getTunFdFromNative", "()I", &[]) {
                    let _ = clear_and_describe_exception(&mut env);
                    if let Ok(fd) = res.i() {
                        if fd >= 0 {
                            TUN_FD.store(fd, Ordering::SeqCst);
                            VPN_ACTIVE.store(true, Ordering::SeqCst);
                            return fd;
                        }
                    }
                } else {
                    let _ = clear_and_describe_exception(&mut env);
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
