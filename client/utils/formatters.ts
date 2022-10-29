export const formatDate = (date: string) => {
  if (isNaN(Date.parse(date))) return date;

  const formatter = Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
  return formatter.format(new Date(date));
};

export const formatDateRelative = (date: string) => {
  let unit = "minutes",
    diff = (Date.parse(date) - Date.now()) / 1000 / 60;
  if (diff >= 60) {
    diff = diff / 60;
    unit = "hours";
  }
  if (diff >= 24) {
    diff = diff / 24;
    unit = "days";
  }
  diff = Math.floor(diff);

  const formatter = new Intl.RelativeTimeFormat("en", { style: "short" });
  return formatter.format(diff, unit as any);
};
