const request = require("supertest");
const app = require("./server");

test("GET /api/health returns correct message", async () => {
  const res = await request(app).get("/api/health");
  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe("OK");
});
