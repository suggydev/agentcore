const YooKassa = require('yookassa');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

let checkout = null;

function getCheckout() {
  if (!checkout) {
    if (!config.YOOKASSA_SHOP_ID || !config.YOOKASSA_SECRET_KEY) {
      throw new Error('YooKassa is not configured. Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY.');
    }
    checkout = new YooKassa({
      shopId: config.YOOKASSA_SHOP_ID,
      secretKey: config.YOOKASSA_SECRET_KEY,
      timeout: 120000,
    });
  }
  return checkout;
}

async function createPayment({
  amount,
  currency = 'RUB',
  description,
  orderId,
  returnUrl,
  customerEmail,
  receipt,
  capture = true,
}) {
  const idempotenceKey = uuidv4();
  const client = getCheckout();

  const payload = {
    amount: { value: amount.toFixed(2), currency },
    capture,
    confirmation: { type: 'redirect', return_url: returnUrl || config.CLIENT_URL || 'http://localhost:3000' },
    description: description || `Order #${orderId}`,
    metadata: { orderId: String(orderId) },
  };

  if (customerEmail || receipt) {
    payload.receipt = {
      customer: { email: customerEmail },
      items: receipt?.items || [
        {
          description: description || `Order #${orderId}`,
          quantity: '1',
          amount: { value: amount.toFixed(2), currency },
          vat_code: '1',
        },
      ],
    };
  }

  return client.createPayment(payload, idempotenceKey);
}

async function getPayment(paymentId) {
  const idempotenceKey = uuidv4();
  const client = getCheckout();
  return client.getPayment(paymentId, idempotenceKey);
}

async function capturePayment(paymentId, amount) {
  const idempotenceKey = uuidv4();
  const client = getCheckout();

  const payload = {};
  if (amount !== undefined) {
    payload.value = amount.toFixed(2);
    payload.currency = 'RUB';
  }

  return client.capturePayment(paymentId, Object.keys(payload).length > 0 ? payload : undefined, idempotenceKey);
}

async function cancelPayment(paymentId) {
  const idempotenceKey = uuidv4();
  const client = getCheckout();
  return client.cancelPayment(paymentId, idempotenceKey);
}

async function createRefund({ paymentId, amount, currency = 'RUB', description }) {
  const idempotenceKey = uuidv4();
  const client = getCheckout();

  const amountPayload = { value: amount.toFixed(2), currency };
  if (description) {
    amountPayload.description = description;
  }

  const refund = await client.createRefund(paymentId, amountPayload, idempotenceKey);
  return refund;
}

async function getRefund(refundId) {
  const idempotenceKey = uuidv4();
  const client = getCheckout();
  return client.getRefund(refundId, idempotenceKey);
}

module.exports = {
  createPayment,
  getPayment,
  capturePayment,
  cancelPayment,
  createRefund,
  getRefund,
};
