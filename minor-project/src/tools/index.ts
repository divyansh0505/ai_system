// Export all functions from this directory
export { registerTools, unregisterTools } from "./registerTools";
import { openCalendar } from "./calendar.ts";
import { openDemo } from "./demo.ts";
import { gotoDestination } from "./navigator";
import { showSuggestions } from "./suggestions.ts";
import { openSlides } from "./slides";

// Function type definitions
export type FunctionMap = {
  [key: string]: (data: any) => Promise<string | void>;
};

export const functionMap = {
  loadDemo: openDemo,
  loadCalendar: openCalendar,
  querySuggestions: showSuggestions,
  gotoDestination: gotoDestination,
  loadSlides: openSlides,
};
