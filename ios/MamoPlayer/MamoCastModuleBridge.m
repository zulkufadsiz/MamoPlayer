#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(MamoCastModule, RCTEventEmitter)

RCT_EXTERN_METHOD(showCastPicker)
RCT_EXTERN_METHOD(getCastState:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
