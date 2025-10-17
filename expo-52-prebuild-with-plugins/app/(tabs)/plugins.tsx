import { useScheme } from "@/shared/Colors";
import { Button, TextInput, View } from "react-native";

import devToolsEnhancer from "redux-devtools-expo-dev-plugin";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { useSelector, useDispatch, Provider } from "react-redux";

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

const store = configureStore({
  reducer: rootReducer,
  // Comment two lines below and reload to test our first-party redux support otherwise you're testing expo dev plugins
  devTools: false,
  enhancers: (getDefaultEnhancers) =>
    getDefaultEnhancers().concat(devToolsEnhancer()),
});

function ReduxCounter() {
  const count = useSelector((state: { count: number }) => state.count);
  const dispatch = useDispatch();

  const increment = () => {
    dispatch({ type: "INCREMENT" });
  };

  return <Button onPress={increment} title={`Redux counter: ${count}`} />;
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

  return <Button onPress={increment} title={`React Query counter: ${count}`} />;
};

export default function TabTwoScreen() {
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
        </View>
      </Provider>
    </QueryClientProvider>
  );
}
