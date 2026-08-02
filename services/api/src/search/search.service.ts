import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class SearchService {

  constructor(
    private readonly database: DatabaseService,
  ) {}

  async search(query: string) {

    const term = query.trim();

    if (!term) {
      return {
        users: [],
        communities: [],
        neighbourhoods: [],
        events: [],
        posts: [],
      };
    }

    const contains = {
      contains: term,
      mode: 'insensitive' as const,
    };

    const [
      users,
      communities,
      neighbourhoods,
      events,
      posts,
    ] = await Promise.all([

      this.database.user.findMany({
        where:{
          OR:[
            {
              displayName: contains,
            },
            {
              email: contains,
            },
            {
              profile:{
                username: contains,
              },
            },
          ],
        },
        select:{
          id:true,
          displayName:true,
        },
        take:10,
      }),

      this.database.community.findMany({
        where:{
          OR:[
            {
              name: contains,
            },
            {
              description: contains,
            },
          ],
        },
        select:{
          id:true,
          name:true,
          slug:true,
        },
        take:10,
      }),

      this.database.neighbourhood.findMany({
        where:{
          OR:[
            {
              name: contains,
            },
            {
              localArea: contains,
            },
          ],
        },
        select:{
          id:true,
          name:true,
          localArea:true,
        },
        take:10,
      }),

      this.database.event.findMany({
        where:{
          OR:[
            {
              title: contains,
            },
            {
              description: contains,
            },
          ],
        },
        select:{
          id:true,
          title:true,
          startsAt:true,
          community:{
            select:{
              name:true,
            },
          },
        },
        take:10,
      }),

      this.database.post.findMany({
        where:{
          OR:[
            {
              title: contains,
            },
            {
              content: contains,
            },
          ],
        },
        select:{
          id:true,
          title:true,
          content:true,
        },
        take:10,
      }),

    ]);


    return {
      users,
      communities,
      neighbourhoods,
      events,
      posts,
    };

  }

}
