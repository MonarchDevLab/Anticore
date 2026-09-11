//! macOS transport: utun (Userspace TUN) + pfctl (Packet Filter) tabanlı
//! sürücüsüz L4/L7 DPI atlatma taşıyıcısı.
//!
//! Çekirdek uzantısı (KEXT) veya üçüncü taraf sürücü gerektirmez.

pub mod pfctl;
pub mod raw_socket;
pub mod transport;
pub mod utun;

pub use transport::UtunTransport;
