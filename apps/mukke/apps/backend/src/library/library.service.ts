import { Injectable, Inject } from '@nestjs/common';
import { eq, and, asc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { songs } from '../db/schema';

@Injectable()
export class LibraryService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async getAlbums(userId: string) {
		const result = await this.db.execute<{
			album: string;
			albumArtist: string | null;
			year: number | null;
			coverArtPath: string | null;
			songCount: number;
		}>(sql`
			SELECT album, album_artist as "albumArtist", MIN(year) as year,
				MIN(cover_art_path) as "coverArtPath", COUNT(*)::int as "songCount"
			FROM songs WHERE user_id = ${userId} AND album IS NOT NULL
			GROUP BY album, album_artist ORDER BY album
		`);
		return result;
	}

	async getArtists(userId: string) {
		const result = await this.db.execute<{
			artist: string;
			songCount: number;
			albumCount: number;
		}>(sql`
			SELECT artist, COUNT(*)::int as "songCount",
				COUNT(DISTINCT album)::int as "albumCount"
			FROM songs WHERE user_id = ${userId} AND artist IS NOT NULL
			GROUP BY artist ORDER BY artist
		`);
		return result;
	}

	async getGenres(userId: string) {
		const result = await this.db.execute<{
			genre: string;
			songCount: number;
		}>(sql`
			SELECT genre, COUNT(*)::int as "songCount"
			FROM songs WHERE user_id = ${userId} AND genre IS NOT NULL
			GROUP BY genre ORDER BY genre
		`);
		return result;
	}

	async getStats(userId: string) {
		const result = await this.db.execute<{
			totalSongs: number;
			totalArtists: number;
			totalAlbums: number;
			totalGenres: number;
			totalDuration: number;
			totalPlays: number;
		}>(sql`
			SELECT COUNT(*)::int as "totalSongs",
				COUNT(DISTINCT artist)::int as "totalArtists",
				COUNT(DISTINCT album)::int as "totalAlbums",
				COUNT(DISTINCT genre)::int as "totalGenres",
				COALESCE(SUM(duration), 0)::real as "totalDuration",
				COALESCE(SUM(play_count), 0)::int as "totalPlays"
			FROM songs WHERE user_id = ${userId}
		`);
		return result[0];
	}

	async getSongsByAlbum(userId: string, albumName: string) {
		return this.db
			.select()
			.from(songs)
			.where(and(eq(songs.userId, userId), eq(songs.album, albumName)))
			.orderBy(asc(songs.trackNumber));
	}

	async getSongsByArtist(userId: string, artistName: string) {
		return this.db
			.select()
			.from(songs)
			.where(and(eq(songs.userId, userId), eq(songs.artist, artistName)))
			.orderBy(asc(songs.title));
	}

	async getSongsByGenre(userId: string, genreName: string) {
		return this.db
			.select()
			.from(songs)
			.where(and(eq(songs.userId, userId), eq(songs.genre, genreName)))
			.orderBy(asc(songs.title));
	}
}
