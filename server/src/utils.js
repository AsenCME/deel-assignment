const numberFormatter = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "medium",
});

const issuesToString = (issues) => {
  return issues.reduce((cum, cur, i) => {
    if (!i) return `${cur.path}: ${cur.message}`;
    return `${cum}, ${cur.path}: ${cur.message}`;
  }, "");
};

module.exports = { numberFormatter, dateFormatter, issuesToString };
