#[cfg(windows)]
use windows::Win32::NetworkManagement::IpHelper::{GetExtendedTcpTable, MIB_TCPTABLE_OWNER_PID, MIB_TCP6TABLE_OWNER_PID, TCP_TABLE_OWNER_PID_ALL};
#[cfg(windows)]
use windows::Win32::Foundation::{NO_ERROR, CloseHandle, MAX_PATH};
#[cfg(windows)]
use windows::Win32::Networking::WinSock::{AF_INET, AF_INET6};
#[cfg(windows)]
use windows::Win32::System::Threading::{OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION};
#[cfg(windows)]
use windows::Win32::System::ProcessStatus::GetProcessImageFileNameW;

#[cfg(windows)]
pub fn resolve_socket_info(port: u16) -> Option<(u32, Option<String>)> {
    let pid = get_pid_from_port(port, AF_INET.0 as u32)
        .or_else(|| get_pid_from_port(port, AF_INET6.0 as u32))?;

    let name = get_process_name(pid);
    Some((pid, name))
}

#[cfg(not(windows))]
pub fn resolve_socket_info(_port: u16) -> Option<(u32, Option<String>)> {
    None
}

#[cfg(windows)]
pub fn resolve_process_name(port: u16) -> Option<String> {
    resolve_socket_info(port).and_then(|(_, name)| name)
}

#[cfg(not(windows))]
pub fn resolve_process_name(_port: u16) -> Option<String> {
    None
}

#[cfg(windows)]
fn get_pid_from_port(port: u16, af: u32) -> Option<u32> {
    let mut size = 0;
    unsafe {
        let _ = GetExtendedTcpTable(None, &mut size, false, af, TCP_TABLE_OWNER_PID_ALL, 0);
    }
    if size == 0 { return None; }

    let mut buf = vec![0u8; size as usize];
    let res = unsafe {
        GetExtendedTcpTable(Some(buf.as_mut_ptr() as *mut _), &mut size, false, af, TCP_TABLE_OWNER_PID_ALL, 0)
    };

    if res != NO_ERROR.0 { return None; }

    if af == AF_INET.0 as u32 {
        let table = unsafe { &*(buf.as_ptr() as *const MIB_TCPTABLE_OWNER_PID) };
        let rows = unsafe { std::slice::from_raw_parts(table.table.as_ptr(), table.dwNumEntries as usize) };
        for row in rows {
            let local_port = u16::from_be(row.dwLocalPort as u16);
            if local_port == port { return Some(row.dwOwningPid); }
        }
    } else if af == AF_INET6.0 as u32 {
        let table = unsafe { &*(buf.as_ptr() as *const MIB_TCP6TABLE_OWNER_PID) };
        let rows = unsafe { std::slice::from_raw_parts(table.table.as_ptr(), table.dwNumEntries as usize) };
        for row in rows {
            let local_port = u16::from_be(row.dwLocalPort as u16);
            if local_port == port { return Some(row.dwOwningPid); }
        }
    }
    None
}

#[cfg(windows)]
fn get_process_name(pid: u32) -> Option<String> {
    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        let mut buf = [0u16; MAX_PATH as usize];
        let len = GetProcessImageFileNameW(handle, &mut buf);
        let _ = CloseHandle(handle);
        if len > 0 {
            let full_path = String::from_utf16_lossy(&buf[..len as usize]);
            let name = full_path.rsplit('\\').next().unwrap_or(&full_path).to_string();
            Some(name)
        } else {
            None
        }
    }
}
