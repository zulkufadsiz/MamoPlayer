#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(MamoAdsModule, RCTEventEmitter)

RCT_EXTERN_METHOD(loadAds:(NSString *)adTagUrl)
RCT_EXTERN_METHOD(startAds)
RCT_EXTERN_METHOD(stopAds)
RCT_EXTERN_METHOD(releaseAds)

@end
