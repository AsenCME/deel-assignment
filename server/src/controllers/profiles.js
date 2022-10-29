const { Op, QueryTypes, Transaction } = require("sequelize");
const { z } = require("zod");

const { sequelize } = require("../model.js");
const { numberFormatter, issuesToString } = require("../utils.js");

// I did not undestand this one very well
// Where does the money come from? The current user? The user with the ID in params?
// Does it go to the :userId param in the request? Does it go the current user?
// Where can we send the amount to be deposited?

// So, I will take money = require(the current user's balance...
// ... only if that amount is <= 25% of the total owed for all jobs ...
// ...and deposit it into the balance of the other user...
// ... represented by the (:userId param)
// The amount to be deposited will be sent via the request's body
// In essence this is more like a transfer than a deposit
// Think of it as "deposit into my friend's balance"
const depositMoney = async (req, res) => {
  const paramsSchema = z.object({
    userId: z.preprocess(parseInt, z.number().nonnegative()),
  });
  const isParamsValid = paramsSchema.safeParse(req.params);
  if (!isParamsValid.success)
    return res.status(400).json({
      ok: false,
      code: "invalid_user_id",
      message: isParamsValid.error.issues[0].message,
    });

  // can be extended to any amount of attributes in a body
  // returns string with comma seperated errors
  const bodySchema = z.object({
    amount: z.preprocess(parseInt, z.number().positive()),
  });
  const isBodyValid = bodySchema.safeParse(req.body);
  if (!isBodyValid.success)
    return res.status(400).json({
      ok: false,
      code: "invalid_request_body",
      message: issuesToString(isBodyValid.error.issues),
    });

  const { Profile } = req.app.get("models");

  try {
    // start transaction
    await sequelize.transaction(
      { type: Transaction.TYPES.EXCLUSIVE },
      async (t) => {
        // get ids
        const userId = req.profile.id;
        const clientId = Number(req.params.userId);

        // check ids match
        if (userId === clientId) throw new Error("deposit_to_self_forbidden");

        // check if client id exists
        const [{ notFound }] = await sequelize.query(
          "select not exists (select 1 from profiles where id = :clientId) as notFound",
          {
            replacements: { clientId },
            transaction: t,
            type: QueryTypes.SELECT,
          }
        );
        if (notFound) throw new Error("client_not_found");

        // get sum of prices that the current user owes
        const [{ sumOfPrices }] = await sequelize.query(
          "select coalesce(sum(price), 0) as sumOfPrices from jobs j join contracts c on c.id = j.ContractId where j.paid is not 1 and c.ClientId = :userId;",
          { type: QueryTypes.SELECT, replacements: { userId }, transaction: t }
        );

        // get amounts
        const maxAllowedDeposit = 0.25 * sumOfPrices;
        const wantToDeposit = Number(req.body.amount);

        // check if current user has enough funds
        const { balance: userBalance } = await Profile.findByPk(userId, {
          attributes: ["balance"],
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (userBalance < wantToDeposit) throw new Error("insuffucient_funds");

        // check if desired amount > 25% of sum
        if (wantToDeposit > maxAllowedDeposit)
          throw new Error(`deposit_too_large;${sumOfPrices}`);

        // subtract = require(current user, add to client
        await Promise.all([
          sequelize.query(
            "update profiles set balance = balance - :amount where id = :userId",
            { replacements: { userId, amount: wantToDeposit }, transaction: t }
          ),
          sequelize.query(
            "update profiles set balance = balance + :amount where id = :clientId",
            {
              replacements: { clientId, amount: wantToDeposit },
              transaction: t,
            }
          ),
        ]);
      }
    );

    // respond
    res.json({ ok: true, message: "Transfer successful" });
  } catch (error) {
    if (error.message === "deposit_to_self_forbidden")
      return res.status(403).json({
        ok: false,
        code: error.message,
        message: "Cannot add to your own balance",
      });

    if (error.message.startsWith("deposit_too_large")) {
      const [code, owed] = error.message.split(";");
      const owedFormatted = numberFormatter.format(owed);
      const maxAllowedFormatted = numberFormatter.format(owed * 0.25);
      return res.status(400).json({
        ok: false,
        code,
        message: `Cannot deposit more than 25% (${maxAllowedFormatted}) of your total owed (${owedFormatted})`,
      });
    }

    if (error.message === "client_not_found")
      return res.status(404).json({
        ok: false,
        code: error.message,
        message:
          "The client account you're trying to deposit money into does not exist",
      });

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

module.exports = { depositMoney };
