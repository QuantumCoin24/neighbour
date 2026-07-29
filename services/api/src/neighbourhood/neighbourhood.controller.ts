import { Controller, Get, Param } from '@nestjs/common';

import { NeighbourhoodService } from './neighbourhood.service';

@Controller('neighbourhoods')
export class NeighbourhoodController {
  constructor(private readonly service: NeighbourhoodService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
