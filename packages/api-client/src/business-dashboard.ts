import { apiRequest } from "./index";


export interface BusinessDashboard {

  business:any;

  verification:any;

  offers:any[];

  events:any[];

}



export function getBusinessDashboard(
businessId:string,
){

return apiRequest<BusinessDashboard>(
`/businesses/${businessId}/dashboard`,
);

}
