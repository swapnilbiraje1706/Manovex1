export default async (request, context) => {
  const response = await context.next();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const html = await response.text();

  const injected = html.replaceAll(
    "/__SUPABASE_URL__/",
    Deno.env.get("SUPABASE_URL") ?? ""
  ).replaceAll(
    "/__SUPABASE_KEY__/",
    Deno.env.get("SUPABASE_PUB_KEY") ?? ""
  ).replaceAll(
    "/__RAZORPAY_KEY_ID__/",
    Deno.env.get("RAZORPAY_KEY_ID") ?? ""
  );

  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
};

export const config = { path: "/*" };
