// routes/defects-trend.js
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/* GET /api/defects-trend?month=YYYY-MM
   returns: [{ d:"2025-06-24", defects:4 }, … ] */
// GET /api/defects-trend?month=YYYY-MM
router.get('/', async (req, res, next) => {
  try {
    const month = req.query.month;           // e.g. "2025-08"
    const today = new Date();                // end = today
    let start, end;

    if (month) {
      const [y, m] = month.split('-').map(Number);
      const first = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      start = first.toISOString().slice(0, 10);
      end   = new Date(Math.min(lastDay, today)).toISOString().slice(0, 10);
    } else {
      const first = new Date(today); first.setDate(first.getDate() - 29);
      start = first.toISOString().slice(0, 10);
      end   = today.toISOString().slice(0, 10);
    }

    const sql = `
WITH RECURSIVE p AS (
  SELECT DATE(?) AS s, DATE(?) AS e
),
days AS (
  SELECT (SELECT s FROM p) AS d
  UNION ALL
  SELECT DATE_ADD(d, INTERVAL 1 DAY)
  FROM days, p
  WHERE d < (SELECT e FROM p)
),
tickets AS (
  /* One row per ServiceTicketID that was opened (reported) in the window */
  SELECT
    c.ServiceTicketID,
    -- Prefer the date when it was marked Defective; if missing, fall back to earliest check date
    COALESCE(
      MIN(CASE WHEN c.Status = 'Defective' THEN c.CheckDate END),
      MIN(c.CheckDate)
    ) AS start_d,
    DATE(MAX(f.FixedAt)) AS fix_d
  FROM computerstatuslog c
  LEFT JOIN fixes f
    ON f.ServiceTicketID = c.ServiceTicketID
  GROUP BY c.ServiceTicketID
  HAVING start_d BETWEEN (SELECT s FROM p) AND (SELECT e FROM p)
),
spans AS (
  /* Clamp to [s,e]; exclude the fix day by subtracting 1 */
  SELECT
    GREATEST(start_d, (SELECT s FROM p)) AS s,
    LEAST(
      COALESCE(DATE_SUB(fix_d, INTERVAL 1 DAY), (SELECT e FROM p)),
      (SELECT e FROM p)
    ) AS e
  FROM tickets
),
spans_valid AS (
  SELECT s, e FROM spans WHERE e >= s
),
daily AS (
  SELECT d.d, COUNT(sv.s) AS defects
  FROM days d
  LEFT JOIN spans_valid sv
    ON d.d BETWEEN sv.s AND sv.e
  GROUP BY d.d
)
SELECT DATE_FORMAT(d, '%Y-%m-%d') AS d, defects
FROM daily
ORDER BY d;



    `;

const params = [start, end, start, end, start, end, end]; 
const [rows] = await pool.query(sql, [start, end]);


    res.json(rows);

  } catch (err) {
    console.error('❌ [defects-trend] error:', err);
    next(err);
  }
});

export default router;
