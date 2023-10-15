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
      INSERT INTO invoices (comp_code, id, amt, paid, paid_date)
      VALUES ('testcompany', 7, 777, false, null)
    `);

  testCompany = resultCompany.rows[0];
  testInvoice = resultInvoice.rows[0];
});

describe("GET /companies", () => {
  test("Gets a list of all companies", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      companies: [{ name: "Test Company", code: "testcompany" }],
    });
  });
});

describe("GET /companies/[code]", () => {
  test("Gets a single company by code", async () => {
    const res = await request(app).get("/companies/testcompany");
    expect(res.status).toEqual(200);
    expect(res.body).toEqual({
      company: {
        name: "Test Company",
        code: "testcompany",
        description: "Company for tests",
        amt: 777,
        id: 7,
        paid: false,
        paid_date: null,
      },
    });
  });
  test("Responds with 404 if can't find company", async () => {
    const res = await request(app).get("/companies/not-a-company");
    expect(res.status).toEqual(404);
  });
});

describe("POST /companies", () => {
  test("Add new company to list", async () => {
    let data = {
      name: "Album",
      description: "Surfboard Factory",
    };
    const res = await request(app).post("/companies").send(data);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({
      companies: {
        name: "Album",
        code: "album",
        description: "Surfboard Factory",
      },
    });
  });
});

describe("PUT /companies/[code]", () => {
  test("Update testcompany from list", async () => {
    let data = {
      name: "newTestCompany",
      description: "Updated testCompany",
    };

    const res = await request(app).put(`/companies/testcompany`).send(data);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({
      company: {
        name: "newTestCompany",
        code: "testcompany",
        description: "Updated testCompany",
      },
    });
  });
  test("Responds with 404 if can't find company", async () => {
    const res = await request(app).put("/companies/not-existing-company");
    expect(res.statusCode).toEqual(404);
  });
});

describe("DELETE /companies/[code]", () => {
  test("Delete a Company from list", async () => {
    let code = "testcompany";
    const res = await request(app).delete(`/companies/${code}`);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ status: `deleted company: ${code}` });
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
