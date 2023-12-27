import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Playlist } from "./Playlist";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  login: string;

  @Column()
  password: string;

  @Column()
  username: string;

  @Column()
  avatar: string;

  @ManyToMany(() => Playlist)
  @JoinTable()
  playlists: Playlist[];
}
