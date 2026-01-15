import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: "https://main--spacex-l4uc6p.apollographos.net/graphql",
  }),
  cache: new InMemoryCache(),
});
