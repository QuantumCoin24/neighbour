import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { OrganisationController } from './organisation.controller';

import { OrganisationService } from './organisation.service';

import { OrganisationRepository } from './organisation.repository';

import { PrismaOrganisationRepository } from './prisma-organisation.repository';

import { OrganisationMemberController } from './members/member.controller';

import { OrganisationMemberService } from './members/member.service';

import { OrganisationMemberRepository } from './members/member.repository';

import { PrismaOrganisationMemberRepository } from './members/prisma-member.repository';

import { OrganisationRoleController } from './roles/role.controller';

import { OrganisationRoleService } from './roles/role.service';

import { OrganisationRoleRepository } from './roles/role.repository';

import { PrismaOrganisationRoleRepository } from './roles/prisma-role.repository';

import { OrganisationPermissionController } from './roles/permission.controller';

import { OrganisationPermissionService } from './roles/permission.service';

import { OrganisationPermissionRepository } from './roles/permission.repository';

import { PrismaOrganisationPermissionRepository } from './roles/prisma-permission.repository';

import { OrganisationBusinessController } from './businesses/business-link.controller';

import { OrganisationBusinessService } from './businesses/business-link.service';

import { OrganisationBusinessRepository } from './businesses/business-link.repository';

import { PrismaOrganisationBusinessRepository } from './businesses/prisma-business-link.repository';

import { OrganisationDashboardController } from './dashboard/organisation-dashboard.controller';

import { OrganisationDashboardService } from './dashboard/organisation-dashboard.service';

import { OrganisationVerificationController } from './verification/verification.controller';

import { OrganisationVerificationService } from './verification/verification.service';

import { OrganisationVerificationRepository } from './verification/verification.repository';

import { PrismaOrganisationVerificationRepository } from './verification/prisma-verification.repository';



@Module({

imports:[
DatabaseModule,
],


controllers:[
OrganisationController,
OrganisationMemberController,
OrganisationRoleController,
OrganisationPermissionController,
OrganisationBusinessController,
OrganisationDashboardController,
OrganisationVerificationController,
],


providers:[

OrganisationService,

OrganisationMemberService,

OrganisationRoleService,

OrganisationPermissionService,

OrganisationBusinessService,

OrganisationDashboardService,

OrganisationVerificationService,

{
provide:OrganisationRepository,
useClass:PrismaOrganisationRepository,
},

{
provide:OrganisationMemberRepository,
useClass:PrismaOrganisationMemberRepository,
},

{
provide:OrganisationRoleRepository,
useClass:PrismaOrganisationRoleRepository,
},

{
provide:OrganisationPermissionRepository,
useClass:PrismaOrganisationPermissionRepository,
},

{
provide:OrganisationBusinessRepository,
useClass:PrismaOrganisationBusinessRepository,
},

{
provide:OrganisationVerificationRepository,
useClass:PrismaOrganisationVerificationRepository,
},

],


exports:[
OrganisationService,

OrganisationMemberService,

OrganisationRoleService,

OrganisationPermissionService,

OrganisationBusinessService,

OrganisationDashboardService,

OrganisationVerificationService,
],

})
export class OrganisationModule {}
