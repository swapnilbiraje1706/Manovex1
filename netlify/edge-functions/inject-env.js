export default async (request, context) => {
  const response = await context.next();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const html = await response.text();
  const getEnv = (name) => {
    const fromNetlify = globalThis.Netlify?.env?.get?.(name);
    if (fromNetlify) return fromNetlify;
    const fromDeno = globalThis.Deno?.env?.get?.(name);
    return fromDeno || "";
  };

  const injected = html.replaceAll(
    "/__SUPABASE_URL__/",
    getEnv("SUPABASE_URL") || "/__SUPABASE_URL__/"
  ).replaceAll(
    "/__SUPABASE_KEY__/",
    getEnv("SUPABASE_PUB_KEY") || "/__SUPABASE_KEY__/"
  ).replaceAll(
    "/__RAZORPAY_KEY_ID__/",
    getEnv("RAZORPAY_KEY_ID") || "/__RAZORPAY_KEY_ID__/"
  );

  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
};

export const config = { path: "/*" };
