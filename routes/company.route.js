const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const slugify = require("slugify");
const db = require("../db");

/** GET - return All companies */

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT code, name 
    FROM companies 
    ORDER BY name`);
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

/** GET - return a company by code */

router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;

    const results = await db.query(
      `
    SELECT 
    c.code, c.name, c.description,
    i.id, i.amt, i.paid, i.paid_date
    FROM companies AS c
    INNER JOIN invoices AS i
    ON (c.code = i.comp_code)
    WHERE code=$1 
    `,
      [code]
    );

    if (results.rows.length === 0) {
      throw new ExpressError(`Company with code: ${code} not found!`, 404);
    }
    return res.json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** POST - Add a new company */

router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    // Method to make name URL firendly
    const code = slugify(name, { lower: true });

    const results = await db.query(
      `INSERT INTO companies (name, code, description) VALUES ($1, $2, $3) RETURNING *`,
      [name, code, description]
    );

    return res.status(201).json({ companies: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** PUT - Edit existing company */

router.put("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;

    const editedCompany = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *`,
      [name, description, code]
    );

    if (editedCompany.rows.length === 0) {
      throw new ExpressError(`Company with code: ${code} does NOT exist`, 404);
    }

    return res.status(201).json({ company: editedCompany.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** DELETE - remove a company */

router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;

    const results = await db.query(
      `DELETE FROM companies WHERE code=$1 RETURNING *`,
      [code]
    );

    if (results.rows.length === 0) {
      throw new ExpressError(`Company with code: ${code} does NOT exist`, 404);
    }

    return res.status(201).json({ status: `deleted company: ${code}` });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
