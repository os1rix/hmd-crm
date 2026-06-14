/** Shared labels + tooltip copy for money shown on cards and KPIs. */
export const MONEY = {
  latestOffer: {
    label: "Latest offer",
    hint: "Total of the most recent offer on this deal (devices + services, after any discount). Empty until an offer is created.",
  },
  offerTotal: {
    label: "Offer total",
    hint: "Full value of this offer — all line items with discount applied.",
  },
  dealForecast: {
    label: "Deal forecast",
    hint: "3-year revenue forecast for this deal (device + service by quarter). This is your pipeline estimate, not an offer price.",
  },
  accountForecast: {
    label: "Account forecast",
    hint: "Combined forecast pipeline across all open deals on this account (sum of quarterly forecasts).",
  },
  totalPipeline: {
    label: "Total pipeline",
    hint: "Sum of forecast revenue across all your open deals (3-year device + service forecasts). Not the same as submitted offer totals.",
  },
  teamPipeline: {
    label: "Team pipeline",
    hint: "Combined forecast revenue across all open deals in the team pipeline.",
  },
  fyPipeline: {
    label: "FY pipeline",
    hint: "Forecast revenue total for this fiscal year from the pipeline chart.",
  },
} as const;
