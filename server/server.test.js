const request = require("supertest");
const app = require("./server");

test("GET /hello returns correct message", async () => {
  const res = await request(app).get("/hello");
  expect(res.statusCode).toBe(200);
  expect(res.text).toBe("Hello from Server");
});
