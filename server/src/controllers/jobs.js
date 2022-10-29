const { Op, QueryTypes, Transaction } = require("sequelize");
const { z } = require("zod");

const { sequelize } = require("../model.js");
const { dateFormatter } = require("../utils.js");

const getUnpaidJobs = async (req, res) => {
  const userId = req.profile.id;
  const unpaidJobs = await sequelize.query(
    `
    select id, description, price, createdAt, updatedAt
    from jobs
    where paid is not 1 and ContractId in (
        select id from contracts
        where (ClientId = :userId or ContractorId = :userId)
            and status == 'in_progress'
    );
  `,
    { type: QueryTypes.SELECT, replacements: { userId } }
  ); // no need to get all attributes, an unpaid job has no payment date

  // Method with two seperate calls;
  // Subject to concurrency issues;
  // Must be wrapped in a transaction
  //   const contractIds = await Contract.findAll({
  //     attributes: ["id"],
  //     where: {
  //       [Op.or]: [{ ContractorId: userId }, { ClientId: userId }],
  //       status: "in_progress", // active
  //     },
  //   });
  // oops, maybe one of the contracts was deleted before this call...
  //   const jobs = await Job.findAll({
  //     where: {
  //       paid: { [Op.not]: true }, // not paid
  //       ContractId: { [Op.in]: contractIds.map((x) => x.id) }, // that are attached to this contract
  //     },
  //   });
  res.json(unpaidJobs);
};

const payForJob = async (req, res) => {
  const schema = z.object({
    jobId: z.preprocess(parseInt, z.number().nonnegative()),
  });
  const isValid = schema.safeParse(req.params);
  if (!isValid.success)
    return res.status(400).json({
      ok: false,
      code: "invalid_job_id",
      message: isValid.error.issues[0].message,
    });

  try {
    const { Job, Profile } = req.app.get("models");

    // check if job exists
    const jobId = req.params.jobId;
    const userId = req.profile.id;

    // start transaction
    // transaction docs: https://system.data.sqlite.org/index.html/raw/419906d4a0043afe2290c2be186556295c25c724
    await sequelize.transaction(
      { type: Transaction.TYPES.EXCLUSIVE },
      async (t) => {
        // two ways to think about this
        // - get job only if unpaid -> results in 404 for paid job
        // - get job and throw if already paid -> verbose!

        const [job] = await sequelize.query(
          `
            select 
                c.ContractorId as contractorId, c.status as contractStatus,
                paid, paymentDate, j.price as amountDue
            from jobs j join Contracts c on j.ContractId = c.id
            where j.id = :jobId and c.ClientId = :userId
            limit 1
          `,
          {
            type: QueryTypes.SELECT,
            replacements: { jobId, userId },
            transaction: t,
          }
        );

        if (!job) throw new Error("job_not_found");
        else if (job.contractStatus === "terminated")
          throw new Error(`contract_terminated`);
        else if (job.paid) throw new Error(`already_paid;${job.paymentDate}`);

        const { balance: userBalance } = await Profile.findByPk(userId, {
          attributes: ["balance"],
          transaction: t,
        });
        if (userBalance < job.amountDue) throw new Error("insuffucient_funds");

        await Promise.all([
          sequelize.query(
            "update Profiles set balance = balance - :amountDue where id = :userId",
            {
              replacements: { amountDue: job.amountDue, userId },
              transaction: t,
            }
          ),
          sequelize.query(
            "update Profiles set balance = balance + :amountDue  where id = :contractorId",
            {
              replacements: {
                amountDue: job.amountDue,
                contractorId: job.contractorId,
              },
              transaction: t,
            }
          ),
        ]);

        // ALTERNATIVE METHOD
        // multiple queires + locks (not needed in exclusive transaction mode)

        // - get client and contractor balance + apply locks
        // const [client, contractor] = await Promise.all([
        //   Profile.findByPk(userId, {
        //     attributes: ["balance"],
        //     transaction: t,
        //     lock: t.LOCK.UPDATE,
        //   }),
        //   Profile.findByPk(job.contractorId, {
        //     attributes: ["balance"],
        //     transaction: t,
        //     lock: t.LOCK.UPDATE,
        //   }),
        // ]);
        // - subtract = require(client balance, add to contractor balance
        // await Promise.all([
        //   Profile.update(
        //     { balance: client.balance - job.amountDue },
        //     { where: { id: userId }, transaction: t }
        //   ),
        //   Profile.update(
        //     { balance: contractor.balance + job.amountDue },
        //     { where: { id: job.contractorId }, transaction: t }
        //   ),
        // ]);

        // set job as paid + update paymentDate
        await Job.update(
          { paid: true, paymentDate: new Date() },
          { where: { id: jobId }, transaction: t }
        );
      }
    );

    res.json({ ok: true });
  } catch (error) {
    if (error.message === "job_not_found")
      return res.status(404).json({
        ok: false,
        code: error.message,
        message: "Job could not be found",
      });

    if (error.message === "contract_terminated")
      return res.status(400).json({
        ok: false,
        code: error.message,
        message: `Contract has been terminated`,
      });

    if (error.message.startsWith("already_paid")) {
      const [code, date] = error.message.split(";");
      const dateFormatted = dateFormatter.format(new Date(date));
      return res.status(400).json({
        ok: false,
        code,
        message: `Job was already paid on ${dateFormatted}`,
      });
    }

    if (error.message === "insuffucient_funds")
      return res.status(400).json({
        ok: false,
        code: error.message,
        message: "Not enough funds to complete the transaction",
      });

    console.log("[FAIL] transaction error |", error);
    res.status(500).json({
      ok: false,
      code: "transaction_failed",
      message: "The sql transaction failed",
    });
  }
};

module.exports = { getUnpaidJobs, payForJob };
