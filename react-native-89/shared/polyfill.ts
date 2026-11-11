const originalFetch = {
  fetch: globalThis.fetch,
  Headers: globalThis.Headers,
  Request: globalThis.Request,
  Response: globalThis.Response,
};

const orignalReadableStream = {
  ReadableStream: globalThis.ReadableStream,
};

const originalEncoding = {
  TextEncoder: globalThis.TextEncoder,
};

export const restoreOriginalGlobals = () => {
  globalThis.fetch = originalFetch.fetch;
  globalThis.Headers = originalFetch.Headers;
  globalThis.Request = originalFetch.Request;
  globalThis.Response = originalFetch.Response;

  globalThis.ReadableStream = orignalReadableStream.ReadableStream;

  globalThis.TextEncoder = originalEncoding.TextEncoder;
};

export const applyPolyfills = async () => {
  try {
    const { ReadableStream: ReadableStreamPolyfill } = await import(
      //@ts-ignore
      "web-streams-polyfill/dist/ponyfill"
    );
    const { polyfill: polyfillEncoding } = await import(
      //@ts-ignore
      "react-native-polyfill-globals/src/encoding"
    );
    const { polyfill: polyfillFetch } = await import(
      //@ts-ignore
      "react-native-polyfill-globals/src/fetch"
    );

    polyfillFetch();
    globalThis.ReadableStream = ReadableStreamPolyfill;
    polyfillEncoding();
  } catch (error) {
    console.log(
      "Could not load polyfills, check if react-native-polyfill-globals is installed."
    );
  }
};
