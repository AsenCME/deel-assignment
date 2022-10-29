// imports
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// middleware
const { sequelize } = require("./model.js");
const { getProfile } = require("./middleware/getProfile.js");

// controllers
const {
  getContract,
  getNonTerminatedContracts,
  getAllContracts,
} = require("./controllers/contracts.js");
const { getUnpaidJobs, payForJob } = require("./controllers/jobs.js");
const { depositMoney } = require("./controllers/profiles.js");
const {
  getBestProfession,
  getDatesFromQuery,
  getBestClients,
} = require("./controllers/admin.js");

// app setup
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.set("sequelize", sequelize);
app.set("models", sequelize.models);

// === ROUTES ===

// me (returns data about current user)
app.get("/me", getProfile, async (req, res) => {
  res.json(req.profile);
});

// get one contract for user
app.get("/contracts/:id", getProfile, getContract);
// METHOD 2 - alternative version, no explicit reason for denial
// app.get("/contracts/:id", getProfile, async (req, res) => {
//   const { Contract } = req.app.get("models");
//   const { id } = req.params;
//   const contract = await Contract.findOne({ where: { id } });
//   if (![contract.ClientId, contract.ContractorId].includes(req.profile.id))
//     return res.status(401).json({
//       ok: false,
//       code: "action_not_allowed",
//       message: "This contract does not belong to you",
//     });

//   if (!contract) return res.status(404).end();
//   res.json(contract);
// });

// Get all contracts for user
app.get("/contracts", getProfile, getNonTerminatedContracts);

app.get("/all-contracts", getProfile, getAllContracts);

app.get("/jobs/unpaid", getProfile, getUnpaidJobs);

// ! Note: Changed variable name = require(job_id to jobId
// ! to be consistent with camelCase instead of snake_case
app.post("/jobs/:jobId/pay", getProfile, payForJob);

// ! This one I did not understand very well
// I have left some comments about my solution in the implementation
app.post("/balances/deposit/:userId", getProfile, depositMoney);

// can submit no dates
// can submit only start date
// can submit only end date
// can submit both
app.get(
  "/admin/best-profession",
  getProfile,
  getDatesFromQuery,
  getBestProfession
);

app.get("/admin/best-clients", getProfile, getDatesFromQuery, getBestClients);

module.exports = app;
