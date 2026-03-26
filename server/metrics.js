const client = require("prom-client");

const register = new client.Registry();

register.setDefaultLabels({
  service: "tea_stall_server"
});

client.collectDefaultMetrics({ register });

const applicationInfo = new client.Gauge({
  name: "tea_application_info",
  help: "Static application metadata exposed as a value of 1.",
  labelNames: ["app_version"],
  registers: [register]
});

const httpRequestsTotal = new client.Counter({
  name: "tea_http_requests_total",
  help: "Total number of HTTP requests handled by the application.",
  labelNames: ["method", "route", "status_code", "app_version"],
  registers: [register]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "tea_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds.",
  labelNames: ["method", "route", "status_code", "app_version"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register]
});

const httpErrorsTotal = new client.Counter({
  name: "tea_http_errors_total",
  help: "Total number of HTTP responses with 5xx status codes.",
  labelNames: ["method", "route", "status_code", "app_version"],
  registers: [register]
});

const ordersCreatedTotal = new client.Counter({
  name: "tea_orders_created_total",
  help: "Total number of orders created.",
  labelNames: ["app_version"],
  registers: [register]
});

const orderItemsTotal = new client.Counter({
  name: "tea_order_items_total",
  help: "Total number of order line items created.",
  labelNames: ["app_version"],
  registers: [register]
});

const orderValueRupeesTotal = new client.Counter({
  name: "tea_order_value_rupees_total",
  help: "Total rupee value of created orders.",
  labelNames: ["app_version"],
  registers: [register]
});

const paymentChecksTotal = new client.Counter({
  name: "tea_payment_checks_total",
  help: "Total number of payment status checks.",
  labelNames: ["app_version"],
  registers: [register]
});

const paymentsApprovedTotal = new client.Counter({
  name: "tea_payments_approved_total",
  help: "Total number of approved payments.",
  labelNames: ["app_version"],
  registers: [register]
});

const orderValidationFailuresTotal = new client.Counter({
  name: "tea_order_validation_failures_total",
  help: "Total number of rejected order requests due to validation errors.",
  labelNames: ["app_version"],
  registers: [register]
});

const unpaidOrders = new client.Gauge({
  name: "tea_unpaid_orders",
  help: "Current number of unpaid orders.",
  labelNames: ["app_version"],
  registers: [register]
});

function normalizeRoute(req) {
  if (req.route && typeof req.route.path === "string") {
    return req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
  }

  if (typeof req.path === "string" && req.path.length > 0) {
    return req.path;
  }

  if (typeof req.originalUrl === "string" && req.originalUrl.length > 0) {
    return req.originalUrl.split("?")[0];
  }

  return "unknown";
}

function startHttpRequestTimer(req, appVersion) {
  const start = process.hrtime.bigint();

  return (res) => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const labels = {
      method: req.method,
      route: normalizeRoute(req),
      status_code: String(res.statusCode),
      app_version: appVersion
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);

    if (res.statusCode >= 500) {
      httpErrorsTotal.inc(labels);
    }
  };
}

function setApplicationInfo(appVersion) {
  applicationInfo.set({ app_version: appVersion }, 1);
}

function recordOrderCreated(appVersion, itemCount, totalAmount) {
  ordersCreatedTotal.inc({ app_version: appVersion });
  orderItemsTotal.inc({ app_version: appVersion }, itemCount);
  orderValueRupeesTotal.inc({ app_version: appVersion }, totalAmount);
}

function recordPaymentCheck(appVersion) {
  paymentChecksTotal.inc({ app_version: appVersion });
}

function recordPaymentApproval(appVersion) {
  paymentsApprovedTotal.inc({ app_version: appVersion });
}

function recordOrderValidationFailure(appVersion) {
  orderValidationFailuresTotal.inc({ app_version: appVersion });
}

function setUnpaidOrders(appVersion, count) {
  unpaidOrders.set({ app_version: appVersion }, count);
}

module.exports = {
  register,
  setApplicationInfo,
  setUnpaidOrders,
  startHttpRequestTimer,
  recordOrderCreated,
  recordPaymentCheck,
  recordPaymentApproval,
  recordOrderValidationFailure
};
