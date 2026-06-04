/**
 * Region info returned by GET /api/v1/store/region.
 *
 * The buyer is always charged in GHS via Hubtel. The frontend uses
 * displayCurrency + fxRate to render prices in the buyer's local currency
 * for display only.
 *
 *   GH visitor: displayCurrency = "GHS", fxRate = 1.0
 *   UK visitor: displayCurrency = "GBP", fxRate = ~0.05
 */
export interface Region {
  countryCode: string;
  zoneName: string;
  displayCurrency: string;
  chargeCurrency: string;
  fxRate: number;
  shippingAmountGhs: number;
  shippingAmountDisplay: number;
  shippingLabel: string;
  freeShipping: boolean;
}
