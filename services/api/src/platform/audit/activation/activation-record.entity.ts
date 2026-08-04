export interface ActivationRecordEntity {
  domain: string;

  service: boolean;

  module: boolean;

  controller: boolean;

  database: boolean;

  status: string;
}
