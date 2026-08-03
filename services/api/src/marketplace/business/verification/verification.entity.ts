export interface VerificationEntity {

  id:string;

  businessId:string;

  status:string;

  notes?:string | null;

  submittedAt:Date;

  reviewedAt?:Date | null;

  reviewerId?:string | null;

}
