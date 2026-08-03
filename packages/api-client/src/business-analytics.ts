import { apiRequest } from "./index";


export interface BusinessAnalytics {

businessId:string;

profileViews:number;

offerViews:number;

eventViews:number;

totalReach:number;

}



export function getBusinessAnalytics(
businessId:string,
){

return apiRequest<BusinessAnalytics>(
`/businesses/${businessId}/analytics`,
);

}
