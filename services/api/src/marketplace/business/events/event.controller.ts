import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { BusinessEventService } from './event.service';


@Controller('businesses')
export class BusinessEventController {


constructor(
private readonly service:BusinessEventService,
){}



@Post(':businessId/events')
create(

@Param('businessId')
businessId:string,

@Body()
body:{
title:string;
description:string;
startsAt:string;
endsAt:string;
},

){

return this.service.create({

businessId,

title:
body.title,

description:
body.description,

startsAt:
new Date(body.startsAt),

endsAt:
new Date(body.endsAt),

});

}




@Get(':businessId/events')
findBusinessEvents(

@Param('businessId')
businessId:string,

){

return this.service.findByBusiness(
businessId
);

}


@Get('/events/:id')
findOne(

@Param('id')
id:string,

){

return this.service.findById(
id
);

}


}
