import AVFoundation
import AVKit
import React
import UIKit

/// Native module that bridges AirPlay (iOS) casting into the React Native layer.
///
/// Responsibilities:
///  - `showCastPicker()` — presents the system AVRoutePickerView AirPlay sheet.
///  - `getCastState(_:reject:)` — resolves with the current AirPlay route state.
///  - Emits `mamo_cast_state_changed` whenever the audio route changes so the JS
///    layer can keep its `CastState` in sync without polling.
@objc(MamoCastModule)
final class MamoCastModule: RCTEventEmitter {

  private var hasListeners = false

  override init() {
    super.init()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(routeDidChange(_:)),
      name: AVAudioSession.routeChangeNotification,
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  @objc override static func requiresMainQueueSetup() -> Bool { true }

  override func supportedEvents() -> [String]! {
    ["mamo_cast_state_changed"]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  // MARK: - React Methods

  /// Present the system AirPlay device picker.
  @objc func showCastPicker() {
    DispatchQueue.main.async {
      guard let window = self.keyWindow() else { return }

      let routePicker = AVRoutePickerView(frame: .zero)
      // AVRoutePickerView is self-contained; we add it briefly to the window,
      // trigger its internal UIButton, then remove it.
      routePicker.isHidden = true
      window.addSubview(routePicker)

      if let button = routePicker.subviews.compactMap({ $0 as? UIButton }).first {
        button.sendActions(for: .touchUpInside)
      }

      // Allow the sheet to present before removing the helper view.
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
        routePicker.removeFromSuperview()
      }
    }
  }

  /// Resolve with the current AirPlay route state.
  @objc func getCastState(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject _: RCTPromiseRejectBlock
  ) {
    resolve(currentCastState())
  }

  // MARK: - Private

  private func currentCastState() -> String {
    let outputs = AVAudioSession.sharedInstance().currentRoute.outputs
    let isAirPlay = outputs.contains { $0.portType == .airPlay }
    return isAirPlay ? "connected" : "idle"
  }

  @objc private func routeDidChange(_: Notification) {
    guard hasListeners else { return }
    sendEvent(withName: "mamo_cast_state_changed", body: ["state": currentCastState()])
  }

  private func keyWindow() -> UIWindow? {
    if #available(iOS 15, *) {
      return UIApplication.shared.connectedScenes
        .compactMap { $0 as? UIWindowScene }
        .flatMap { $0.windows }
        .first { $0.isKeyWindow }
    }
    return UIApplication.shared.keyWindow
  }
}
