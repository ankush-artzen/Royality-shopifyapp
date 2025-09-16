import { configureStore } from "@reduxjs/toolkit";
import currencyReducer from "./currencySlice";

export const store = configureStore({
  reducer: {
    currency: currencyReducer,
  },
});

// Types for use in components
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
