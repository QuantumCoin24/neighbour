import {
  getCommunityFeed,
  getCommunityEvents,
  getConversations,
} from "@neighbour/api-client";


export interface CommunityActivityData {

postCount:number;

eventCount:number;

conversationCount:number;

}


export async function getCommunityActivity(
token:string,
slug:string|null,
communityId:string|null,
):Promise<CommunityActivityData>{


const empty = {
postCount:0,
eventCount:0,
conversationCount:0,
};


try{


const feed =
slug
?
await getCommunityFeed(token,slug)
:
{items:[]};


const events =
communityId
?
await getCommunityEvents(communityId)
:
[];


const conversations =
await getConversations(token);



return {

postCount:
feed.items.length,

eventCount:
events.length,

conversationCount:
conversations.items.length,

};


}
catch{

return empty;

}

}
