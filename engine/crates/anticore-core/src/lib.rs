//! Anticore-core: platform-bağımsız DPI bypass motoru.
//!
//! Trafik akışı: ham IPv4 paketi -> [`net`] ile ayrıştırılır -> [`tls`] ile
//! ClientHello/SNI tespit edilir -> [`strategy`] ile aksiyon planı üretilir.
//! Transport katmanı (WinDivert/pf/tun) bu planı uygular.

pub mod blockcheck;
pub mod compat;
pub mod config;
pub mod dispatch;
pub mod dto;
pub mod net;
pub mod profile;
pub mod strategy;
pub mod tester;
pub mod tls;
