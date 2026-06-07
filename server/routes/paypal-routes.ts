import { Router } from "express";
import { paypalApi } from "../services/paypal-api";
import { supabaseAdmin } from "../supabase-admin";
import { activityLogService } from "../services/activity-log-service";
import { notificationService } from "../services/notification-service";

export const paypalRoutes = Router();

const getRequestAppUrl = (req: any) => {
  const host = req.headers.host || "struta.onrender.com";
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${protocol}://${host}`;
};

paypalRoutes.post("/orders", async (req, res) => {
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
      returnUrl,
      cancelUrl,
    } = req.body || {};

    if (!amount || !currency || !description) {
      return res.status(400).json({ error: "Missing order payload." });
    }

    const dynamicAppUrl = getRequestAppUrl(req);

    const order = await paypalApi.createOrder({
      intent: "CAPTURE",
      purchase_units: [
        {
          description,
          amount: {
            currency_code: currency,
            value: String(amount),
          },
        },
      ],
      application_context: {
        user_action: "PAY_NOW",
        return_url: returnUrl || `${dynamicAppUrl}/auth/callback`,
        cancel_url: cancelUrl || `${dynamicAppUrl}/family/billing`,
      },
    });

    const orderId = order?.id;

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
          payment_provider: "paypal",
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
        provider: "paypal",
        amount: Number(amount),
        payment_method: "paypal",
        amount_expected: Number(amount),
        amount_submitted: Number(amount),
        currency,
        status: "pending",
        reference: orderId,
        paypal_order_id: orderId,
        payment_gateway_reference: orderId,
        submitted_at: new Date().toISOString(),
        metadata: {
          description,
          plan_name: planName || null,
          plan_period: planPeriod || "monthly",
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
      action: "paypal.order.created",
      details: { order_id: orderId, request_id: requestId || null },
    });

    res.json(order);
  } catch (error: any) {
    console.error("[PayPal Route Error] Failed to create order:", error);
    res.status(500).json({ error: error.message || "Failed to create PayPal order." });
  }
});

paypalRoutes.post("/refunds", async (req, res) => {
  try {
    const { paymentId, amount, currency, reason, actorUserId } = req.body || {};
    if (!paymentId) {
      return res.status(400).json({ error: "Missing paymentId." });
    }

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (error || !payment?.paypal_capture_id) {
      return res.status(404).json({ error: "Original captured payment not found." });
    }

    const refund = await paypalApi.refundCapture(payment.paypal_capture_id, {
      note_to_payer: reason || "Refund issued by Struta",
      amount: amount && currency
        ? {
            value: String(amount),
            currency_code: currency,
          }
        : undefined,
    });

    await supabaseAdmin.from("refunds").upsert(
      {
        payment_id: payment.id,
        paypal_capture_id: payment.paypal_capture_id,
        paypal_refund_id: refund?.id,
        status: refund?.status?.toLowerCase() || "pending",
        amount: Number(refund?.amount?.value || amount || payment.amount),
        currency: refund?.amount?.currency_code || currency || payment.currency,
        reason: reason || null,
        requested_by: actorUserId || null,
        raw_refund: refund,
      },
      { onConflict: "paypal_refund_id" }
    );

    await notificationService.create({
      user_id: payment.user_id,
      type: "payment.refund_requested",
      title: "Refund started",
      body: `A refund has been started for payment ${payment.reference || payment.id}.`,
      entity_type: "refund",
      entity_id: payment.id,
      deep_link: "/family/requests",
      idempotency_key: `refund:${refund?.id}:${payment.user_id}`,
    });

    res.json(refund);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create refund." });
  }
});