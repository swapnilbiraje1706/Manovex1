const crypto = require("crypto");

const PLAN_CODE = "pro_yearly";
const PLAN_PRICE_USD = 11;
const PLAN_DURATION_DAYS = 365;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}

function safeString(value) {
  return String(value || "").trim();
}

function getHeader(event, name) {
  const headers = event.headers || {};
  const lower = name.toLowerCase();
  return headers[name] || headers[lower] || "";
}

function signaturesMatch(expected, received) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { message: text };
  }
}

async function fetchRazorpayPayment(keyId, keySecret, paymentId) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(body?.error?.description || body?.message || "Unable to fetch Razorpay payment.");
  }
  return body;
}

async function getSupabaseUser(supabaseUrl, publicKey, authHeader) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: publicKey,
      Authorization: authHeader
    }
  });
  const body = await readJsonResponse(response);
  if (!response.ok || !body?.id) {
    throw new Error(body?.msg || body?.message || "You must be signed in to verify a payment.");
  }
  return body;
}

async function supabaseRest(supabaseUrl, serviceRoleKey, method, path, body) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Supabase subscription update failed.");
  }
  return data;
}

async function saveSubscription(supabaseUrl, serviceRoleKey, userId, payment, orderId, paymentId, payload) {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const select = "id,status,current_period_end,charged_currency,charged_amount_minor";
  const row = {
    user_id: userId,
    plan_code: safeString(payload.planCode) || PLAN_CODE,
    status: "active",
    started_at: now.toISOString(),
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    amount_usd: PLAN_PRICE_USD,
    charged_amount_minor: Number(payment.amount || payload.amount || 0),
    charged_currency: safeString(payment.currency || payload.currency || "USD").toUpperCase(),
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    metadata: {
      method: payment.method || "",
      international: Boolean(payment.international),
      email: payment.email || "",
      source: safeString(payload.source || "checkout")
    }
  };

  const userFilter = encodeURIComponent(userId);
  const updatedRows = await supabaseRest(
    supabaseUrl,
    serviceRoleKey,
    "PATCH",
    `/rest/v1/subscriptions?user_id=eq.${userFilter}&select=${select}`,
    row
  );

  if (Array.isArray(updatedRows) && updatedRows.length) {
    return updatedRows[0];
  }

  const insertedRows = await supabaseRest(
    supabaseUrl,
    serviceRoleKey,
    "POST",
    `/rest/v1/subscriptions?select=${select}`,
    row
  );

  if (Array.isArray(insertedRows) && insertedRows.length) {
    return insertedRows[0];
  }

  throw new Error("Payment verified, but no subscription row was returned.");
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePublicKey = process.env.SUPABASE_PUB_KEY || process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!keyId || !keySecret) {
    return json(500, { error: "Razorpay environment variables are not configured." });
  }
  if (!supabaseUrl || !supabasePublicKey || !supabaseServiceRoleKey) {
    return json(500, { error: "Supabase environment variables are not configured." });
  }

  const authHeader = getHeader(event, "authorization");
  if (!authHeader) {
    return json(401, { error: "Please sign in again before verifying payment." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (_error) {
    return json(400, { error: "Invalid JSON request body." });
  }

  const orderId = safeString(payload.razorpay_order_id || payload.razorpayOrderId || payload.order_id || payload.orderId);
  const paymentId = safeString(payload.razorpay_payment_id || payload.razorpayPaymentId || payload.payment_id);
  const signature = safeString(payload.razorpay_signature || payload.razorpaySignature);

  if (!orderId || !paymentId || !signature) {
    return json(400, { error: "Missing Razorpay payment verification fields." });
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (!signaturesMatch(generatedSignature, signature)) {
    return json(400, { error: "Payment signature verification failed." });
  }

  try {
    const user = await getSupabaseUser(supabaseUrl, supabasePublicKey, authHeader);
    const payment = await fetchRazorpayPayment(keyId, keySecret, paymentId);

    if (payment.order_id !== orderId) {
      return json(400, { error: "Payment does not belong to this Razorpay order." });
    }

    if (!["authorized", "captured"].includes(String(payment.status))) {
      return json(400, { error: "Payment is not in a successful state." });
    }

    const subscription = await saveSubscription(
      supabaseUrl,
      supabaseServiceRoleKey,
      user.id,
      payment,
      orderId,
      paymentId,
      payload
    );

    return json(200, {
      success: true,
      verified: true,
      order_id: orderId,
      payment_id: paymentId,
      subscription
    });
  } catch (error) {
    return json(500, {
      error: error?.message || "Payment verified, but subscription activation failed."
    });
  }
};
