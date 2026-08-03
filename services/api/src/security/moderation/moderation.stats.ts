import { Injectable } from '@nestjs/common';

import {
  ReportStatus,
} from '../../generated/prisma/client.js';

import {
  DatabaseService,
} from '../../database/database.service';


@Injectable()
export class ModerationStatsService {


constructor(
private readonly database:DatabaseService,
){}



async overview(){

const [
pending,
review,
resolved,
dismissed,
]=await Promise.all([

this.database.report.count({
where:{
status:ReportStatus.PENDING,
},
}),


this.database.report.count({
where:{
status:ReportStatus.UNDER_REVIEW,
},
}),


this.database.report.count({
where:{
status:ReportStatus.RESOLVED,
},
}),


this.database.report.count({
where:{
status:ReportStatus.DISMISSED,
},
}),


]);


return {

pending,

underReview:review,

resolved,

dismissed,

};

}


}
