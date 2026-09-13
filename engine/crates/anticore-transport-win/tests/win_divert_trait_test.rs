#[cfg(windows)]
#[test]
fn test_windivert_implements_packet_transport() {
    use anticore_core::transport::PacketTransport;
    use anticore_transport_win::WinDivert;

    fn assert_is_transport<T: PacketTransport>() {}
    assert_is_transport::<WinDivert>();
}

#[cfg(windows)]
#[test]
fn test_filter_compile() {
    use std::ffi::{c_char, c_void, CString};
    use std::os::windows::ffi::OsStrExt;

    extern "system" {
        fn LoadLibraryW(name: *const u16) -> *mut c_void;
        fn GetProcAddress(module: *mut c_void, name: *const u8) -> *mut c_void;
    }

    type CompileFilterFn = unsafe extern "system" fn(
        filter: *const u8,
        layer: i32,
        object: *mut c_char,
        obj_len: u32,
        error_str: *mut *const c_char,
        error_pos: *mut u32,
    ) -> i32;

    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let vendor_path = root.join("vendor/windows/WinDivert.dll");
    let path = if vendor_path.exists() {
        vendor_path
    } else if root.join("WinDivert.dll").exists() {
        root.join("WinDivert.dll")
    } else {
        root.join("engine/vendor/windivert/WinDivert.dll")
    };
    if !path.exists() {
        eprintln!("[!] WinDivert.dll not found, skipping compile test: {}", path.display());
        return;
    }
    let wide: Vec<u16> = path.as_os_str().encode_wide().chain(Some(0)).collect();
    let lib = unsafe { LoadLibraryW(wide.as_ptr()) };
    if lib.is_null() {
        eprintln!("[!] WinDivert.dll could not be loaded from {:?}, skipping", path);
        return;
    }

    let sym_name = CString::new("WinDivertHelperCompileFilter").unwrap();
    let compile_fn: CompileFilterFn = unsafe {
        std::mem::transmute(GetProcAddress(lib, sym_name.as_ptr() as *const u8))
    };

    // Test 1: with allow_forward = false (outbound)
    let f1 = anticore_core::dispatch::capture_filter_with_options(&[], false);
    let mut f1_bytes = f1.as_bytes().to_vec();
    f1_bytes.push(0);
    let mut err_str1: *const c_char = std::ptr::null();
    let mut err_pos1: u32 = 0;
    let res1 = unsafe {
        compile_fn(f1_bytes.as_ptr(), 0, std::ptr::null_mut(), 0, &mut err_str1, &mut err_pos1)
    };
    let msg1 = if !err_str1.is_null() {
        unsafe { std::ffi::CStr::from_ptr(err_str1).to_string_lossy().into_owned() }
    } else {
        String::new()
    };
    println!("f1 (allow_forward=false): res={}, err_pos={}, msg={}", res1, err_pos1, msg1);

    // Test 2: with allow_forward = true (currently produces "(outbound or forward)")
    let f2 = anticore_core::dispatch::capture_filter_with_options(&[], true);
    let mut f2_bytes = f2.as_bytes().to_vec();
    f2_bytes.push(0);
    let mut err_str2: *const c_char = std::ptr::null();
    let mut err_pos2: u32 = 0;
    let res2 = unsafe {
        compile_fn(f2_bytes.as_ptr(), 0, std::ptr::null_mut(), 0, &mut err_str2, &mut err_pos2)
    };
    let msg2 = if !err_str2.is_null() {
        unsafe { std::ffi::CStr::from_ptr(err_str2).to_string_lossy().into_owned() }
    } else {
        String::new()
    };
    println!("f2 (allow_forward=true): res={}, err_pos={}, msg={}", res2, err_pos2, msg2);

    // Test 3: passive defense filter
    let f3 = "inbound and tcp and !loopback and (tcp.SrcPort == 443 or tcp.SrcPort == 80) and tcp.Rst";
    let mut f3_bytes = f3.as_bytes().to_vec();
    f3_bytes.push(0);
    let mut err_str3: *const c_char = std::ptr::null();
    let mut err_pos3: u32 = 0;
    let res3 = unsafe {
        compile_fn(f3_bytes.as_ptr(), 0, std::ptr::null_mut(), 0, &mut err_str3, &mut err_pos3)
    };
    let msg3 = if !err_str3.is_null() {
        unsafe { std::ffi::CStr::from_ptr(err_str3).to_string_lossy().into_owned() }
    } else {
        String::new()
    };
    println!("f3 (pasif savunma): res={}, err_pos={}, msg={}", res3, err_pos3, msg3);

    // Test 4: quic filter
    let f4 = "outbound and udp and udp.DstPort == 443 and udp.PayloadLength >= 1200";
    let mut f4_bytes = f4.as_bytes().to_vec();
    f4_bytes.push(0);
    let mut err_str4: *const c_char = std::ptr::null();
    let mut err_pos4: u32 = 0;
    let res4 = unsafe {
        compile_fn(f4_bytes.as_ptr(), 0, std::ptr::null_mut(), 0, &mut err_str4, &mut err_pos4)
    };
    let msg4 = if !err_str4.is_null() {
        unsafe { std::ffi::CStr::from_ptr(err_str4).to_string_lossy().into_owned() }
    } else {
        String::new()
    };
    println!("f4 (quic engelle): res={}, err_pos={}, msg={}", res4, err_pos4, msg4);
}


