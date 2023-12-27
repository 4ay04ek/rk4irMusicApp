CREATE DATABASE musicapp;

CREATE SEQUENCE IF NOT EXISTS public.playlist_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.track_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.user_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.playlist
(
    private boolean NOT NULL,
    id integer NOT NULL DEFAULT nextval('playlist_id_seq'::regclass),
    title character varying COLLATE pg_catalog."default" NOT NULL,
    thumbnail character varying COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "PK_538c2893e2024fabc7ae65ad142" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.track
(
    id integer NOT NULL DEFAULT nextval('track_id_seq'::regclass),
    url character varying COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "PK_0631b9bcf521f8fab3a15f2c37e" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.playlist_tracks_track
(
    "playlistId" integer NOT NULL,
    "trackId" integer NOT NULL,
    CONSTRAINT "PK_b1696ca1b814cd664fc3e50dbbc" PRIMARY KEY ("playlistId", "trackId"),
    CONSTRAINT "FK_53e780b9e2955ef02466636cda7" FOREIGN KEY ("playlistId")
        REFERENCES public.playlist (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "FK_54dd1e92dd268df3dcc0cbb643c" FOREIGN KEY ("trackId")
        REFERENCES public.track (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IDX_53e780b9e2955ef02466636cda"
    ON public.playlist_tracks_track USING btree
    ("playlistId" ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS "IDX_54dd1e92dd268df3dcc0cbb643"
    ON public.playlist_tracks_track USING btree
    ("trackId" ASC NULLS LAST)
    TABLESPACE pg_default;


CREATE TABLE IF NOT EXISTS public."user"
(
    id integer NOT NULL DEFAULT nextval('user_id_seq'::regclass),
    login character varying COLLATE pg_catalog."default" NOT NULL,
    password character varying COLLATE pg_catalog."default" NOT NULL,
    avatar character varying COLLATE pg_catalog."default" NOT NULL,
    username character varying COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_playlists_playlist
(
    "userId" integer NOT NULL,
    "playlistId" integer NOT NULL,
    CONSTRAINT "PK_2fc6689076fa6692babf56969ac" PRIMARY KEY ("userId", "playlistId"),
    CONSTRAINT "FK_a15d6a6bcd37b4ea765fe980642" FOREIGN KEY ("userId")
        REFERENCES public."user" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "FK_d374b3f7f7148b196a31d57253a" FOREIGN KEY ("playlistId")
        REFERENCES public.playlist (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IDX_a15d6a6bcd37b4ea765fe98064"
    ON public.user_playlists_playlist USING btree
    ("userId" ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS "IDX_d374b3f7f7148b196a31d57253"
    ON public.user_playlists_playlist USING btree
    ("playlistId" ASC NULLS LAST)
    TABLESPACE pg_default;