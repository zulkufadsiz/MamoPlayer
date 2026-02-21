import Foundation
import GoogleInteractiveMediaAds
import React
import UIKit

@objc(MamoAdsModule)
final class MamoAdsModule: RCTEventEmitter, IMAAdsLoaderDelegate, IMAAdsManagerDelegate {
  private var adsLoader: IMAAdsLoader?
  private var adsManager: IMAAdsManager?
  private var adDisplayContainer: IMAAdDisplayContainer?
  private weak var adContainerView: UIView?
  private var hasListeners = false

  override init() {
    super.init()
    setupAdsLoader()
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    [
      "mamo_ads_loaded",
      "mamo_ads_started",
      "mamo_ads_completed",
      "mamo_ads_error"
    ]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(loadAds:)
  func loadAds(_ adTagUrl: String) {
    DispatchQueue.main.async {
      guard let rootViewController = self.rootViewController() else {
        self.emitEvent("mamo_ads_error", body: ["message": "Root view controller not found"])
        return
      }

      if self.adsLoader == nil {
        self.setupAdsLoader()
      }

      let adContainer = self.ensureAdContainerView(in: rootViewController)
      self.adDisplayContainer = IMAAdDisplayContainer(
        adContainer: adContainer,
        viewController: rootViewController,
        companionSlots: nil
      )

      let request = IMAAdsRequest(
        adTagUrl: adTagUrl,
        adDisplayContainer: self.adDisplayContainer,
        contentPlayhead: nil,
        userContext: nil
      )

      self.adsLoader?.requestAds(with: request)
    }
  }

  @objc(startAds)
  func startAds() {
    DispatchQueue.main.async {
      self.adsManager?.start()
    }
  }

  @objc(stopAds)
  func stopAds() {
    DispatchQueue.main.async {
      self.adsManager?.pause()
    }
  }

  @objc(releaseAds)
  func releaseAds() {
    DispatchQueue.main.async {
      self.adsManager?.destroy()
      self.adsManager = nil
      self.adDisplayContainer = nil
      self.adContainerView?.removeFromSuperview()
      self.adContainerView = nil
    }
  }

  func adsLoader(_ loader: IMAAdsLoader, adsLoadedWith adsLoadedData: IMAAdsLoadedData) {
    adsManager = adsLoadedData.adsManager
    adsManager?.delegate = self

    let renderingSettings = IMAAdsRenderingSettings()
    adsManager?.initialize(with: renderingSettings)

    emitEvent("mamo_ads_loaded")
  }

  func adsLoader(_ loader: IMAAdsLoader, failedWith adErrorData: IMAAdLoadingErrorData) {
    emitEvent("mamo_ads_error", body: ["message": adErrorData.adError.message ?? "Failed to load ads"])
    // TODO: Add richer error mapping for JS consumers.
  }

  func adsManager(_ adsManager: IMAAdsManager, didReceive event: IMAAdEvent) {
    switch event.type {
    case .STARTED:
      emitEvent("mamo_ads_started")
    case .COMPLETE, .ALL_ADS_COMPLETED:
      emitEvent("mamo_ads_completed")
    default:
      break
    }
  }

  func adsManager(_ adsManager: IMAAdsManager, didReceive error: IMAAdError) {
    emitEvent("mamo_ads_error", body: ["message": error.message ?? "Ad playback error"])
    // TODO: Add retry/backoff strategy when needed.
  }

  func adsManagerDidRequestContentPause(_ adsManager: IMAAdsManager) {
    emitEvent("mamo_ads_started")
  }

  func adsManagerDidRequestContentResume(_ adsManager: IMAAdsManager) {
    emitEvent("mamo_ads_completed")
  }

  private func setupAdsLoader() {
    let settings = IMASettings()
    adsLoader = IMAAdsLoader(settings: settings)
    adsLoader?.delegate = self
  }

  private func ensureAdContainerView(in viewController: UIViewController) -> UIView {
    if let existing = adContainerView {
      return existing
    }

    let view = UIView(frame: viewController.view.bounds)
    view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.backgroundColor = .clear
    viewController.view.addSubview(view)
    adContainerView = view
    return view
  }

  private func rootViewController() -> UIViewController? {
    if #available(iOS 13.0, *) {
      return UIApplication.shared.connectedScenes
        .compactMap { $0 as? UIWindowScene }
        .flatMap { $0.windows }
        .first(where: { $0.isKeyWindow })?
        .rootViewController
    }

    return UIApplication.shared.keyWindow?.rootViewController
  }

  private func emitEvent(_ name: String, body: [String: Any]? = nil) {
    guard hasListeners else { return }
    sendEvent(withName: name, body: body)
  }
}
