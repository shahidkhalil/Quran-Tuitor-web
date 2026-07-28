import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { COLLECTIONS, db, nowIso } from "@/lib/firebase/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { fulfillPaidCheckoutSession } from "@/server/services/payments";

export const runtime = "nodejs";

async function receiptUrlForSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<{ paymentIntentId: string | null; receiptUrl: string | null }> {
  const paymentIntentId: string | null =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (!paymentIntentId) {
    return { paymentIntentId: null, receiptUrl: null };
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const charge = intent.latest_charge;
    const receiptUrl =
      charge && typeof charge === "object" && "receipt_url" in charge
        ? ((charge as { receipt_url?: string | null }).receipt_url ?? null)
        : null;
    return { paymentIntentId, receiptUrl };
  } catch {
    return { paymentIntentId, receiptUrl: null };
  }
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is missing." },
      { status: 503 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe webhook] signature", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const eventRef = db().collection(COLLECTIONS.providerEvents).doc(event.id);
  const existing = await eventRef.get();
  if (existing.exists) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  let paymentId: string | null = null;

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      paymentId = session.metadata?.payment_id ?? null;

      if (paymentId && session.payment_status === "paid") {
        const { paymentIntentId, receiptUrl } = await receiptUrlForSession(
          stripe,
          session,
        );
        await fulfillPaidCheckoutSession({
          paymentId,
          sessionId: session.id,
          paymentIntentId,
          receiptUrl,
          amountTotal: session.amount_total,
        });
      }
    }

    await eventRef.create({
      id: event.id,
      provider: "stripe",
      type: event.type,
      payment_id: paymentId,
      processed_at: nowIso(),
    });
  } catch (err) {
    console.error("[stripe webhook] handler", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
