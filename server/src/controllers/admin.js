const { Op, QueryTypes, Transaction } = require("sequelize");
const { z } = require("zod");
const { sequelize } = require("../model.js");

const dateSchema = z.preprocess((v) => new Date(Date.parse(v)), z.date());

module.exports.getDatesFromQuery = (req, res, next) => {
  let start = null,
    end = null;
  if (req.query.hasOwnProperty("start")) {
    const isValid = dateSchema.safeParse(req.query.start);
    if (!isValid.success)
      return res.status(400).json({
        ok: false,
        code: "invalid_start_time",
        message: "Start time is not a valid date",
      });
    start = isValid.data;
  }

  if (req.query.hasOwnProperty("end")) {
    const isValid = dateSchema.safeParse(req.query.end);
    if (!isValid.success)
      return res.status(400).json({
        ok: false,
        code: "invalid_end_time",
        message: "End time is not a valid date",
      });
    end = isValid.data;
  }

  if (start && end && end <= start)
    return res.status(400).json({
      ok: false,
      code: "invalid_range",
      message: "End time cannot be before start time",
    });

  req.query.start = start;
  req.query.end = end;
  next();
};

module.exports.getBestProfession = async (req, res) => {
  const [result] = await sequelize.query(
    `
        select p.profession, sum(j.price) as totalEarned
        from profiles p
        join contracts c on c.contractorId = p.id
        join jobs j on j.contractId = c.id
        where p.type = 'contractor' and j.paid = 1
            ${req.query.start ? "and j.paymentDate >= :start" : ""}
            ${req.query.end ? "and j.paymentDate <= :end" : ""}
        group by p.profession
        order by totalEarned desc
        limit 1;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        start: req.query.start,
        end: req.query.end,
      },
    }
  );
  if (!result)
    return res.status(404).json({
      ok: false,
      code: "no_paid_jobs",
      message: "No paid jobs were found in that range",
    });
  res.json(result);
};

module.exports.getBestClients = async (req, res) => {
  const schema = z.preprocess(
    (v) => v && parseInt(v),
    z.number().nonnegative().nullish().default(2)
  );

  let limit = 2;
  const isValid = schema.safeParse(req.query.limit);
  if (!isValid.success)
    return res.status(400).json({
      ok: false,
      code: "invalid_limit",
      message: "Invalid limit value",
    });
  else limit = isValid.data;

  const results = await sequelize.query(
    `
    select 
        p.id, 
        p.firstName || ' ' || p.lastName as fullName,
        sum(j.price) as paid
    from profiles p
    join contracts c on c.clientId = p.id
    join jobs j on j.contractId = c.id
    where p.type = 'client' and j.paid = 1
        ${req.query.start ? "and j.paymentDate >= :start" : ""}
        ${req.query.end ? "and j.paymentDate <= :end" : ""}
    group by p.id
    order by paid desc
    limit :limit;
  `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        start: req.query.start,
        end: req.query.end,
        limit,
      },
    }
  );
  res.json(results);
};
