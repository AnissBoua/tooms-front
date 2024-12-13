export const useInterceptorFetch = async <T = object>( url: string, options?: Record<string, any>): Promise<T> => {
  const auth = useAuthStore();
  const config = useRuntimeConfig();

  try {
    const response = await $fetch<T>(config.public.API_URL + url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${auth.token}`,
      },
      // Optional hooks for logging or debugging
      onRequest({ request, options }) {
        // console.log("Request:", request, options);
      },
      onRequestError({ request, options, error }) {
        // console.error("Request error:", error);
      },
      onResponse({ request, response, options }) {
        // console.log("Response:", response);
      },
      onResponseError({ request, response, options }) {
        if (response?.status === 401) {
          console.error("Unauthorized: refreshing token...");
          auth.refresh();
        } else {
          console.error("Response error:", response?.status);
        }
      },
    });

    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
