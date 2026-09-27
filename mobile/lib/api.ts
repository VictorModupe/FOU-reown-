//C:\Users\USER\Downloads\reown-app\reown\mobile\lib\api.ts
import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import { useEffect } from "react";
import { getGuestCartSessionId } from "@/lib/guestCart";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const loggedRequests = new WeakSet<object>();

api.interceptors.response.use(
  (response) => {
    const config = response.config as typeof response.config & { __startedAt?: number };
    const durationMs = config.__startedAt ? Date.now() - config.__startedAt : undefined;
    console.log("[api:success]", {
      method: config.method?.toUpperCase(),
      url: config.url,
      status: response.status,
      durationMs,
      ...(config.url?.replace(/\?.*$/, "").endsWith("/cart")
        ? { cartItemCount: response.data?.cart?.items?.length ?? null }
        : {}),
    });
    return response;
  },
  (error) => {
    const config = error.config as (typeof error.config & { __startedAt?: number }) | undefined;
    console.warn("[api:error]", {
      method: config?.method?.toUpperCase(),
      url: config?.url,
      status: error.response?.status,
      message: error.message,
      durationMs: config?.__startedAt ? Date.now() - config.__startedAt : undefined,
    });
    return Promise.reject(error);
  }
);

export const useApi = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      const token = await getToken();
      const guestCartSessionId = await getGuestCartSessionId();

      config.headers = config.headers || {};
      config.headers["x-guest-session-id"] = guestCartSessionId;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (!loggedRequests.has(config)) {
        const trackedConfig = config as typeof config & { __startedAt?: number };
        trackedConfig.__startedAt = Date.now();
        loggedRequests.add(config);
        console.log("[api:start]", {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
      }

      return config;
    });

    // cleanup: remove interceptor when component unmounts

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [getToken]);

  return api;
};

// on every single req, we would like have an auth token so that our backend knows that we're authenticated
// we're including the auth token under the auth headers
