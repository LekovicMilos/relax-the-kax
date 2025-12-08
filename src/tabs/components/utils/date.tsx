import moment from "moment";

/**
 * Check if the given date is at least a day ago
 * Used to determine if cached data should be refreshed
 */
export const isADayAgo = (date: string): boolean => {
  if (date === "") {
    return true;
  }
  const yesterday = moment().subtract(1, "days").format("YYYY MM DD");
  return moment(date).isBefore(moment(yesterday));
};
