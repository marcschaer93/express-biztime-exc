const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

/** GET - return all invoices */

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

/** GET - return invoice */

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      `SELECT 
        i.id, i.amt, i.paid,
        i.add_date, i.paid_date,
        c.name, c.description
        FROM invoices AS i
        INNER JOIN companies AS c
        ON (i.comp_code = c.code)
        WHERE id=$1`,
      [id]
    );

    if (results.rows.length === 0) {
      throw new ExpressError(`No invoice with id: ${id} found`, 404);
    }
    const data = results.rows[0];
    const invoice = {
      id: data.id,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
    };

    return res.json({ invoice: invoice });
  } catch (err) {
    return next(err);
  }
});

/** POST - add new invoice */

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `
            INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date

        `,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** PUT - update amount and (status) of "paid" */

router.put("/:id", async (req, res, next) => {
  try {
    const { amt, paid } = req.body;
    const id = req.params.id;
    let paidDate = null;

    const invoiceToUpdate = await db.query(
      `
        SELECT paid
        FROM invoices
        WHERE id=$1 
    `,
      [id]
    );

    if (invoiceToUpdate.rows.length === 0) {
      throw new ExpressError(`No invoice with id: ${id} found!`, 404);
    }

    const currentPaidDate = invoiceToUpdate.rows[0].paid_date;

    if (!currentPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = currentPaidDate;
    }

    const results = await db.query(
      `
            UPDATE invoices
            SET amt=$1, paid=$2, paid_date=$3
            WHERE id=$4
            RETURNING id, comp_code, amt, paid, add_date, paid_date
        `,
      [amt, paid, paidDate, id]
    );
    return res.json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** DELETE - remove invoice by ID */

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      `
            DELETE from invoices
            WHERE id=$1
            RETURNING id
        `,
      [id]
    );

    if (results.rows.length === 0) {
      throw new ExpressError(`No invoice with id: ${id} found!`, 404);
    }

    return res.json({ status: "Deleted!" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
