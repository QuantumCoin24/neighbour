import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { OrganisationMemberService } from './member.service';



@Controller('organisations')
export class OrganisationMemberController {


constructor(
private readonly service:OrganisationMemberService,
){}



@Post(':organisationId/members')
add(
@Param('organisationId')
organisationId:string,

@Body()
body:{
userId:string;
role?:string;
},
){

return this.service.addMember({

organisationId,

userId:body.userId,

...(body.role !== undefined
? { role: body.role }
: {}),

});

}





@Get(':organisationId/members')
list(
@Param('organisationId')
organisationId:string,
){

return this.service.findByOrganisation(
organisationId,
);

}





@Delete(':organisationId/members/:userId')
remove(
@Param('organisationId')
organisationId:string,

@Param('userId')
userId:string,
){

return this.service.remove(
organisationId,
userId,
);

}



}
