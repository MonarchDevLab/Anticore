# Anticore: Measured Network Quality Implementation Plan

Date: 2026-09-07. Owner: Monolith Works. Distribution: MonarchDevLab.
Record update: 2026-09-08 17:15. Setup corrections: `511a0bb`; lifecycle follow-up: `ef32270`. EXE, NSIS, MSI and portable regenerated; GUI copies and ZIP payload SHA256 match. Fourteen frontend and nine backend tests pass; forty-eight engine tests are from the preceding run. Previous authorized live detached/SCM start-stop passed with test service removed and DNS unchanged; it does not cover the new stop IPC path. Native UI end-to-end acceptance and field throughput measurements remain open.

## Goal and scope

Deliver fast, understandable Windows 10/11 x64 access with measured results and reversible network behavior. Zero slowdown across every ISP cannot be guaranteed: driver overhead, congestion, protocol fallback and filtering differ. A successful rewrite is not proof of successful access.

## Architecture decision

Keep the existing Rust core, WinDivert transport and Tauri/React interface. Share capture policy between CLI and desktop. Keep ordinary bulk traffic on the native network path. Preserve existing themes; remove unsupported telemetry claims before adding visual features.

Alternatives: wrapping another engine offers more strategies but adds distribution and lifecycle complexity; a cross-platform rewrite adds platform-specific transport work without proving a Windows improvement. Revisit only when reproducible failures establish a need.

Reference lessons: GoodbyeDPI's selective processing and SplitWire-Turkey's accessible orchestration. No third-party source is copied. References checked on 2026-09-07:
- https://github.com/ValdikSS/GoodbyeDPI
- https://github.com/cagritaskn/SplitWire-Turkey
- https://reqrypt.org/windivert-doc.html
- https://github.com/basil00/WinDivert/blob/master/include/windivert.h

## P0 implementation in this change

- [x] Safe lifecycle: `desktop/src-tauri/src/commands.rs` must not reset system-wide HTTP connections or flush DNS during ordinary start/stop. `service.rs` serializes lifecycle calls, releases failed workers and drains captured packets before closing handles. `divert.rs` uses the documented DROP value 0x0002 and receive shutdown API. Preserve explicit network repair actions.
- [x] Selective capture: introduce `dispatch::capture_filter(&[Step]) -> String`, consumed by desktop and CLI. Exclude empty and oversized payloads by default; exclude TLS application data and capture ClientHello/HTTP candidates. WindowSize profiles retain the bounded compatibility path. Validate filter with the actual WinDivert helper without activating the driver; validate IPv4/IPv6, ACK, TLS handshake, application data and size boundaries.
- [x] Honest telemetry: Dashboard and quick panel show unavailable values for unmeasured access success, latency and loss. Packet counters describe packet processing only. Existing endpoint probes remain separate from transfer throughput.
- [x] Repeatable transfer evaluation: add a PowerShell harness using installed curl, explicit HTTPS download/upload endpoints, bounded duration, real byte counts and JSON output. Provide paired baseline/engine runs and comparison; incomplete/failed runs cannot pass. Do not change the user's DNS or start a system packet filter as a side effect of benchmarking.
- [x] Run existing engine and desktop Rust tests, frontend tests/type/build and review diffs. Record exact results and remaining field gates here and in TASKS.

## Acceptance and field protocol

### Running measurements

Use PowerShell from the repository root. Read the controlled endpoint interactively so example addresses are never mistaken for approved upload destinations:

```powershell
$downloadUrl = Read-Host 'Controlled HTTPS download URL'
# Stop the engine in the application before baseline; verify its status.
./scripts/measure-transfer.ps1 -Url $downloadUrl -Mode baseline -Direction download -Pair 1 -OutputPath baseline-1.json
# Start the selected profile in the application, then repeat.
./scripts/measure-transfer.ps1 -Url $downloadUrl -Mode engine -Direction download -Pair 1 -OutputPath engine-1.json
# Repeat alternating states for Pair 2 through 5, using distinct output filenames.
$reports = Get-ChildItem -Path baseline-*.json,engine-*.json | Select-Object -ExpandProperty FullName
./scripts/measure-transfer.ps1 -Reports $reports -OutputPath download-comparison.json
```

For upload use `-Direction upload -UploadFile <local-test-file>` with a controlled HTTPS endpoint supporting PUT and distinct output filenames. Upload only generated, non-sensitive data. Use a file large enough for at least 20 seconds but small enough to complete within the configured timeout (default 120 seconds). Timeouts and shorter transfers are invalid. Run warmup separately and exclude it from the five pairs. Do not mix directions or profiles in a comparison. The mode label is entered by the operator, not proof that the engine is active. Endpoint response checks, raw JSON and environmental observations are required together. The script never toggles the engine, DNS or proxy settings.

`./scripts/test-measure-transfer.ps1` validates the comparison arithmetic with synthetic fixtures; its output is not a network benchmark.

### Release gates

1. On Windows 10 and 11, use the same machine, interface, endpoint and file. Record OS, profile, commit, CPU, interface speed and test timestamps.
2. Run at least five alternating baseline/engine pairs for each direction, 20 seconds or more per sample after warmup. Use a controlled endpoint, a large incompressible file and valid TLS certificates. Avoid caching; endpoint must support the selected upload method. Keep raw JSON, errors and bytes.
3. Evaluate directions independently. Proposed release budget: median engine/baseline throughput >=0.97; p95 connection-time increase <=10 ms. These are acceptance budgets, not measured achievements. High baseline variation (>5%) makes the result inconclusive. Failed transfers invalidate approval, not the sample count.
4. Run a long download/upload while repeatedly starting/stopping the desktop engine; verify content hashes, no forced TCP resets and no residual interception handles. Repeat concurrent start/stop, startup failure, driver errors, sleep/resume, Wi-Fi change and service stop with no traffic.
5. Check targeted and untargeted HTTPS, HTTP, IPv6, QUIC on/off, VPN coexistence, Discord voice, games, streaming, fragmented ClientHello, ECH and large handshakes. Report each result, never infer whole-ISP success from a TCP connect probe.
6. Approval for public release requires the field evidence above. Local unit tests and builds do not certify ISP reachability or zero speed loss.

Compatibility boundaries: the current parser does not reassemble fragmented ClientHello messages; payloads above 2048 bytes pass untouched. WindowSize profiles keep bounded capture of control/application packets because their semantics require it, so their overhead can differ. RST suppression cannot identify forged RSTs; it is disabled for new configurations but preserved when explicitly saved. QUIC suppression remains opt-in and can change protocol performance. Forced detached-process termination remains a legacy path; graceful queue draining applies to the desktop worker and SCM service. These cases require separate field results.

## Product roadmap after P0 evidence

### P1: adaptive access and easy recovery
Rank existing profiles from repeated endpoint probes with failure reasons and measured connection times; preserve last working profile per locally stored network identity. Switching must be deliberate, bounded, reversible and must not interrupt ongoing transfers. Separate DNS, TCP, TLS and HTTP failures. Snapshot only settings the application modifies and restore exact prior values. Acceptance: failed recommendation restores the prior profile; no unexpected DNS/proxy changes.

### P2: understandable interface

2026-09-08 implementation: `251f083` delivers the new connection dashboard and navigation shell with real counters, opt-in TLS probes, state invalidation and accessible controls. Existing 5 frontend tests and Edge fixture acceptance checks passed, including keyboard focus, 390/768/1080 widths, light/dark screenshots and representative text contrast (6.9:1–10.2:1). All secondary pages and native Windows accessibility are not comprehensively redesigned/audited; field acceptance remains open.
Use the existing design system for one primary connection action, visible active profile, measured target health, accessible error recovery and optional advanced controls. Test keyboard, focus, reduced motion, contrast and narrow windows. Explicitly distinguish engine running, packet processed and site reachable. No fabricated graphs or hard-coded performance claims.

### P3: open-source release quality
Maintain truthful ownership and dependency notices, documented threat model, reproducible release instructions, signed artifacts and checksums, rollback instructions, minimal redacted diagnostics and a Windows compatibility matrix. Review update verification before release. Publish only after field gates pass; do not rewrite history or invent contributors.

## Rollback

Work on `improvement/measured-network`, based on `4b3f32a`. Revert this change to restore source behavior. Existing distribution binaries are not overwritten. Network tests must be opt-in and must retain raw measurements. Production publication is a separate action.

## Validation results

- Engine workspace: 47 existing tests passed plus 1 integration test using the actual bundled WinDivert evaluator (IPv4/IPv6, candidates, ACK, application data, inbound exclusion, 2048/2049 boundary).
- Desktop backend: 9 tests passed. Frontend: 5 tests passed; TypeScript and Vite production build passed. Sandbox initially prevented esbuild process creation; the same checks passed with approved execution outside that restriction.
- Transfer harness: 5 synthetic comparison/validation scenarios passed. An actual curl attempt to the closed local endpoint https://127.0.0.1:1 produced exit 7 and a saved invalid measurement, not a speed result.
- Clippy completed with warnings in existing core loops/signatures and desktop test assertions. New warnings in this change were corrected. This is not a warning-free repository.
- Engine and desktop release builds passed. Implementation commit: `1110001`.
- Source review confirms ordinary start/stop no longer calls system-wide TCP reset or DNS flush. Live long-transfer lifecycle, SCM stop, comprehensive native accessibility and cross-ISP tests were not run. No download/upload speed improvement, zero loss or universal reachability is asserted.
- P1/P3 remain roadmap items; P2 shell/dashboard implementation is recorded above, with remaining acceptance limits. Field evidence is required before expanding capture semantics or publishing performance claims.
