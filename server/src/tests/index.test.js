const fetch = require("node-fetch");
const { Op } = require("sequelize");

// import
const app = require("../app.js");
const { seed } = require("../../scripts/seedDb.js");
const { Contract, Profile, sequelize } = require("../model.js");

// constants
const USER_ID = 1;

// set up server
let server;
const port = Math.floor(Math.random() * 1000 + 3000);
const url = "http://localhost:" + port;

// utils
const call = async (endpoint, method = "GET", body = undefined) => {
  const params = {
    method,
    headers: { "Content-Type": "application/json", profile_id: USER_ID },
  };
  if (body) params.body = JSON.stringify(body);
  return await fetch(url + endpoint, params);
};

// set up tests
beforeAll(async () => {
  await new Promise((res, rej) => {
    server = app.listen(port, res());
  });
});
beforeEach(async () => {
  await seed();
  return;
});
afterAll(() => {
  return server.close();
});

// tests
describe("authentication", () => {
  it("should throw if no profile_id is provided", async () => {
    const response = await fetch(url + "/contracts");
    expect(response.status).toBe(401);
  });
});

describe("Get single contract", () => {
  it("should return 200 and a valid contract if current user is client or contractor", async () => {
    const response = await call("/contracts/1");
    const contract = await response.json();
    expect(response.status).toBe(200);
    expect(contract.id).toBe(1);
    expect(contract.Client?.firstName).toBe("Harry");
    expect(contract.Client?.lastName).toBe("Potter");
    expect(contract.Contractor?.firstName).toBe("John");
    expect(contract.Contractor?.lastName).toBe("Lenon");
  });

  it("should throw if current user is NOT client or contractor", async () => {
    const response = await call("/contracts/3");
    expect(response.status).toBe(404);
  });

  it("should fail if contract ID is invalid", async () => {
    const response = await call("/contracts/hello");
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("invalid_contract_id");
  });
});

describe("Get contracts", () => {
  it("should return all contracts where current user is client or contractor", async () => {
    const response = await await call("/contracts");
    expect(response.status).toBe(200);

    const contracts = await response.json();
    expect(contracts.length).toBe(1);
    expect(contracts[0].id).toBe(2);
    expect(contracts[0].role).toBe("client");
    expect(contracts[0].Client?.firstName).toBe("Harry");
    expect(contracts[0].Client?.lastName).toBe("Potter");
    expect(contracts[0].Contractor?.firstName).toBe("Linus");
    expect(contracts[0].Contractor?.lastName).toBe("Torvalds");
  });
});

describe("Get unpaid jobs", () => {
  it("should return all jobs where the current user is client/contractor and the contract is in progress", async () => {
    const response = await call("/jobs/unpaid");
    const jobs = await response.json();

    expect(response.status).toBe(200);
    expect(jobs.length).toBe(1);
    // alternative to stringify, does not guarantee the other attributes
    // but in a predictable database and enviroment this works
    expect(jobs[0].id).toBe(2);
  });
});

describe("Pay for a job", () => {
  it("should pay for a job", async () => {
    const response = await call("/jobs/2/pay", "POST");
    expect(response.status).toBe(200);
    const expectedBalance = 1150 - 201; // starting balance of user 1, price of job 2
    const expectedContractorBalance = 1214 + 201;
    const { balance } = await Profile.findByPk(USER_ID, {
      attributes: ["balance"],
    });
    const { balance: contractorBalance } = await Profile.findByPk(6, {
      attributes: ["balance"],
    });
    expect(balance).toBe(expectedBalance);
    expect(contractorBalance).toBe(expectedContractorBalance);
  });

  it("should fail if current user's balance is insufficient", async () => {
    await Profile.update({ balance: 100 }, { where: { id: USER_ID } });
    const response = await call("/jobs/2/pay", "POST");
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.code).toBe("insuffucient_funds");
  });

  it("should fail if user tries to pay for a job in a terminated contract", async () => {
    const response = await call("/jobs/1/pay", "POST");
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("contract_terminated");
  });

  it("should fail if user tries to pay for a job that is already paid", async () => {
    await call("/jobs/2/pay", "POST");
    const response = await call("/jobs/2/pay", "POST");
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("already_paid");
  });

  it("should fail if the provided job ID is invalid", async () => {
    const response = await call("/jobs/hello/pay", "POST");
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("invalid_job_id");
  });
});

describe("Deposit money", () => {
  it("should deposit 200 from current user's balance into user' profile passed in params", async () => {
    const amount = 10;
    const userId = 2;
    const response = await call("/balances/deposit/" + userId, "POST", {
      amount,
    });
    expect(response.status).toBe(200);

    const [{ balance: currentUserBalance }, { balance: otherUserBalance }] =
      await Promise.all([
        Profile.findByPk(USER_ID, {
          attributes: ["balance"],
        }),
        Profile.findByPk(userId, {
          attributes: ["balance"],
        }),
      ]);
    const expectedCurrentUserBalance = 1150 - amount;
    const expectedOtherUserBalance = 231.11 + amount;
    expect(currentUserBalance).toBe(expectedCurrentUserBalance);
    expect(otherUserBalance).toBe(expectedOtherUserBalance);
  });

  it("should fail if the userId provided is invalid", async () => {
    const response = await call("/balances/deposit/hello", "POST", {
      amount: 0,
    });
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("invalid_user_id");
  });

  it("should fail if the amount is invalid", async () => {
    const response = await call("/balances/deposit/2", "POST", {
      amount: "hello",
    });
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("invalid_request_body");
  });

  it("should fail if other user does not exist", async () => {
    const response = await call("/balances/deposit/10", "POST", {
      amount: 100,
    });
    expect(response.status).toBe(404);
  });

  it("should fail current user tries to deposit to himself", async () => {
    const response = await call("/balances/deposit/1", "POST", {
      amount: 999,
    });
    const { code } = await response.json();
    expect(response.status).toBe(403);
    expect(code).toBe("deposit_to_self_forbidden");
  });

  it("should fail if current user does not have enough funds", async () => {
    const response = await call("/balances/deposit/2", "POST", {
      amount: 10000,
    });
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("insuffucient_funds");
  });

  it("should fail if current user is trying to deposit more than 25% of his total owed across all jobs", async () => {
    const response = await call("/balances/deposit/2", "POST", {
      amount: 300,
    });
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("deposit_too_large");
  });
});

describe("Best profession", () => {
  it("should get the best profession of all time", async () => {
    const response = await call("/admin/best-profession");
    const { profession, totalEarned } = await response.json();
    expect(response.status).toBe(200);
    expect(profession).toBe("Programmer");
    expect(totalEarned).toBe(2683);
  });

  it("should get the best profession within a certain period", async () => {
    const response = await call(
      "/admin/best-profession?start=2020-08-10&end=2020-08-13"
    );
    const { profession, totalEarned } = await response.json();
    expect(response.status).toBe(200);
    expect(profession).toBe("Musician");
    expect(totalEarned).toBe(21);
  });

  it("should fail for invalid start parameter", async () => {
    const response = await call("/admin/best-profession?start=hello");
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("invalid_start_time");
  });

  it("should fail for invalid end parameter", async () => {
    const response = await call("/admin/best-profession?end=hello");
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("invalid_end_time");
  });

  it("should fail if the end parameter is before the start parameter", async () => {
    const response = await call("/admin/best-profession?start=2022&end=2020");
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("invalid_range");
  });
});

describe("Best clients", () => {
  it("should get the top 2 clients of all time", async () => {
    const response = await call("/admin/best-clients");
    expect(response.status).toBe(200);

    const clients = await response.json();
    console.log("[clients]", clients);
    const expectedIds = clients.map((x) => x.id);
    const expectedNames = clients.map((x) => x.fullName);
    const expectedAmounts = clients.map((x) => x.paid);

    expect(expectedIds).toEqual([4, 2]);
    expect(expectedNames).toEqual(["Ash Kethcum", "Mr Robot"]);
    expect(expectedAmounts).toEqual([2020, 442]);
  });

  it("should get at most the top 10 clients in a certain period", async () => {
    const response = await call(
      "/admin/best-clients?start=2020-08-10&end=2020-08-15&limit=10"
    );
    expect(response.status).toBe(200);

    const clients = await response.json();
    const expectedIds = clients.map((x) => x.id);
    const expectedAmounts = clients.map((x) => x.paid);

    expect(expectedIds).toEqual([2, 1]);
    expect(expectedAmounts).toEqual([121, 21]);
  });

  // no need to repeat the start/end tests
  // the function that parses the dates is run...
  // ...with the previous tests

  it("should fail for invalid limit parameter", async () => {
    const response = await call("/admin/best-clients?limit=hello");
    const { code } = await response.json();
    expect(response.status).toBe(400);
    expect(code).toBe("invalid_limit");
  });
});
