import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Request {
  @PrimaryKey()
  id: string = uuidv4();

  @Property()
  timestamp: Date = new Date();

  @Property()
  method!: string;

  @Property()
  url!: string;

  @Property({ type: 'text', nullable: true })
  requestBody?: string;

  @Property({ type: 'text', nullable: true })
  responseBody?: string;

  @Property()
  statusCode!: number;
}