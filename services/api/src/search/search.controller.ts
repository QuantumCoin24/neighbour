import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { SearchService } from './search.service';


@Controller('search')
export class SearchController {

  constructor(
    private readonly service: SearchService,
  ) {}


  @Get()
  search(
    @Query('q') query:string,
  ) {

    if(!query){

      return [];

    }


    return this.service.search(query);

  }

}
