#[cfg(windows)]
#[test]
fn test_windivert_implements_packet_transport() {
    use anticore_core::transport::PacketTransport;
    use anticore_transport_win::WinDivert;

    fn assert_is_transport<T: PacketTransport>() {}
    assert_is_transport::<WinDivert>();
}
