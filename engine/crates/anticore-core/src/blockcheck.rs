use crate::profile::IspProfile;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ScanDepth {
    /// Hızlı tarama (1.5 saniye zaman aşımı)
    Fast,
    /// Standart tarama (3.0 saniye zaman aşımı)
    #[default]
    Standard,
    /// Derin / Tam tarama (5.0 saniye zaman aşımı)
    Full,
}

impl ScanDepth {
    pub fn timeout_ms(&self) -> u64 {
        match self {
            ScanDepth::Fast => 1500,
            ScanDepth::Standard => 3000,
            ScanDepth::Full => 5000,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BlockcheckResult {
    pub profile_id: String,
    pub success: bool,
    pub latency_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockcheckProgress {
    pub current: usize,
    pub total: usize,
    pub profile_name: String,
    pub result: Option<BlockcheckResult>,
}

/// Standart derinlikle blockcheck çalıştırır (geriye dönük uyumluluk).
pub async fn run_blockcheck(
    target: &str,
    profiles: &[IspProfile],
    tx: mpsc::Sender<BlockcheckProgress>,
) -> Vec<BlockcheckResult> {
    run_blockcheck_with_depth(target, profiles, ScanDepth::Standard, tx).await
}

/// Belirtilen tarama derinliğiyle hedefe yönelik strateji sınaması yürütür.
pub async fn run_blockcheck_with_depth(
    target: &str,
    profiles: &[IspProfile],
    depth: ScanDepth,
    tx: mpsc::Sender<BlockcheckProgress>,
) -> Vec<BlockcheckResult> {
    let mut results = Vec::new();
    let total = profiles.len();
    let timeout_ms = depth.timeout_ms();

    for (i, profile) in profiles.iter().enumerate() {
        let _ = tx
            .send(BlockcheckProgress {
                current: i + 1,
                total,
                profile_name: profile.name.to_string(),
                result: None,
            })
            .await;

        let steps = profile.steps.clone();
        let host = target.to_string();
        let probe_res = tokio::task::spawn_blocking(move || {
            crate::tester::probe_with_steps(&host, 443, &steps, timeout_ms)
        })
        .await
        .unwrap_or(crate::tester::ProbeResult::Filtered);

        let (success, latency) = match probe_res {
            crate::tester::ProbeResult::Open { latency_ms } => (true, Some(latency_ms as u64)),
            crate::tester::ProbeResult::Blocked { latency_ms } => (false, Some(latency_ms as u64)),
            crate::tester::ProbeResult::Filtered | crate::tester::ProbeResult::Unreachable(_) => {
                (false, None)
            }
        };

        let result = BlockcheckResult {
            profile_id: profile.id.to_string(),
            success,
            latency_ms: latency,
        };

        results.push(result.clone());

        let _ = tx
            .send(BlockcheckProgress {
                current: i + 1,
                total,
                profile_name: profile.name.to_string(),
                result: Some(result),
            })
            .await;
    }

    results
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::profile::builtin_profiles;

    #[test]
    fn blockcheck_runs_and_reports_progress_for_all_profiles() {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("tokio runtime");
        rt.block_on(async {
            let profiles = builtin_profiles();
            let (tx, mut rx) = mpsc::channel(32);

            let target = "127.0.0.1"; // kapalı port/localhost
            let results = run_blockcheck_with_depth(target, &profiles, ScanDepth::Fast, tx).await;

            assert_eq!(results.len(), profiles.len());

            let mut progress_count = 0;
            while let Ok(_) = rx.try_recv() {
                progress_count += 1;
            }
            // Her profil için 2 bildirim (başlangıç + sonuç)
            assert_eq!(progress_count, profiles.len() * 2);
        });
    }
}
