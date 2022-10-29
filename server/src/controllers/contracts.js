const { Op } = require("sequelize");
const { z } = require("zod");

const getContract = async (req, res) => {
  const schema = z.object({
    id: z.preprocess(parseInt, z.number().nonnegative()),
  });
  const isValid = schema.safeParse(req.params);
  if (!isValid.success)
    return res.status(400).json({
      ok: false,
      code: "invalid_contract_id",
      message: isValid.error.issues[0].message,
    });

  const { Contract, Profile } = req.app.get("models");
  const { id } = req.params;
  const userId = req.profile.id;

  const contract = await Contract.findOne({
    include: [
      { model: Profile, attributes: ["firstName", "lastName"], as: "Client" },
      {
        model: Profile,
        attributes: ["firstName", "lastName"],
        as: "Contractor",
      },
    ],
    where: { id, [Op.or]: [{ ContractorId: userId }, { ClientId: userId }] },
  });
  if (!contract)
    return res
      .status(404)
      .json({ ok: false, code: "not_found", message: "Contract not found" });
  res.json(contract);
};

const getNonTerminatedContracts = async (req, res) => {
  const { Contract, Profile } = req.app.get("models");

  const userId = req.profile.id;
  const contracts = await Contract.findAll({
    include: [
      { model: Profile, attributes: ["firstName", "lastName"], as: "Client" },
      {
        model: Profile,
        attributes: ["firstName", "lastName"],
        as: "Contractor",
      },
    ],
    where: {
      [Op.or]: [{ ContractorId: userId }, { ClientId: userId }],
      status: { [Op.not]: "terminated" },
    },
  });

  // added role attribute to let the user know
  // if they are the contractor or the client in this contract
  const contractsWithRole = contracts.map((x) => ({
    ...x.dataValues,
    role: x.ClientId === userId ? "client" : "contractor",
  }));
  res.json(contractsWithRole);
};

const getAllContracts = async (req, res) => {
  const { Contract, Profile } = req.app.get("models");

  const userId = req.profile.id;
  const contracts = await Contract.findAll({
    include: [
      { model: Profile, attributes: ["firstName", "lastName"], as: "Client" },
      {
        model: Profile,
        attributes: ["firstName", "lastName"],
        as: "Contractor",
      },
    ],
    where: {
      [Op.or]: [{ ContractorId: userId }, { ClientId: userId }],
    },
  });

  // added role attribute to let the user know
  // if they are the contractor or the client in this contract
  const contractsWithRole = contracts.map((x) => ({
    ...x.dataValues,
    role: x.ClientId === userId ? "client" : "contractor",
  }));
  res.json(contractsWithRole);
};

module.exports = { getContract, getNonTerminatedContracts, getAllContracts };
