#import "StreamBodyTestModule.h"
#import <React/RCTLog.h>

@implementation StreamBodyTestModule

RCT_EXPORT_MODULE();

// Sends a POST request whose body is an HTTPBodyStream backed by a
// CFStreamCreateBoundPair where the write end is never closed.
// The old synchronous read path in NativeDevtoolsURLProtocol would block
// forever on [stream read:] here, hanging the URL loading thread.
RCT_EXPORT_METHOD(sendHangingStreamRequest:(NSString *)url) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    CFReadStreamRef readStream = NULL;
    CFWriteStreamRef writeStream = NULL;
    CFStreamCreateBoundPair(NULL, &readStream, &writeStream, 65536);

    CFWriteStreamOpen(writeStream);
    // Write some initial bytes so the stream isn't empty, but don't close it.
    const char *payload = "{\"message\":\"hanging stream test\"}";
    CFWriteStreamWrite(writeStream, (const UInt8 *)payload, strlen(payload));
    // writeStream intentionally left open and never closed — any synchronous
    // read on the paired readStream will block once it drains the initial bytes.
    // CFRetain so it stays alive and doesn't auto-close.
    CFRetain(writeStream);

    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:url]];
    request.HTTPMethod = @"POST";
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    request.HTTPBodyStream = CFBridgingRelease(readStream);

    NSURLSession *session = [NSURLSession sharedSession];
    [[session dataTaskWithRequest:request
               completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
      if (error) {
        RCTLogInfo(@"StreamBodyTest: request error: %@", error);
      } else {
        RCTLogInfo(@"StreamBodyTest: completed, status %ld",
                   (long)[(NSHTTPURLResponse *)response statusCode]);
      }
    }] resume];
  });
}

// Sends a POST request whose body is an HTTPBodyStream backed by a
// CFStreamCreateBoundPair where the write end is closed after a 15-second delay.
// This simulates a slow/stalled upload that eventually completes.
RCT_EXPORT_METHOD(sendDelayedStreamRequest:(NSString *)url) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    CFReadStreamRef readStream = NULL;
    CFWriteStreamRef writeStream = NULL;
    CFStreamCreateBoundPair(NULL, &readStream, &writeStream, 65536);

    CFWriteStreamOpen(writeStream);
    const char *payload = "{\"message\":\"delayed stream test\"}";
    CFWriteStreamWrite(writeStream, (const UInt8 *)payload, strlen(payload));

    // Close the write end after 15 seconds so the request eventually completes.
    CFWriteStreamRef writeStreamCopy = writeStream;
    CFRetain(writeStreamCopy);
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 15 * NSEC_PER_SEC),
                   dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      CFWriteStreamClose(writeStreamCopy);
      CFRelease(writeStreamCopy);
    });

    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:url]];
    request.HTTPMethod = @"POST";
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    request.HTTPBodyStream = CFBridgingRelease(readStream);

    NSURLSession *session = [NSURLSession sharedSession];
    [[session dataTaskWithRequest:request
               completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
      if (error) {
        RCTLogInfo(@"StreamBodyTest: delayed request error: %@", error);
      } else {
        RCTLogInfo(@"StreamBodyTest: delayed request completed, status %ld",
                   (long)[(NSHTTPURLResponse *)response statusCode]);
      }
    }] resume];
  });
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

@end
