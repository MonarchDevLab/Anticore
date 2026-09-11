//! macOS yerel utun + pfctl ağ taşıyıcısı.

use anticore_core::transport::{PacketTransport, TransportMeta, TransportVerdict};

#[cfg(target_os = "macos")]
use crate::pfctl::PfctlGuard;
#[cfg(target_os = "macos")]
use crate::raw_socket::RawSocket;
#[cfg(target_os = "macos")]
use crate::utun::UtunDevice;
#[cfg(target_os = "macos")]
use std::sync::Mutex;

/// macOS için utun ve pfctl tabanlı paket yakalama ve manipülasyon taşıyıcısı.
pub struct UtunTransport {
    #[cfg(target_os = "macos")]
    utun: UtunDevice,
    #[cfg(target_os = "macos")]
    raw_sock: RawSocket,
    #[cfg(target_os = "macos")]
    pfctl: Mutex<Option<PfctlGuard>>,
}

impl UtunTransport {
    #[cfg(target_os = "macos")]
    pub fn open(pasif_savunma: bool, quic_engelle: bool) -> Result<Self, String> {
        let utun = UtunDevice::open()?;
        let pfctl = PfctlGuard::setup(&utun.if_name, pasif_savunma, quic_engelle)?;
        let raw_sock = RawSocket::open()?;

        Ok(Self {
            utun,
            raw_sock,
            pfctl: Mutex::new(Some(pfctl)),
        })
    }

    #[cfg(not(target_os = "macos"))]
    pub fn open(_pasif_savunma: bool, _quic_engelle: bool) -> Result<Self, String> {
        Err("UtunTransport yalnızca macOS üzerinde desteklenir".into())
    }
}

impl PacketTransport for UtunTransport {
    fn recv(&self, buf: &mut [u8]) -> Option<(usize, TransportMeta)> {
        #[cfg(target_os = "macos")]
        {
            self.utun.recv(buf).map(|n| {
                let mut meta = TransportMeta::default();
                meta.inbound = false;
                (n, meta)
            })
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = buf;
            None
        }
    }

    fn send(&self, raw: &[u8], _meta: &TransportMeta) -> Result<(), String> {
        #[cfg(target_os = "macos")]
        {
            self.raw_sock.send(raw)
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = raw;
            let _ = _meta;
            Err("Yalnızca macOS üzerinde desteklenir".into())
        }
    }

    fn set_verdict(&self, _id: u64, _verdict: TransportVerdict) -> Result<(), String> {
        // utun arabiriminde yönlendirilen paketler kullanıcı alanında sonlanır;
        // orijinali iletmek yerine ham soket üzerinden dışarı basılır.
        Ok(())
    }

    fn close(&self) {
        #[cfg(target_os = "macos")]
        {
            if let Ok(mut lock) = self.pfctl.lock() {
                if let Some(mut guard) = lock.take() {
                    guard.cleanup();
                }
            }
        }
    }
}
