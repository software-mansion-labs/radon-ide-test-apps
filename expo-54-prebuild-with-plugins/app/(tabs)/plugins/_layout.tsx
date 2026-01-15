import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { Stack } from "expo-router";

const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: "https://main--spacex-l4uc6p.apollographos.net/graphql",
  }),
  cache: new InMemoryCache(),
});

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
