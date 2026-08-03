import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../../database/database.service';

import type { BusinessEventEntity } from './event.entity';
import { BusinessEventRepository } from './event.repository';


@Injectable()
export class PrismaBusinessEventRepository extends BusinessEventRepository {


constructor(
private readonly database:DatabaseService,
){
super();
}



private map(
record:any
):BusinessEventEntity {

return {

id:record.id,

businessId:record.businessId,

title:record.title,

description:record.description,

startsAt:record.startsAt,

endsAt:record.endsAt,

createdAt:record.createdAt,

};

}




async save(
event:BusinessEventEntity
):Promise<BusinessEventEntity>{


const record =
await this.database.businessEvent.create({

data:{

id:event.id,

businessId:event.businessId,

title:event.title,

description:event.description,

startsAt:event.startsAt,

endsAt:event.endsAt,

},

});


return this.map(record);

}




async findById(
id:string
):Promise<BusinessEventEntity|undefined>{


const record =
await this.database.businessEvent.findUnique({

where:{
id,
},

});


return record
?
this.map(record)
:
undefined;

}




async findByBusiness(
businessId:string
):Promise<BusinessEventEntity[]>{


const records =
await this.database.businessEvent.findMany({

where:{
businessId,
},

orderBy:{
startsAt:"asc",
},

});


return records.map(
record=>this.map(record),
);

}




async findUpcoming(
):Promise<BusinessEventEntity[]>{


const records =
await this.database.businessEvent.findMany({

where:{

startsAt:{
gte:new Date(),
},

},

orderBy:{
startsAt:"asc",
},

});


return records.map(
record=>this.map(record),
);


}


}
