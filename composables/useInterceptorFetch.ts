let ERRORS_COUNT = 0;

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
      async onResponseError({ request, response, options }) {
        ERRORS_COUNT++;
        if (response?.status === 401) {
          await auth.refresh();
          ERRORS_COUNT = 0;
        } else {
          console.error("Response error:", response?.status);
        }
      },
    });

    return response;
  } catch (error) {
    try {
      // Try the request again
      if (ERRORS_COUNT > 1) {
        throw new Error("Failed to refresh token");
      } else {
        return await useInterceptorFetch<T>(url, options);
      }
    } catch (error) {
      console.log("Url:", url);
      console.error("Fetch error:", error);
      throw error;
    }
  }
};
