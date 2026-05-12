import { Text, View } from "react-native";
import { gql } from "@apollo/client";
import { useQuery as useApolloQuery } from "@apollo/client/react";
import { useLocalSearchParams } from "expo-router";

const GET_POST = gql`
  query Post($id: ID!) {
    post(id: $id) {
      id
      title
      body
    }
  }
`;

function PostDetails({ id }: { id: string }) {
  const { loading, error, data } = useApolloQuery(GET_POST, {
    variables: { id },
  });

  if (loading) return <Text>Loading details...</Text>;
  if (error) return <Text>Error loading details: {error.message}</Text>;

  const post = data.post;

  return (
    <>
      <Text>{post.title}</Text>
      <Text>{post.body}</Text>
    </>
  );
}

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <PostDetails id={id as string} />;
    </View>
  );
}
