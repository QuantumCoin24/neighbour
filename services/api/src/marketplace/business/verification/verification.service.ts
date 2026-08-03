import { Injectable } from '@nestjs/common';

import type { VerificationEntity } from './verification.entity';

import { VerificationRepository } from './verification.repository';


@Injectable()
export class VerificationService {


constructor(
private readonly repository:VerificationRepository,
){}



async submit(
data:{
businessId:string;
notes?:string;
},
):Promise<VerificationEntity>{


const existing =
await this.repository.findByBusiness(
data.businessId,
);


if(existing){

return existing;

}



return this.repository.save({

id:crypto.randomUUID(),

businessId:
data.businessId,

status:
'PENDING',

notes:
data.notes ?? null,

submittedAt:
new Date(),

reviewedAt:
null,

reviewerId:
null,

});


}




async findByBusiness(
businessId:string,
){

return this.repository.findByBusiness(
businessId,
);

}


}
