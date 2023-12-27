import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Track {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;
}
