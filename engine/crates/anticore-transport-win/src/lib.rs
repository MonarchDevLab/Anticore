//! Windows transport: WinDivert 2.x dinamik bağlama.
//!
//! DLL runtime'da yüklenir (LoadLibrary) -> sürüm kilitlenmesi ve build-time
//! import lib gereksinimi olmaz. WinDivert.dll + WinDivert.sys uygulama
//! dizininde bulunur (resmi dağıtımdan; driver Microsoft imzalidir).
//!
//! Akis: NETWORK katmaninda outbound TCP filtresiyle paket yakalanir ->
//! core stratejisi uygulanir -> segmentler inject edilir -> orijinal DROP.

#[cfg(windows)]
pub mod divert;

#[cfg(windows)]
pub use divert::*;

#[cfg(not(windows))]
pub mod stub {
    use anticore_core::transport::{PacketTransport, TransportMeta, TransportVerdict};

    pub struct WinDivert;

    impl WinDivert {
        pub fn open_default() -> Result<Self, String> {
            Err("WinDivert yalnızca Windows üzerinde desteklenir".into())
        }
    }

    impl PacketTransport for WinDivert {
        fn recv(&self, _buf: &mut [u8]) -> Option<(usize, TransportMeta)> {
            None
        }
        fn send(&self, _buf: &[u8], _meta: &TransportMeta) -> Result<(), String> {
            Err("WinDivert non-windows üzerinde desteklenmez".into())
        }
        fn set_verdict(&self, _id: u64, _verdict: TransportVerdict) -> Result<(), String> {
            Err("WinDivert non-windows üzerinde desteklenmez".into())
        }
        fn close(&self) {}
    }
}

#[cfg(not(windows))]
pub use stub::*;

