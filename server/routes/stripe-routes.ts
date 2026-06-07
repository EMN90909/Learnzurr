import { Router } from "express";
import Stripe from "stripe";
import { config } from "../config";
import { supabaseAdmin } from "../supabase-admin";
import { activityLogService } from "../services/activity-log-service";
import { notificationService } from "../services/notification-service";

export const stripeRoutes = Router();

const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: "2025-01-27" as any,
});

stripeRoutes.post("/create-payment-intent", async (req, res) => {
  try {
    const {
      amount,
      currency,
      description,
      userId,
      providerId,
      providerType,
      requestId,
      invoiceId,
      subscriptionId: initialSubscriptionId,
      payerEmail,
      planName,
      planPeriod,
    } = req.body || {};

    if (!amount || !currency) {
      return res.status(400).json({ error: "Missing amount or currency." });
    }

    // Stripe expects amount in cents/smallest currency unit
    const stripeAmount = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: currency.toLowerCase(),
      description: description || `Payment for ${planName || "Struta Service"}`,
      metadata: {
        userId: userId || "",
        providerId: providerId || "",
        providerType: providerType || "",
        requestId: requestId || "",
        invoiceId: invoiceId || "",
        planName: planName || "",
        planPeriod: planPeriod || "",
      },
    });

    let subscriptionId = initialSubscriptionId || null;

    if (!subscriptionId && planName) {
      const { data: pendingSubscription } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: userId || null,
          home_id: providerType === "home" ? providerId || null : null,
          provider_id: providerType === "vendor" ? providerId || null : null,
          plan_name: planName,
          amount: Number(amount),
          currency,
          status: "pending",
          payment_provider: "stripe",
          payment_status: "pending",
          started_at: null,
          expires_at: null,
        })
        .select("id")
        .single();

      subscriptionId = pendingSubscription?.id || null;
    }

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId || null,
        provider_id: providerId || null,
        provider_type: providerType || null,
        request_id: requestId || null,
        invoice_id: invoiceId || null,
        subscription_id: subscriptionId,
        payer_email: payerEmail || null,
        provider: "stripe",
        amount: Number(amount),
        payment_method: "stripe",
        amount_expected: Number(amount),
        amount_submitted: Number(amount),
        currency,
        status: "pending",
        reference: paymentIntent.id,
        payment_gateway_reference: paymentIntent.id,
        submitted_at: new Date().toISOString(),
        metadata: {
          description,
          plan_name: planName || null,
          plan_period: planPeriod || "monthly",
          stripe_client_secret: paymentIntent.client_secret,
        },
      })
      .select("*")
      .single();

    if (invoiceId) {
      await supabaseAdmin
        .from("invoices")
        .update({
          status: "pending",
          payment_id: payment?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);
    }

    await activityLogService.record({
      user_id: userId || null,
      entity_type: "payment",
      entity_id: payment?.id || null,
      action: "stripe.intent.created",
      details: { intent_id: paymentIntent.id, request_id: requestId || null },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (error: any) {
    console.error("[Stripe Intent Error]:", error);
    res.status(500).json({ error: error.message || "Failed to create Stripe payment intent." });
  }
});

// Stripe Webhook Handler
stripeRoutes.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    // We need raw body for webhook verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig as string,
      config.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error(`[Stripe Webhook Signature Verification Failed]:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const metadata = paymentIntent.metadata;

      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("payment_gateway_reference", paymentIntent.id)
        .maybeSingle();

      if (payment) {
        await supabaseAdmin
          .from("payments")
          .update({
            status: "completed",
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        if (payment.invoice_id) {
          await supabaseAdmin
            .from("invoices")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment.invoice_id);
        }

        if (payment.subscription_id) {
          const startedAt = new Date();
          const expiresAt = new Date(startedAt);
          const period = (metadata.planPeriod || "monthly").toLowerCase();

          if (period === "yearly") {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else if (period === "lifetime") {
            expiresAt.setFullYear(expiresAt.getFullYear() + 99);
          } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }

          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "active",
              payment_status: "paid",
              started_at: startedAt.toISOString(),
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment.subscription_id);
        }

        await activityLogService.record({
          user_id: payment.user_id,
          entity_type: "payment",
          entity_id: payment.id,
          action: "stripe.payment.succeeded",
          details: { intent_id: paymentIntent.id },
        });

        if (payment.user_id) {
          await notificationService.create({
            user_id: payment.user_id,
            type: "payment.invoice_paid",
            title: "Payment received",
            body: `Your Stripe payment of ${payment.currency} ${payment.amount} was successful.`,
            entity_type: "payment",
            entity_id: payment.id,
            deep_link: payment.request_id ? "/family/requests" : "/family/billing",
            idempotency_key: `stripe-success:${paymentIntent.id}:${payment.user_id}`,
          });
        }
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook Processing Error]:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});