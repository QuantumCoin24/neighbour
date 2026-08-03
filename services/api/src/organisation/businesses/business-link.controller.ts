import {
Body,
Controller,
Delete,
Get,
Param,
Post,
} from '@nestjs/common';

import { OrganisationBusinessService } from './business-link.service';



@Controller('organisations')
export class OrganisationBusinessController {


constructor(
private readonly service:OrganisationBusinessService,
){}



@Post(':organisationId/businesses')
attach(
@Param('organisationId')
organisationId:string,

@Body()
body:{
businessId:string;
},
){

return this.service.attach({

organisationId,

businessId:body.businessId,

});

}




@Get(':organisationId/businesses')
list(
@Param('organisationId')
organisationId:string,
){

return this.service.findByOrganisation(
organisationId,
);

}




@Delete(':organisationId/businesses/:businessId')
remove(
@Param('organisationId')
organisationId:string,

@Param('businessId')
businessId:string,
){

return this.service.remove(
organisationId,
businessId,
);

}



}
