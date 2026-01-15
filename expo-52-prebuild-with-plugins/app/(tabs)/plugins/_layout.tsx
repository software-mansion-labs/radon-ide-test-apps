import { ApolloProvider } from "@apollo/client/react";
import { Stack } from "expo-router";
import { apolloClient } from "@/shared/plugins/apolloClient";

export default function Layout() {
  return (
    <ApolloProvider client={apolloClient}>
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="details"
          options={{
            presentation: "modal",
            headerTitle: "Launch Details",
          }}
        />
      </Stack>
    </ApolloProvider>
  );
}
