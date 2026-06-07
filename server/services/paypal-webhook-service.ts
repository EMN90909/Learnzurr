import { paypalApi } from "./paypal-api";
import { paypalDb } from "./paypal-db";
import { checkoutService } from "./checkout-service";
import { paymentCaptureService } from "./payment-capture-service";
import { refundService } from "./refund-service";
import { billingPlanService } from "./billing-plan-service";
import { subscriptionService } from "./subscription-service";
import { disputeService } from "./dispute-service";
import { config } from "../config";

function getHeader(headers: Record<string, string>, key: string) {
  const direct = headers[key];
  if (direct) return direct;
  const foundKey = Object.keys(headers).find((headerKey) => headerKey.toLowerCase() === key.toLowerCase());
  return foundKey ? headers[foundKey] : undefined;
}

const getVerificationPayload = (headers: Record<string, string>, event: Record<string, unknown>) => ({
  auth_algo: getHeader(headers, "paypal-auth-algo"),
  cert_url: getHeader(headers, "paypal-cert-url"),
  transmission_id: getHeader(headers, "paypal-transmission-id"),
  transmission_sig: getHeader(headers, "paypal-transmission-sig"),
  transmission_time: getHeader(headers, "paypal-transmission-time"),
  webhook_id: config.paypalWebhookId,
  webhook_event: event,
});

const isDuplicateProcessed = (status?: string | null) =>
  status === "processed" || status === "processing";

function requireEventId(event: Record<string, any>) {
  if (!event.id) throw new Error("PayPal webhook event id is missing.");
  return event.id;
}

function requireResourceId(event: Record<string, any>) {
  const resourceId = event.resource?.id;
  if (!resourceId) throw new Error(`PayPal webhook resource id is missing for ${event.event_type}.`);
  return resourceId;
}

export const paypalWebhookService = {
  async verify(headers: Record<string, string>, event: Record<string, unknown>) {
    const payload = getVerificationPayload(headers, event);
    if (
      !payload.auth_algo ||
      !payload.cert_url ||
      !payload.transmission_id ||
      !payload.transmission_sig ||
      !payload.transmission_time ||
      !payload.webhook_id
    ) {
      throw new Error("Missing required PayPal webhook verification headers.");
    }

    const verification = await paypalApi.verifyWebhookSignature(payload);
    if (verification?.verification_status !== "SUCCESS") {
      throw new Error("Unverified PayPal webhook");
    }
  },

  async accept(headers: Record<string, string>, event: Record<string, any>) {
    await this.verify(headers, event);
    const eventId = requireEventId(event);
    const transmissionId = getHeader(headers, "paypal-transmission-id") || "";
    const recorded = await paypalDb.recordWebhookEvent(event, transmissionId);

    if (recorded?.duplicate && isDuplicateProcessed(recorded?.status)) {
      return { duplicate: true, event_id: eventId };
    }

    await this.process(event);
    return { duplicate: false, event_id: eventId };
  },

  async process(event: Record<string, any>) {
    const eventId = requireEventId(event);

    try {
      await paypalDb.markWebhookProcessed(eventId, "processing");

      switch (event.event_type) {
        case "CHECKOUT.ORDER.APPROVED": {
          const orderId = requireResourceId(event);
          const captureResponse = await paypalApi.captureOrder(orderId);
          await checkoutService.handleOrderApproved(event, captureResponse);
          break;
        }

        case "CHECKOUT.PAYMENT-APPROVAL.REVERSED": {
          break;
        }

        case "PAYMENT.CAPTURE.PENDING":
        case "PAYMENT.CAPTURE.COMPLETED":
        case "PAYMENT.CAPTURE.DENIED":
        case "PAYMENT.CAPTURE.REVERSED": {
          await paymentCaptureService.handle(event);
          break;
        }

        case "PAYMENT.CAPTURE.REFUNDED": {
          await paymentCaptureService.handle(event);
          await refundService.handleWebhook(event);
          break;
        }

        case "BILLING.PLAN.CREATED":
        case "BILLING.PLAN.UPDATED":
        case "BILLING.PLAN.ACTIVATED":
        case "BILLING.PLAN.PRICING-CHANGE.ACTIVATED":
        case "BILLING.PLAN.DEACTIVATED": {
          await billingPlanService.handle(event);
          break;
        }

        case "BILLING.SUBSCRIPTION.CREATED":
        case "BILLING.SUBSCRIPTION.ACTIVATED":
        case "BILLING.SUBSCRIPTION.UPDATED":
        case "BILLING.SUBSCRIPTION.EXPIRED":
        case "BILLING.SUBSCRIPTION.CANCELLED":
        case "BILLING.SUBSCRIPTION.SUSPENDED":
        case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
          await subscriptionService.handle(event);
          break;
        }

        case "CUSTOMER.DISPUTE.CREATED":
        case "CUSTOMER.DISPUTE.UPDATED":
        case "CUSTOMER.DISPUTE.RESOLVED": {
          await disputeService.handle(event);
          break;
        }

        default: {
          break;
        }
      }

      await paypalDb.markWebhookProcessed(eventId, "processed");
    } catch (error: any) {
      await paypalDb.markWebhookProcessed(eventId, "failed", error?.message || "Unknown webhook error");
      console.error("[PayPal Webhook Error]", error);
      throw error;
    }
  },
};
