import { useScheme } from "@/shared/Colors";
import { FlatList, Text, View } from "react-native";

import devToolsEnhancer, {
  composeWithDevTools,
} from "redux-devtools-expo-dev-plugin";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { createStore } from "redux";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { useSelector, useDispatch, Provider } from "react-redux";
import TrackableButton from "@/shared/TrackableButton";
import { gql } from "@apollo/client";
import { useQuery as useApolloQuery } from "@apollo/client/react";
import { useRouter } from "expo-router";

const queryClient = new QueryClient();

const initialState = {
  count: 0,
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    case "DECREMENT":
      return { ...state, count: state.count - 1 };
    default:
      return state;
  }
};

const storeWithDevtoolsEnhancer = configureStore({
  reducer: rootReducer,
  // Comment two lines below and reload to test our first-party redux support otherwise you're testing expo dev plugins
  devTools: false,
  enhancers: (getDefaultEnhancers) =>
    getDefaultEnhancers().concat(devToolsEnhancer()),
});

const storeWithComposeWithDevTools = createStore(
  rootReducer,
  composeWithDevTools()
);

const USE_DEVTOOLS_ENHANCER = true;

const store = USE_DEVTOOLS_ENHANCER
  ? storeWithDevtoolsEnhancer
  : storeWithComposeWithDevTools;

function ReduxCounter() {
  const count = useSelector((state: { count: number }) => state.count);
  const dispatch = useDispatch();

  const increment = () => {
    dispatch({ type: "INCREMENT" });
  };

  return (
    <TrackableButton
      onPress={increment}
      id="ReduxCounter"
      title={`Redux counter: ${count}`}
    />
  );
}

const fetchCounter = async () => {
  return 0; // Initial counter value
};

const ReactQueryCounter = () => {
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ["counter"],
    queryFn: fetchCounter,
  });

  const increment = () => {
    queryClient.setQueryData(["counter"], (oldCount: number) => oldCount + 1);
  };

  return (
    <TrackableButton
      onPress={increment}
      id="ReactQueryCounter"
      title={`React Query counter: ${count}`}
    />
  );
};

const GET_LAUNCHES = gql`
  query LaunchesQuery {
    launchesPast {
      id
      mission_name
    }
  }
`;

function ApolloList() {
  const { errors, loading, data } = useApolloQuery(GET_LAUNCHES);

  const router = useRouter();

  function renderLaunchItem({
    item: { mission_name, id },
    index,
  }: {
    item: {
      mission_name: string;
      id: string;
    };
    index: number;
  }) {
    return (
      <TrackableButton
        key={id}
        title={`🛰 ${mission_name}`}
        onPress={() => {
          router.push(`/plugins/details?id=${id}`);
        }}
        id={`launchItem@${index}`}
      />
    );
  }

  return (
    <>
      <Text style={{ fontSize: 18, margin: 10 }}>
        Apollo Client: SpaceX Launches
      </Text>
      {errors ? (
        <Text>"Error!"</Text>
      ) : loading ? (
        <Text>"Loading..."</Text>
      ) : (
        <FlatList
          style={{ maxHeight: 200 }}
          renderItem={renderLaunchItem}
          data={data.launchesPast}
        />
      )}
    </>
  );
}

export default function PluginsScreen() {
  const { colors } = useScheme();

  useReactQueryDevTools(queryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <View
          style={{
            backgroundColor: colors.background,
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ReduxCounter />
          <ReactQueryCounter />
          <ApolloList />
        </View>
      </Provider>
    </QueryClientProvider>
  );
}
