import React, { useState } from "react";
import {
  Image,
  Pressable,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { Button } from "./Button";
import { useScheme } from "./Colors";
import { Text } from "./Text";
import { applyPolyfills, restoreOriginalGlobals } from "./polyfill";

const isIOS = Platform.OS === "ios";
const PLATFORM_LOCALHOST = isIOS ? "localhost" : "10.0.2.2";

const BASE_URL = `http://${PLATFORM_LOCALHOST}:3000/api`;

type RequestStatus = "idle" | "loading" | "success" | "error";

type NetworkTestScreenProps = {
  onBack?: () => void;
};

export function NetworkTestScreen({ onBack }: NetworkTestScreenProps) {
  const style = useStyle();
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [response, setResponse] = useState<string>("");
  const [polyfillsEnabled, setPolyfillsEnabled] = useState(false);

  const togglePolyfills = async () => {
    if (polyfillsEnabled) {
      restoreOriginalGlobals();
      setPolyfillsEnabled(false);
    } else {
      await applyPolyfills();
      setPolyfillsEnabled(true);
    }
  };

  const handleResponse = (data: any, method: string) => {
    setResponse(`${method} Response:\n${JSON.stringify(data, null, 2)}`);
    setStatus("success");
  };

  const handleError = (error: any, method: string) => {
    setResponse(`${method} Error:\n${error.message || String(error)}`);
    setStatus("error");
  };

  // 1. GET Request
  const makeGetRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/get?page=1&sort=asc`);
      const data = await res.json();
      handleResponse(data, "GET");
    } catch (error) {
      handleError(error, "GET");
    }
  };

  // 2. POST Request
  const makePostRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "secret123",
        }),
      });
      const data = await res.json();
      handleResponse(data, "POST");
    } catch (error) {
      handleError(error, "POST");
    }
  };

  // 3. PATCH Request
  const makePatchRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/patch/1`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });
      const data =
        res.status === 204 ? { message: "No Content" } : await res.json();
      handleResponse(data, "PATCH");
    } catch (error) {
      handleError(error, "PATCH");
    }
  };

  // 4. PUT Request
  const makePutRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/put/2`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Full Replacement",
          email: "replacement@example.com",
        }),
      });
      const data = await res.json();
      handleResponse(data, "PUT");
    } catch (error) {
      handleError(error, "PUT");
    }
  };

  // 5. DELETE Request
  const makeDeleteRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/delete/1`, {
        method: "DELETE",
      });
      const data = await res.json();
      handleResponse(data, "DELETE");
    } catch (error) {
      handleError(error, "DELETE");
    }
  };

  // 6. Multipart/Form-Data (File Upload)
  const makeMultipartRequest = async () => {
    setStatus("loading");
    try {
      const formData = new FormData();
      formData.append("multipart_data", {
        uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        type: "image/png",
        name: "profile.png",
      } as any);
      formData.append("description", "User profile picture");

      const res = await fetch(`${BASE_URL}/multipart`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      handleResponse(data, "MULTIPART");
    } catch (error) {
      handleError(error, "MULTIPART");
    }
  };

  // 7. URL-Encoded Form
  const makeFormRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "username=testuser&password=testpass123",
      });
      const data = await res.json();
      handleResponse(data, "FORM");
    } catch (error) {
      handleError(error, "FORM");
    }
  };

  // 8. Binary Data
  const makeBinaryRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/binary`);
      const arrayBuffer = await res.arrayBuffer();
      const view = new Uint8Array(arrayBuffer);
      const hexString = Array.from(view)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join(" ");
      handleResponse({ binary: hexString, size: view.length }, "BINARY");
    } catch (error) {
      handleError(error, "BINARY");
    }
  };

  // 9. Compression (GZIP)
  const makeCompressionRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/compress`);
      const data = await res.json();
      handleResponse(
        {
          items_count: data.length,
          first_item: data[0],
          message: "Compressed response received",
        },
        "COMPRESSION"
      );
    } catch (error) {
      handleError(error, "COMPRESSION");
    }
  };

  // 10. Redirect
  const makeRedirectRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/redirect`);
      const data = await res.json();
      handleResponse(data, "REDIRECT");
    } catch (error) {
      handleError(error, "REDIRECT");
    }
  };

  // 11. Delay (3s)
  const makeDelayRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/delay`);
      const data = await res.json();
      handleResponse(data, "DELAY");
    } catch (error) {
      handleError(error, "DELAY");
    }
  };

  // 12. Client Error (4xx)
  const makeClientErrorRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/error/client-error`);
      const data = await res.json();
      handleResponse({ status: res.status, ...data }, "CLIENT ERROR");
      setStatus("error");
    } catch (error) {
      handleError(error, "CLIENT ERROR");
    }
  };

  // 14. Server Error (5xx)
  const makeServerErrorRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/error/server-error`);
      const text = await res.text();
      handleResponse({ status: res.status, message: text }, "SERVER ERROR");
      setStatus("error");
    } catch (error) {
      handleError(error, "SERVER ERROR");
    }
  };

  // 15. GraphQL
  const makeGraphQLRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "query GetUserProfile { user { id name } }",
          operationName: "GetUserProfile",
          variables: { id: "1" },
        }),
      });
      const data = await res.json();
      handleResponse(data, "GRAPHQL");
    } catch (error) {
      handleError(error, "GRAPHQL");
    }
  };

  // 16. Large Body
  const makeLargeBodyRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/large-body`);
      const data = await res.json();
      handleResponse(
        {
          meta: data.meta,
          data_length: data.data?.length || 0,
          message: "Large payload received successfully",
        },
        "LARGE BODY"
      );
    } catch (error) {
      handleError(error, "LARGE BODY");
    }
  };

  // 17. Image Request
  const makeImageRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/image`);
      const arrayBuffer = await res.arrayBuffer();
      const view = new Uint8Array(arrayBuffer);
      const hexString = Array.from(view)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join(" ");
      handleResponse(
        {
          message: "Image fetched successfully",
          size: view.length,
          contentType: res.headers.get("content-type"),
        },
        "IMAGE"
      );
    } catch (error) {
      handleError(error, "IMAGE");
    }
  };

  // 18. Large Image Request
  const makeLargeImageRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/large-image`);
      const arrayBuffer = await res.arrayBuffer();
      const view = new Uint8Array(arrayBuffer);
      const hexString = Array.from(view)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join(" ");
      handleResponse(
        {
          message: "Image fetched successfully",
          size: view.length,
          contentType: res.headers.get("content-type"),
        },
        "LARGE IMAGE"
      );
    } catch (error) {
      handleError(error, "LARGE IMAGE");
    }
  };

  // 19. XHR Incremental Streaming
  const makeStreamingRequest = () => {
    setStatus("loading");
    setResponse("");
    try {
      const xhr = new XMLHttpRequest();
      let fullResponse = "";

      xhr.open("GET", `${BASE_URL}/stream-xhr`, true);

      xhr.onreadystatechange = () => {
        console.log(`ReadyState: ${xhr.readyState}`);
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            setResponse(xhr.responseText);
            setStatus("success");
          } else {
            handleError(new Error(`HTTP ${xhr.status}`), "STREAMING");
          }
        }
      };

      xhr.onprogress = (event) => {
        console.log(`Progress: loaded=${event.loaded}, total=${event.total}`);
        fullResponse = xhr.responseText;
        setResponse(fullResponse);
      };

      xhr.onloadstart = () => {
        console.log("Load started");
      };

      xhr.onload = () => {
        console.log("Load complete");
      };

      xhr.onloadend = () => {
        console.log("Load ended");
      };

      xhr.onerror = () => {
        console.log("Error occurred");
        handleError(new Error("Network error"), "STREAMING");
      };

      xhr.onabort = () => {
        console.log("Request aborted");
        handleError(new Error("Request aborted"), "STREAMING");
      };

      xhr.ontimeout = () => {
        console.log("Request timed out");
        handleError(new Error("Request timed out"), "STREAMING");
      };

      xhr.send();
    } catch (error) {
      handleError(error, "STREAMING");
    }
  };

  // 19. Malformed: Content-Length Mismatch (Truncated)
  const makeTruncatedRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/error/truncated`);
      const data = await res.text();
      handleResponse({ message: data }, "TRUNCATED");
    } catch (error) {
      handleError(error, "TRUNCATED");
    }
  };

  // 20. Malformed: Invalid JSON
  const makeInvalidJsonRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/error/json`);
      const text = await res.text();
      // Try to parse as JSON to trigger the error
      try {
        const data = JSON.parse(text);
        handleResponse(data, "INVALID JSON");
      } catch (parseError: any) {
        handleError(
          new Error(
            `JSON Parse Error: ${parseError.message}\nRaw response: ${text}`
          ),
          "INVALID JSON"
        );
      }
    } catch (error) {
      handleError(error, "INVALID JSON");
    }
  };

  // 21. Malformed: Protocol Violation
  const makeProtocolViolationRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${BASE_URL}/error/protocol`);
      const data = await res.text();
      handleResponse(
        { message: data, status: res.status },
        "PROTOCOL VIOLATION"
      );
    } catch (error) {
      handleError(error, "PROTOCOL VIOLATION");
    }
  };

  // 22. Malformed: Hang (with timeout)
  const makeHangRequest = async () => {
    setStatus("loading");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const res = await fetch(`${BASE_URL}/error/hang`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.text();
      handleResponse({ message: data }, "HANG");
    } catch (error: any) {
      if (error.name === "AbortError") {
        handleError(new Error("Request timed out after 5 seconds"), "HANG");
      } else {
        handleError(error, "HANG");
      }
    }
  };

  // Streaming Requests (Polyfill Mode)
  // 23. Stream Complete - Read entire stream
  const makeStreamCompleteRequest = async () => {
    setStatus("loading");
    setResponse("");
    try {
      const res = await fetch(`${BASE_URL}/large-body`, {
        // @ts-ignore
        reactNative: { textStreaming: true },
      });

      const stream = res.body;
      if (!stream) {
        handleError(
          new Error("No readable stream available"),
          "STREAM COMPLETE"
        );
        return;
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        console.log(chunkCount);
        setResponse(
          `Streaming... Chunks received: ${chunkCount}\nBytes: ${result.length}`
        );
      }

      handleResponse(
        {
          message: "Stream completed successfully",
          totalChunks: chunkCount,
          totalBytes: result.length,
        },
        "STREAM COMPLETE"
      );
    } catch (error) {
      handleError(error, "STREAM COMPLETE");
    }
  };

  // 24. Stream Cancel - Stop reading in the middle
  const makeStreamCancelRequest = async () => {
    setStatus("loading");
    setResponse("");
    try {
      const res = await fetch(`${BASE_URL}/large-body`, {
        // @ts-ignore
        reactNative: { textStreaming: true },
      });

      const stream = res.body;
      if (!stream) {
        handleError(new Error("No readable stream available"), "STREAM CANCEL");
        return;
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let chunkCount = 0;
      const maxChunks = 3; // Cancel after 3 chunks

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        setResponse(
          `Streaming... Chunks received: ${chunkCount}\nBytes: ${result.length}`
        );

        if (chunkCount >= maxChunks) {
          await reader.cancel("Intentionally cancelled after 3 chunks");
          break;
        }
      }

      handleResponse(
        {
          message: `Stream cancelled after ${chunkCount} chunks`,
          totalChunks: chunkCount,
          totalBytes: result.length,
        },
        "STREAM CANCEL"
      );
    } catch (error) {
      handleError(error, "STREAM CANCEL");
    }
  };

  // Helper to create streaming versions of existing requests
  const makeStreamingFetch = async (
    endpoint: string,
    options: any,
    label: string
  ) => {
    setStatus("loading");
    setResponse("");
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        // @ts-ignore
        reactNative: { textStreaming: true },
      });

      const stream = res.body;
      if (!stream) {
        // Fallback to regular response if no stream
        const text = await res.text();
        handleResponse({ message: text }, `${label} (STREAM)`);
        return;
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
      }

      try {
        const data = JSON.parse(result);
        handleResponse(
          { ...data, _streamChunks: chunkCount },
          `${label} (STREAM)`
        );
      } catch {
        handleResponse(
          { message: result, _streamChunks: chunkCount },
          `${label} (STREAM)`
        );
      }
    } catch (error) {
      handleError(error, `${label} (STREAM)`);
    }
  };

  // GitHub Zen Request
  const makeGithubZenRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch("https://api.github.com/zen");
      const text = await res.text();
      handleResponse({ zen: text }, "GITHUB_ZEN");
    } catch (error) {
      handleError(error, "GITHUB_ZEN");
    }
  };

  return (
    <SafeAreaView style={style.container}>
      <Logo />
      <Text style={style.title}>Network Requests</Text>

      <View style={style.polyfillContainer}>
        <Pressable
          style={[
            style.polyfillButton,
            polyfillsEnabled && style.polyfillButtonActive,
          ]}
          onPress={togglePolyfills}
        >
          <Text
            style={[
              style.polyfillButtonText,
              polyfillsEnabled && style.polyfillButtonTextActive,
            ]}
          >
            {polyfillsEnabled ? "✓ Polyfills ON" : "Polyfills OFF"}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={style.scrollView} showsVerticalScrollIndicator={false}>
        <View style={style.buttonGrid}>
          {/* Good Requests */}
          <RequestButton title="GET" onPress={makeGetRequest} />
          <RequestButton title="POST" onPress={makePostRequest} />
          <RequestButton title="PATCH" onPress={makePatchRequest} />
          <RequestButton title="PUT" onPress={makePutRequest} />
          <RequestButton title="DELETE" onPress={makeDeleteRequest} />
          <RequestButton title="Multipart" onPress={makeMultipartRequest} />
          <RequestButton title="URL-Encoded Form" onPress={makeFormRequest} />
          <RequestButton title="Binary" onPress={makeBinaryRequest} />
          <RequestButton title="Compress" onPress={makeCompressionRequest} />
          <RequestButton title="Redirect" onPress={makeRedirectRequest} />
          <RequestButton title="Delay (3s)" onPress={makeDelayRequest} />
          <RequestButton title="Large Body" onPress={makeLargeBodyRequest} />
          <RequestButton title="Image" onPress={makeImageRequest} />
          <RequestButton title="Large Image" onPress={makeLargeImageRequest} />
          <RequestButton title="Stream (XHR)" onPress={makeStreamingRequest} />
          <RequestButton title="GitHub Zen" onPress={makeGithubZenRequest} />

          {/* Error Requests */}
          <RequestButton
            title="Client Error"
            onPress={makeClientErrorRequest}
            variant="error"
          />
          <RequestButton
            title="Server Error"
            onPress={makeServerErrorRequest}
            variant="error"
          />
          <RequestButton
            title="Truncated"
            onPress={makeTruncatedRequest}
            variant="error"
          />
          <RequestButton
            title="Invalid JSON"
            onPress={makeInvalidJsonRequest}
            variant="error"
          />
          <RequestButton
            title="Protocol Err"
            onPress={makeProtocolViolationRequest}
            variant="error"
          />
          <RequestButton
            title="Hang (5s)"
            onPress={makeHangRequest}
            variant="error"
          />

          {/* Streaming Requests (Only with Polyfills) */}
          {polyfillsEnabled && (
            <>
              <View style={style.sectionDivider} />
              <Text style={style.sectionTitle}>
                Streaming Requests (Polyfill Mode)
              </Text>
              <RequestButton
                title="Stream Complete"
                onPress={makeStreamCompleteRequest}
                variant="streaming"
              />
              <RequestButton
                title="Stream Cancel"
                onPress={makeStreamCancelRequest}
                variant="streaming"
              />
              <RequestButton
                title="GET (Stream)"
                onPress={() =>
                  makeStreamingFetch("/get?page=1&sort=asc", {}, "GET")
                }
                variant="streaming"
              />
              <RequestButton
                title="POST (Stream)"
                onPress={() =>
                  makeStreamingFetch(
                    "/post",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: "Test User",
                        email: "test@example.com",
                      }),
                    },
                    "POST"
                  )
                }
                variant="streaming"
              />
              <RequestButton
                title="Compress (Stream)"
                onPress={() => makeStreamingFetch("/compress", {}, "COMPRESS")}
                variant="streaming"
              />
              <RequestButton
                title="Large Body (Stream)"
                onPress={() =>
                  makeStreamingFetch("/large-body", {}, "LARGE BODY")
                }
                variant="streaming"
              />
            </>
          )}
        </View>

        {status === "loading" && (
          <View style={style.loadingContainer}>
            <ActivityIndicator size="large" color="#57B495" />
          </View>
        )}

        {response && (
          <View style={style.responseContainer}>
            <Text style={style.responseTitle}>Response:</Text>
            <Text
              style={[
                style.responseText,
                status === "error" && style.errorText,
              ]}
            >
              {response}
            </Text>
            <Button
              title="Clear"
              onPress={() => {
                setResponse("");
                setStatus("idle");
              }}
            />
          </View>
        )}
      </ScrollView>
      <View style={style.bottomContainer}>
        <Button title="← Back" onPress={() => onBack?.()} />
      </View>
    </SafeAreaView>
  );
}

function useStyle() {
  const { colors } = useScheme();
  const componentGap = 8;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: componentGap * 2,
    },
    title: {
      fontSize: 24,
      fontWeight: "600",
      marginHorizontal: componentGap * 2,
      marginBottom: componentGap * 2,
    },
    polyfillContainer: {
      marginHorizontal: componentGap * 2,
      marginBottom: componentGap * 2,
    },
    polyfillButton: {
      paddingHorizontal: componentGap * 2,
      paddingVertical: componentGap,
      backgroundColor: colors.darkerBackground,
      borderColor: colors.text,
      borderWidth: 1,
      borderRadius: 4,
      alignItems: "center",
    },
    polyfillButtonActive: {
      backgroundColor: "#E8F5E9",
      borderColor: "#4CAF50",
    },
    polyfillButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "500",
    },
    polyfillButtonTextActive: {
      color: "#2E7D32",
    },
    polyfillMessage: {
      marginTop: componentGap,
      padding: componentGap,
      backgroundColor: "#FFF3E0",
      borderColor: "#FFB74D",
      borderWidth: 1,
      borderRadius: 4,
      fontSize: 12,
      color: "#E65100",
      textAlign: "center",
    },
    buttonGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: componentGap * 2,
      justifyContent: "space-between",
      marginBottom: componentGap * 4,
    },
    sectionDivider: {
      width: "100%",
      height: 1,
      backgroundColor: colors.text,
      opacity: 0.2,
      marginVertical: componentGap * 2,
    },
    sectionTitle: {
      width: "100%",
      fontSize: 16,
      fontWeight: "600",
      color: "#2E7D32",
      marginBottom: componentGap,
    },
    loadingContainer: {
      padding: componentGap * 4,
      alignItems: "center",
      justifyContent: "center",
    },
    responseContainer: {
      backgroundColor: colors.darkerBackground,
      borderRadius: 8,
      padding: componentGap * 2,
      marginBottom: componentGap * 4,
      borderWidth: 1,
      borderColor: colors.text,
    },
    responseTitle: {
      fontWeight: "600",
      marginBottom: componentGap,
      fontSize: 16,
    },
    responseText: {
      fontFamily: "monospace",
      fontSize: 11,
      marginBottom: componentGap * 2,
      color: colors.text,
    },
    errorText: {
      color: "#FF6B6B",
    },
    bottomContainer: {
      padding: componentGap * 2,
      paddingBottom: componentGap * 3,
      borderTopWidth: 1,
      borderTopColor: colors.darkerBackground,
    },
  });
}

type RequestButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "default" | "error" | "streaming";
};

function RequestButton({
  title,
  onPress,
  variant = "default",
}: RequestButtonProps) {
  const style = useRequestButtonStyle(variant);

  return (
    <Pressable style={style.button} onPress={onPress}>
      <Text style={style.text}>{title}</Text>
    </Pressable>
  );
}

function useRequestButtonStyle(variant: "default" | "error" | "streaming") {
  const { colors } = useScheme();
  const componentGap = 8;

  const backgroundColor =
    variant === "error"
      ? "#FFE5E5"
      : variant === "streaming"
      ? "#E8F5E9"
      : colors.darkerBackground;
  const borderColor =
    variant === "error"
      ? "#FFB3B3"
      : variant === "streaming"
      ? "#4CAF50"
      : colors.text;
  const textColor =
    variant === "error"
      ? "#CC0000"
      : variant === "streaming"
      ? "#2E7D32"
      : colors.text;

  return StyleSheet.create({
    button: {
      width: "48%",
      paddingHorizontal: componentGap * 2,
      paddingVertical: componentGap,
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      borderWidth: 1,
    },
    text: {
      color: textColor,
    },
  });
}

function Logo() {
  const style = useLogoStyle();
  return (
    <View style={style.container}>
      <Image source={require("./assets/radon.png")} style={style.image} />
    </View>
  );
}

function useLogoStyle() {
  const componentGap = 8;
  return StyleSheet.create({
    container: {
      marginHorizontal: componentGap * 3,
      marginTop: componentGap * 2,
      marginBottom: componentGap * 2,
    },
    image: {
      width: "100%",
      height: 120,
      resizeMode: "contain",
    },
  });
}
