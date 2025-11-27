import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface Playlist {
  category: string;
  name: string;
  path: string;
  urlCount: number;
  urls: string[];
  description?: string;
}

export interface CreatePlaylistDto {
  name: string;
  description?: string;
  urls: string[];
}

@Injectable()
export class PlaylistService {
  private readonly logger = new Logger(PlaylistService.name);
  private readonly playlistsDir: string;

  constructor(private configService: ConfigService) {
    this.playlistsDir =
      this.configService.get<string>('PLAYLISTS_DIR') || './data/playlists';

    // Ensure playlists directory exists
    if (!fs.existsSync(this.playlistsDir)) {
      fs.mkdirSync(this.playlistsDir, { recursive: true });
    }
  }

  async getAll(): Promise<Playlist[]> {
    const playlists: Playlist[] = [];

    if (!fs.existsSync(this.playlistsDir)) {
      return playlists;
    }

    const categories = fs
      .readdirSync(this.playlistsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    for (const category of categories) {
      const categoryPath = path.join(this.playlistsDir, category.name);
      const files = fs
        .readdirSync(categoryPath)
        .filter((f) => f.endsWith('.txt'));

      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        let description: string | undefined;
        const urls: string[] = [];

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ') && !description) {
            description = trimmed.substring(2);
          } else if (trimmed && !trimmed.startsWith('#')) {
            urls.push(trimmed);
          }
        }

        playlists.push({
          category: category.name,
          name: file.replace('.txt', ''),
          path: filePath,
          urlCount: urls.length,
          urls,
          description,
        });
      }
    }

    return playlists;
  }

  async getOne(category: string, name: string): Promise<Playlist> {
    const filePath = path.join(this.playlistsDir, category, `${name}.txt`);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Playlist ${category}/${name} not found`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let description: string | undefined;
    const urls: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ') && !description) {
        description = trimmed.substring(2);
      } else if (trimmed && !trimmed.startsWith('#')) {
        urls.push(trimmed);
      }
    }

    return {
      category,
      name,
      path: filePath,
      urlCount: urls.length,
      urls,
      description,
    };
  }

  async create(dto: CreatePlaylistDto): Promise<Playlist> {
    // Parse category/name format
    const parts = dto.name.split('/');
    const category = parts.length > 1 ? parts[0] : 'general';
    const name = parts.length > 1 ? parts[1] : dto.name;

    const categoryDir = path.join(this.playlistsDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    const filePath = path.join(categoryDir, `${name}.txt`);

    let content = '';
    if (dto.description) {
      content += `# ${dto.description}\n`;
    }
    content += '# One URL per line\n\n';
    content += dto.urls.join('\n') + '\n';

    fs.writeFileSync(filePath, content, 'utf-8');

    this.logger.log(`Created playlist: ${category}/${name}`);

    return {
      category,
      name,
      path: filePath,
      urlCount: dto.urls.length,
      urls: dto.urls,
      description: dto.description,
    };
  }

  async delete(category: string, name: string): Promise<void> {
    const filePath = path.join(this.playlistsDir, category, `${name}.txt`);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Playlist ${category}/${name} not found`);
    }

    fs.unlinkSync(filePath);
    this.logger.log(`Deleted playlist: ${category}/${name}`);
  }

  async addUrl(category: string, name: string, url: string): Promise<Playlist> {
    const playlist = await this.getOne(category, name);
    playlist.urls.push(url);

    const content =
      (playlist.description ? `# ${playlist.description}\n` : '') +
      '# One URL per line\n\n' +
      playlist.urls.join('\n') +
      '\n';

    fs.writeFileSync(playlist.path, content, 'utf-8');

    playlist.urlCount = playlist.urls.length;
    return playlist;
  }
}
