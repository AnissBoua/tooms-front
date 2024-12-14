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
        if (response?.status === 401) {
          await auth.refresh();
        } else {
          console.error("Response error:", response?.status);
        }
      },
    });

    return response;
  } catch (error) {
    try {
      // Try the request again
      return await useInterceptorFetch<T>(url, options);
    } catch (error) {
      console.log("Url:", url);
      console.error("Fetch error:", error);
      throw error;
    }
  }
};
