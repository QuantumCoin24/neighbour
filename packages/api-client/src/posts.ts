import { apiRequest } from "./index";

export interface CreatePostInput {
  communityId: string;
  content: string;
}

export function createPost(
  token: string,
  data: CreatePostInput,
) {
  return apiRequest(
    "/posts",
    {
      method:"POST",
      headers:{
        Authorization:`Bearer ${token}`,
      },
      body:JSON.stringify(data),
    },
  );
}


export function getPostsByProfile(
  username: string,
) {
  return apiRequest<{
  items:any[];
}>(
    `/posts/profiles/${username}`,
    {
      method:"GET",
    },
  );
}
