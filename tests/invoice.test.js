// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

beforeEach(async () => {
  let resultCompany = await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES ('testcompany', 'Test Company', 'Company for tests')
      `);

  let resultInvoice = await db.query(`
        INSERT INTO invoices (comp_code, id, amt, paid, paid_date, add_date)
        VALUES ('testcompany', 7, 777, false, null,  '2023-10-14T22:00:00.000Z')
      `);

  testCompany = resultCompany.rows[0];
  testInvoice = resultInvoice.rows[0];
});

describe("GET /invoices", () => {
  test("Gets a list of all invoices", async () => {
    const res = await request(app).get("/invoices");
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("invoices");
    expect(res.body.invoices.length).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /invoices/:id", () => {
  test("Gets a single invoice by ID", async () => {
    const res = await request(app).get("/invoices/7");
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("invoice");
    const invoice = res.body.invoice;
    expect(invoice.id).toBe(7);
    expect(invoice.company.name).toBe("Test Company");
    expect(invoice.amt).toBe(777);
    expect(invoice.paid).toBe(false);
    expect(invoice.add_date).toBe("2023-10-13T22:00:00.000Z");
    expect(invoice.paid_date).toBeNull();
  });

  test("Responds with 404 if invoice ID not found", async () => {
    const res = await request(app).get("/invoices/999");
    expect(res.status).toEqual(404);
  });
});

describe("POST /invoices", () => {
  test("Add new invoice", async () => {
    const data = {
      comp_code: "testcompany",
      amt: 9999,
    };
    const res = await request(app).post("/invoices").send(data);
    expect(res.status).toEqual(201);
    expect(res.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "testcompany",
        amt: 9999,
        paid: false,
        add_date: "2023-10-14T22:00:00.000Z",
        paid_date: null,
      },
    });
  });
});

// remove all from companies db
afterEach(async function () {
  await db.query(`
      DELETE FROM companies
      `);
  await db.query(`
      DELETE FROM invoices
      `);
});

// close db connection
afterAll(async function () {
  // close db connection
  await db.end();
});
