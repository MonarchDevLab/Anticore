use anticore_core::transport::{PacketTransport, TransportMeta, TransportVerdict};

struct MockTransport {
    dropped: std::sync::atomic::AtomicBool,
}

impl PacketTransport for MockTransport {
    fn recv(&self, _buf: &mut [u8]) -> Option<(usize, TransportMeta)> {
        None
    }

    fn send(&self, _raw: &[u8], _meta: &TransportMeta) -> Result<(), String> {
        Ok(())
    }

    fn set_verdict(&self, _id: u64, verdict: TransportVerdict) -> Result<(), String> {
        if matches!(verdict, TransportVerdict::Drop) {
            self.dropped.store(true, std::sync::atomic::Ordering::SeqCst);
        }
        Ok(())
    }

    fn close(&self) {}
}

#[test]
fn test_mock_transport_verdict() {
    let t = MockTransport {
        dropped: std::sync::atomic::AtomicBool::new(false),
    };
    assert!(t.set_verdict(1, TransportVerdict::Drop).is_ok());
    assert!(t.dropped.load(std::sync::atomic::Ordering::SeqCst));
}
