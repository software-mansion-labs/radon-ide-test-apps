import { Image, Text, View } from "react-native";
import { gql } from "@apollo/client";
import { useQuery as useApolloQuery } from "@apollo/client/react";
import { useLocalSearchParams } from "expo-router";

const GET_LAUNCH = gql`
  query Launch($launchId: ID!) {
    launch(id: $launchId) {
      mission_name
      details
      links {
        flickr_images
      }
    }
  }
`;

function LaunchDetails({ launchId }: { launchId: string }) {
  const { loading, error, data } = useApolloQuery(GET_LAUNCH, {
    variables: { launchId },
  });

  if (loading) return <Text>Loading details...</Text>;
  if (error) return <Text>Error loading details: {error.message}</Text>;

  const launch = data.launch;
  const images = launch.links.flickr_images;
  const name = launch.mission_name;
  const details = launch.details;
  const url = images && images.length > 0 ? images[0] : null;

  return (
    <>
      <Text>{name}</Text>
      <Text>{details}</Text>
      {url && (
        <Image source={{ uri: url }} style={{ width: 300, height: 500 }} />
      )}
    </>
  );
}

export default function DetailsScreen() {
  const { id: launchId } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <LaunchDetails launchId={launchId as string} />;
    </View>
  );
}
