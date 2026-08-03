import { Injectable } from '@nestjs/common';

import type { OfferEntity } from './offer.entity';

import { OfferRepository } from './offer.repository';


@Injectable()
export class OfferService {


constructor(
private readonly repository:OfferRepository,
){}



async create(
data:{
businessId:string;
title:string;
description:string;
active?:boolean;
startsAt?:Date|null;
endsAt?:Date|null;
},
):Promise<OfferEntity>{


return this.repository.save({

id:
crypto.randomUUID(),

businessId:
data.businessId,

title:
data.title,

description:
data.description,

active:
data.active ?? true,

startsAt:
data.startsAt ?? null,

endsAt:
data.endsAt ?? null,

createdAt:
new Date(),

});

}



async findByBusiness(
businessId:string,
){

return this.repository.findByBusiness(
businessId,
);

}



async findById(
id:string,
){

return this.repository.findById(
id,
);

}


}
