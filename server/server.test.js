const request = require("supertest");
const app = require("./server");

beforeEach(() => {
  app.locals.resetState();
});

test("GET /api/health returns correct message", async () => {
  const res = await request(app).get("/api/health");
  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe("OK");
});

test("GET /metrics exposes Prometheus metrics", async () => {
  const res = await request(app).get("/metrics");

  expect(res.statusCode).toBe(200);
  expect(res.headers["content-type"]).toContain("text/plain");
  expect(res.text).toContain("tea_http_requests_total");
  expect(res.text).toContain("tea_application_info");
});

test("GET /api/version exposes slot-friendly deployment metadata", async () => {
  const res = await request(app).get("/api/version");

  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({
    version: "dev",
    slot: "dev",
    displayVersion: "DEV",
    build: null
  });
});

test("POST /api/order rejects invalid quantities", async () => {
  const res = await request(app)
    .post("/api/order")
    .send({ cart: [{ itemId: 1, quantity: 0 }] });

  expect(res.statusCode).toBe(400);
  expect(res.body.error).toContain("positive quantity");
});

test("payment flow returns paid bill after admin approval", async () => {
  const orderRes = await request(app)
    .post("/api/order")
    .send({ cart: [{ itemId: 1, quantity: 2 }], customerName: "Reviewer" });

  expect(orderRes.statusCode).toBe(201);
  expect(orderRes.body.orderId).toMatch(/^ORD-/);

  const approveRes = await request(app)
    .post("/api/admin/approve-payment")
    .send({ orderId: orderRes.body.orderId });

  expect(approveRes.statusCode).toBe(200);

  const paymentStatusRes = await request(app)
    .post("/api/check-payment")
    .send({ orderId: orderRes.body.orderId });

  expect(paymentStatusRes.statusCode).toBe(200);
  expect(paymentStatusRes.body.status).toBe("Paid");
  expect(paymentStatusRes.body.bill.orderId).toBe(orderRes.body.orderId);
});
