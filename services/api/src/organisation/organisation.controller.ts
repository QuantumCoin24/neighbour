import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import {
  CurrentUser,
} from '../auth/decorators/current-user.decorator';

import type {
  AuthUser,
} from '../auth/interfaces/auth-user.interface';

import { OrganisationService } from './organisation.service';



@Controller('organisations')
export class OrganisationController {



constructor(
private readonly service:OrganisationService,
){}





@Post()
create(
@CurrentUser()
user:AuthUser,

@Body()
body:{
name:string;
description:string;
type:string;
},
){


return this.service.create({

ownerId:user.id,

name:body.name,

description:body.description,

type:body.type,

});


}





@Get('me')
findMine(
@CurrentUser()
user:AuthUser,
){


return this.service.findByOwner(
user.id,
);

}





@Get('search')
search(
@Query('q')
query:string,
){


return this.service.search(
query ?? "",
);

}





@Get(':id')
findOne(
@Param('id')
id:string,
){


return this.service.findById(
id,
);


}



}
