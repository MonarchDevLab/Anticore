//! ISP profilleri: Türkiye sağlayıcıları için başlangıç strateji preset'leri.
//!
//! ÖNEMLİ: Bu preset'ler topluluk bulgularına dayalı BAŞLANGIÇ noktasıdır.
//! Faz 3'teki otomatik test motoru, canlı ölçümle her ISP için optimum
//! kombinasyonu öğrenip profil üzerine yazacaktır.

use crate::strategy::Step;
use crate::tls::SplitMode;

#[derive(Debug, Clone)]
pub struct IspProfile {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub steps: Vec<Step>,
}

/// Türkiye'deki yaygın sağlayıcılar için hazır profiller.
pub fn builtin_profiles() -> Vec<IspProfile> {
    vec![
        IspProfile {
            id: "turk_telekom",
            name: "Türk Telekom",
            description: "TTL sahtesi + bayt bazlı sabit parçalama + pencere dışı dizi sahtesi.",
            steps: vec![
                Step::FakePacketBefore { ttl: 4 },
                Step::FragmentTls { mode: SplitMode::Fixed(1) },
                Step::FakeWrongSeq,
            ],
        },
        IspProfile {
            id: "superonline",
            name: "Superonline",
            description: "Agresif SNI denetimi; sahte paket + ters sıralı parçalama + hatalı checksum (pasif RST drop note).",
            steps: vec![
                Step::FakePacketBefore { ttl: 3 },
                Step::FragmentTls { mode: SplitMode::SniMidReverse },
                Step::FakeWrongChecksum,
            ],
        },
        IspProfile {
            id: "turknet",
            name: "TurkNet",
            description: "Hafif denetim; SNI orta parçalama + düşük TTL sahte paket.",
            steps: vec![
                Step::FakePacketBefore { ttl: 4 },
                Step::FragmentTls { mode: SplitMode::SniMid },
            ],
        },
        IspProfile {
            id: "vodafone",
            name: "Vodafone",
            description: "Sahte paket + bayt bazlı sabit parçalama.",
            steps: vec![
                Step::FakePacketBefore { ttl: 5 },
                Step::FragmentTls { mode: SplitMode::Fixed(2) },
            ],
        },
        IspProfile {
            id: "turkcell",
            name: "Turkcell",
            description: "SNI orta parçalama + sahte paket + büyük/küçük harf karışımı.",
            steps: vec![
                Step::FakePacketBefore { ttl: 3 },
                Step::FragmentTls { mode: SplitMode::SniMid },
                Step::HostCase,
            ],
        },
        IspProfile {
            id: "kablonet",
            name: "Kablonet (Türksat)",
            description: "DNS zehirlemesi ve SNI filtreleme; sahte paket (TTL=4) + SNI parçalama.",
            steps: vec![
                Step::FakePacketBefore { ttl: 4 },
                Step::FragmentTls { mode: SplitMode::SniMid },
            ],
        },
        IspProfile {
            id: "universal",
            name: "Evrensel",
            description: "Düşük TTL sahte paket + SNI parçalama (tüm sağlayıcılar ve Discord/Roblox için kanıtlanmış kombinasyon).",
            steps: vec![
                Step::FakePacketBefore { ttl: 4 },
                Step::FragmentTls { mode: SplitMode::SniMid },
            ],
        },
    ]
}

/// ID'ye göre profil bulur.
pub fn find_profile(id: &str) -> Option<IspProfile> {
    builtin_profiles().into_iter().find(|p| p.id == id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn all_profiles_have_at_least_one_step() {
        for p in builtin_profiles() {
            assert!(!p.steps.is_empty(), "{} profili boş olamaz", p.id);
        }
    }

    #[test]
    fn find_profile_resolves_all_builtin_ids() {
        for p in builtin_profiles() {
            assert!(find_profile(p.id).is_some());
        }
        assert!(find_profile("yok_ole_bir_sey").is_none());
    }

    #[test]
    fn fake_steps_use_sane_ttl_range() {
        for p in builtin_profiles() {
            for s in &p.steps {
                if let Step::FakePacketBefore { ttl } = s {
                    assert!((2..=16).contains(ttl), "{}: TTL {} aralık dışı", p.id, ttl);
                }
            }
        }
    }
}
