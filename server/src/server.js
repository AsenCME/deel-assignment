const app = require("./app.js");
const { seed } = require("../scripts/seedDb.js");

init();

async function init() {
  try {
    await seed();
    app.listen(3001, () => {
      console.log("Express App Listening on Port 3001");
    });
  } catch (error) {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  }
}
