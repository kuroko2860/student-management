import { WEEKDAYS } from "@/constants/weekday";
import { SESSIONS } from "@/constants/session";

export function getWeekdayLabel(value) {
  return WEEKDAYS.find((item) => item.value === value)?.label;
}

export function getSessionLabel(value) {
  return SESSIONS.find((item) => item.value === value)?.label;
}
