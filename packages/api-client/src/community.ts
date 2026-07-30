import { apiRequest } from "./index";

export interface Community {
  id:string;
  name:string;
  slug:string;
  description:string | null;
}


export function getCommunity(
  token:string,
  slug:string,
){
  return apiRequest<Community>(
    `/communities/${slug}`,
    {
      headers:{
        Authorization:`Bearer ${token}`,
      },
    },
  );
}


export function getPublicCommunity(
  slug:string,
){
  return apiRequest<Community>(
    `/communities/${slug}`,
  );
}


export function getMyCommunities(
  token:string,
){
  return apiRequest<any[]>(
    "/communities/mine",
    {
      headers:{
        Authorization:`Bearer ${token}`,
      },
    },
  );
}
