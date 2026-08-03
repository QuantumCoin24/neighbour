import type { BusinessEventEntity } from './event.entity';


export abstract class BusinessEventRepository {


  abstract save(
    event:BusinessEventEntity
  ):Promise<BusinessEventEntity>;



  abstract findById(
    id:string
  ):Promise<BusinessEventEntity|undefined>;



  abstract findByBusiness(
    businessId:string
  ):Promise<BusinessEventEntity[]>;


  abstract findUpcoming():Promise<BusinessEventEntity[]>;


}
