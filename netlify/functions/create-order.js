const MIN_AMOUNT = 100;
const ALLOWED_CURRENCIES = new Set([
  "INR", "USD", "EUR", "GBP", "CAD", "AUD", "SGD", "AED"
]);

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

function cleanReceipt(value) {
  const receipt = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  return receipt || `mv_${Date.now()}`;
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

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return json(500, { error: "Razorpay environment variables are not configured." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (_error) {
    return json(400, { error: "Invalid JSON request body." });
  }

  const amount = Math.round(Number(payload.amount));
  const currency = String(payload.currency || "USD").toUpperCase();
  const receipt = cleanReceipt(payload.receipt);

  if (!Number.isFinite(amount) || amount < MIN_AMOUNT) {
    return json(400, { error: "Amount must be at least 100 in the currency subunit." });
  }

  if (!ALLOWED_CURRENCIES.has(currency)) {
    return json(400, { error: "Unsupported currency for this checkout." });
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        payment_capture: 1,
        notes: {
          plan_code: String(payload.planCode || "pro_yearly").slice(0, 64),
          source: String(payload.source || "pricing").slice(0, 64)
        }
      })
    });

    const order = await readJsonResponse(response);
    if (!response.ok) {
      return json(response.status === 401 ? 401 : 500, {
        error: response.status === 401
          ? "Razorpay authentication failed."
          : (order?.error?.description || order?.message || "Unable to create Razorpay order.")
      });
    }

    return json(200, {
      order_id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      keyId,
      receipt: order.receipt
    });
  } catch (error) {
    return json(500, {
      error: error?.message || "Unable to create Razorpay order."
    });
  }
};
