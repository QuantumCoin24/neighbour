export interface CommandEntity {

  id: string;

  type: string;

  payload: unknown;

  status: 'created' | 'executed' | 'failed';

  createdAt: Date;

}
