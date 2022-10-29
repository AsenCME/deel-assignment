import { IncomingMessage, ServerResponse } from "http";

export const callApi = async (
  endpoint: string,
  method = "GET",
  body?: object | undefined
) => {
  // requests made when the client interacts can't connect to the docker network
  // so we use localhost instead of the docker bridge
  const host =
    typeof window === "undefined"
      ? "http://server:3001"
      : "http://localhost:3001";
  return await fetch(`${host}/${endpoint}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json", profile_id: "1" },
  });
};

export const request = async (
  endpoint: string,
  res: ServerResponse<IncomingMessage>,
  method = "GET",
  body?: object | undefined,
  transformer?: (data: any) => any
) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=10, stale-while-revalidate=59"
  );
  const response = await callApi(endpoint, method, body);

  let responseData = null,
    error = null;
  try {
    responseData = await response.json();
  } catch (err) {
    error = err;
  }

  const data = transformer ? transformer(responseData) : responseData;
  if (error) {
    console.log(error);
    return { redirect: { destination: "/error", permanent: false } };
  }
  return { props: { data } };
};
