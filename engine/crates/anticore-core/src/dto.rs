//! Adım (Step) serileştirme sözlüğü — CLI (`profiles.json`) ve masaüstü
//! (Tauri IPC) TEK bu modülü kullanır. Önceden ikisi ayrı ayrı elle
//! yazılmıştı ve ayrışmıştı: CLI `fake_wrong_checksum` ile
//! `sni_mid_reverse`'i tanımıyordu, GUI'de üretilen böyle bir profil
//! servis/bağımsız modda "bilinmeyen adım/mod" hatasıyla çöküyordu.

use serde::{Deserialize, Serialize};

use crate::strategy::Step;
use crate::tls::SplitMode;

/// Adımın tel üzerindeki (JSON) karşılığı. `serde(tag = "type")` biçimi
/// hem `profiles.json` (CLI/servis) hem Tauri IPC DTO'su için ortaktır.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum StepDto {
    FragmentTls { mode: String, value: Option<u32> },
    FragmentHttp,
    FakeTtl { ttl: u8 },
    FakeWrongSeq,
    FakeWrongChecksum,
    HostCase,
    HostSpace,
    AutoTtl { base: u8, tolerance: u8 },
    MultiSplit { positions: Vec<usize> },
    FakeFromHex { hex: String },
    Oob { offset: u16, payload: u8 },
    WindowSize { size: u16 },
    HttpMethodCase,
    HttpAbsoluteUri,
    HttpLf,
}

fn parse_hex(hex: &str) -> Result<Vec<u8>, String> {
    let clean = hex.trim().strip_prefix("0x").unwrap_or(hex.trim());
    if !clean.len().is_multiple_of(2) {
        return Err(format!("geçersiz hex uzunluğu: {}", clean.len()));
    }
    let mut bytes = Vec::with_capacity(clean.len() / 2);
    for i in (0..clean.len()).step_by(2) {
        let byte = u8::from_str_radix(&clean[i..i + 2], 16)
            .map_err(|e| format!("geçersiz hex baytı '{}': {e}", &clean[i..i + 2]))?;
        bytes.push(byte);
    }
    Ok(bytes)
}

fn encode_hex(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        use std::fmt::Write;
        let _ = write!(s, "{:02x}", b);
    }
    s
}

impl StepDto {
    /// DTO'yu motorun çalıştırabileceği `Step`'e çevirir.
    pub fn to_step(&self) -> Result<Step, String> {
        Ok(match self {
            StepDto::FragmentTls { mode, value } => Step::FragmentTls {
                mode: match mode.as_str() {
                    "sni_mid" => SplitMode::SniMid,
                    "sni_mid_reverse" => SplitMode::SniMidReverse,
                    "fixed" => SplitMode::Fixed((*value).unwrap_or(1) as usize),
                    "reverse" => SplitMode::Reverse((*value).unwrap_or(1) as usize),
                    other => return Err(format!("bilinmeyen parçalama modu: {other}")),
                },
            },
            StepDto::FragmentHttp => Step::FragmentHttp,
            StepDto::FakeTtl { ttl } => Step::FakePacketBefore { ttl: *ttl },
            StepDto::FakeWrongSeq => Step::FakeWrongSeq,
            StepDto::FakeWrongChecksum => Step::FakeWrongChecksum,
            StepDto::HostCase => Step::HostCase,
            StepDto::HostSpace => Step::HostSpace,
            StepDto::AutoTtl { base, tolerance } => Step::AutoTtl {
                base: *base,
                tolerance: *tolerance,
            },
            StepDto::MultiSplit { positions } => Step::MultiSplit {
                positions: positions.clone(),
            },
            StepDto::FakeFromHex { hex } => Step::FakeFromHex {
                payload: parse_hex(hex)?,
            },
            StepDto::Oob { offset, payload } => Step::Oob { offset: *offset, payload: *payload },
            StepDto::WindowSize { size } => Step::WindowSize { size: *size },
            StepDto::HttpMethodCase => Step::HttpMethodCase,
            StepDto::HttpAbsoluteUri => Step::HttpAbsoluteUri,
            StepDto::HttpLf => Step::HttpLf,
        })
    }
}

impl From<&Step> for StepDto {
    fn from(s: &Step) -> Self {
        match s {
            Step::FragmentTls { mode } => StepDto::FragmentTls {
                mode: match mode {
                    SplitMode::SniMid => "sni_mid".into(),
                    SplitMode::SniMidReverse => "sni_mid_reverse".into(),
                    SplitMode::Fixed(_) => "fixed".into(),
                    SplitMode::Reverse(_) => "reverse".into(),
                },
                value: match mode {
                    SplitMode::Fixed(n) | SplitMode::Reverse(n) => Some(*n as u32),
                    SplitMode::SniMid | SplitMode::SniMidReverse => None,
                },
            },
            Step::FragmentHttp => StepDto::FragmentHttp,
            Step::FakePacketBefore { ttl } => StepDto::FakeTtl { ttl: *ttl },
            Step::FakeWrongSeq => StepDto::FakeWrongSeq,
            Step::FakeWrongChecksum => StepDto::FakeWrongChecksum,
            Step::HostCase => StepDto::HostCase,
            Step::HostSpace => StepDto::HostSpace,
            Step::AutoTtl { base, tolerance } => StepDto::AutoTtl {
                base: *base,
                tolerance: *tolerance,
            },
            Step::MultiSplit { positions } => StepDto::MultiSplit {
                positions: positions.clone(),
            },
            Step::FakeFromHex { payload } => StepDto::FakeFromHex {
                hex: encode_hex(payload),
            },
            Step::Oob { offset, payload } => StepDto::Oob { offset: *offset, payload: *payload },
            Step::WindowSize { size } => StepDto::WindowSize { size: *size },
            Step::HttpMethodCase => StepDto::HttpMethodCase,
            Step::HttpAbsoluteUri => StepDto::HttpAbsoluteUri,
            Step::HttpLf => StepDto::HttpLf,
        }
    }
}

/// Adım listesini toplu çevirir; ilk hatada durur.
pub fn steps_from_dto(dtos: &[StepDto]) -> Result<Vec<Step>, String> {
    dtos.iter().map(StepDto::to_step).collect()
}

/// Adım listesini toplu DTO'ya çevirir.
pub fn steps_to_dto(steps: &[Step]) -> Vec<StepDto> {
    steps.iter().map(StepDto::from).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_all_variants() {
        let steps = vec![
            Step::FragmentTls { mode: SplitMode::SniMid },
            Step::FragmentTls { mode: SplitMode::SniMidReverse },
            Step::FragmentTls { mode: SplitMode::Fixed(3) },
            Step::FragmentTls { mode: SplitMode::Reverse(2) },
            Step::FragmentHttp,
            Step::FakePacketBefore { ttl: 4 },
            Step::FakeWrongSeq,
            Step::FakeWrongChecksum,
            Step::HostCase,
            Step::HostSpace,
            Step::AutoTtl { base: 3, tolerance: 1 },
            Step::MultiSplit { positions: vec![2, 5, 20] },
            Step::FakeFromHex { payload: vec![0x16, 0x03, 0x01, 0xde, 0xad] },
            Step::Oob { offset: 10, payload: b'a' },
            Step::WindowSize { size: 1024 },
            Step::HttpMethodCase,
            Step::HttpAbsoluteUri,
            Step::HttpLf,
        ];
        let dtos = steps_to_dto(&steps);
        let back = steps_from_dto(&dtos).expect("round trip");
        assert_eq!(steps, back);
    }

    #[test]
    fn parses_sni_mid_reverse_and_fake_wrong_checksum_from_json() {
        // Önceden CLI'nin `step_from_json`'ı bu ikisini tanımıyordu.
        let json = r#"[
            {"type":"fragment_tls","mode":"sni_mid_reverse","value":null},
            {"type":"fake_wrong_checksum"},
            {"type":"auto_ttl","base":3,"tolerance":1},
            {"type":"multi_split","positions":[2,10,30]},
            {"type":"fake_from_hex","hex":"160301deadbeef"}
        ]"#;
        let dtos: Vec<StepDto> = serde_json::from_str(json).expect("valid json");
        let steps = steps_from_dto(&dtos).expect("should resolve");
        assert_eq!(steps[0], Step::FragmentTls { mode: SplitMode::SniMidReverse });
        assert_eq!(steps[1], Step::FakeWrongChecksum);
        assert_eq!(steps[2], Step::AutoTtl { base: 3, tolerance: 1 });
        assert_eq!(steps[3], Step::MultiSplit { positions: vec![2, 10, 30] });
        assert_eq!(steps[4], Step::FakeFromHex { payload: vec![0x16, 0x03, 0x01, 0xde, 0xad, 0xbe, 0xef] });
    }

    #[test]
    fn unknown_split_mode_is_rejected() {
        let dto = StepDto::FragmentTls { mode: "yok_boyle_mod".into(), value: None };
        assert!(dto.to_step().is_err());
    }

    #[test]
    fn invalid_hex_is_rejected() {
        let dto = StepDto::FakeFromHex { hex: "invalid_hex_z".into() };
        assert!(dto.to_step().is_err());
        let dto_odd = StepDto::FakeFromHex { hex: "123".into() };
        assert!(dto_odd.to_step().is_err());
    }
}
