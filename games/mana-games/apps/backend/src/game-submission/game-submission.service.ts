import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubmitGameDto, SubmitGameResponseDto } from './dto/submit-game.dto';

@Injectable()
export class GameSubmissionService {
  private readonly logger = new Logger(GameSubmissionService.name);

  constructor(private readonly configService: ConfigService) {}

  async submitGame(dto: SubmitGameDto): Promise<SubmitGameResponseDto> {
    const githubToken = this.configService.get<string>('GITHUB_TOKEN');
    const githubOwner = this.configService.get<string>('GITHUB_OWNER') || 'tillschneider';
    const githubRepo = this.configService.get<string>('GITHUB_REPO') || 'mana-games';

    if (!githubToken) {
      this.logger.error('GitHub token not configured');
      throw new InternalServerErrorException('Server configuration error - GitHub token missing');
    }

    // Generate safe file names
    const gameSlug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const timestamp = Date.now();
    const branchName = `community-game-${gameSlug}-${timestamp}`;

    const headers = {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    try {
      // 1. Get the default branch
      this.logger.log(`Fetching repo: ${githubOwner}/${githubRepo}`);
      const repoResponse = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}`, { headers });

      if (!repoResponse.ok) {
        const errorBody = await repoResponse.text();
        this.logger.error('GitHub API Error:', { status: repoResponse.status, body: errorBody });
        throw new InternalServerErrorException(`Failed to fetch repository info: ${repoResponse.status}`);
      }

      const repoData = await repoResponse.json();
      const defaultBranch = repoData.default_branch;

      // 2. Get the latest commit SHA from the default branch
      const refResponse = await fetch(
        `https://api.github.com/repos/${githubOwner}/${githubRepo}/git/refs/heads/${defaultBranch}`,
        { headers },
      );

      if (!refResponse.ok) {
        throw new InternalServerErrorException('Failed to fetch branch info');
      }

      const refData = await refResponse.json();
      const baseSha = refData.object.sha;

      // 3. Create a new branch
      const createBranchResponse = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      });

      if (!createBranchResponse.ok) {
        throw new InternalServerErrorException('Failed to create branch');
      }

      // 4. Prepare game data
      const nextId = String(Date.now());
      const gameData = {
        id: nextId,
        title: dto.title,
        description: dto.description,
        slug: gameSlug,
        htmlFile: `/games/${gameSlug}.html`,
        thumbnail: `/screenshots/${gameSlug}.jpg`,
        tags: dto.tags,
        difficulty: dto.difficulty,
        complexity: dto.complexity,
        controls: dto.controls,
        community: true,
        author: dto.author.name,
        submittedAt: dto.submittedAt,
      };

      // 5. Create files
      const filesToCreate = [
        {
          path: `public/games/${gameSlug}.html`,
          content: dto.files.html.content,
          encoding: 'utf-8' as const,
        },
        {
          path: `public/screenshots/${gameSlug}.jpg`,
          content: dto.files.screenshot.content.split(',')[1], // Remove data:image/jpeg;base64,
          encoding: 'base64' as const,
        },
      ];

      // Fetch existing community games
      const communityGamesPath = 'src/data/community-games.json';
      let communityGames: any[] = [];

      try {
        const existingFileResponse = await fetch(
          `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${communityGamesPath}?ref=${defaultBranch}`,
          { headers },
        );

        if (existingFileResponse.ok) {
          const existingFile = await existingFileResponse.json();
          const content = Buffer.from(existingFile.content, 'base64').toString('utf-8');
          communityGames = JSON.parse(content);
        }
      } catch {
        // File doesn't exist yet
      }

      communityGames.push(gameData);

      filesToCreate.push({
        path: communityGamesPath,
        content: JSON.stringify(communityGames, null, 2),
        encoding: 'utf-8',
      });

      // Create all files
      for (const file of filesToCreate) {
        const fileContent =
          file.encoding === 'base64' ? file.content : Buffer.from(file.content).toString('base64');

        const createFileResponse = await fetch(
          `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${file.path}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              message: `Add community game: ${dto.title}`,
              content: fileContent,
              branch: branchName,
            }),
          },
        );

        if (!createFileResponse.ok) {
          const error = await createFileResponse.text();
          this.logger.error(`Failed to create file ${file.path}:`, error);
          throw new InternalServerErrorException(`Failed to create file ${file.path}`);
        }
      }

      // 6. Create pull request
      const prBody = `## Neues Community-Spiel: ${dto.title}

### Spiel-Details
- **Autor:** ${dto.author.name}${dto.author.github ? ` (@${dto.author.github})` : ''}
- **Beschreibung:** ${dto.description}
- **Schwierigkeit:** ${dto.difficulty}
- **Komplexität:** ${dto.complexity}
- **Steuerung:** ${dto.controls}
- **Tags:** ${dto.tags.join(', ')}

### Dateien
- HTML: \`public/games/${gameSlug}.html\`
- Screenshot: \`public/screenshots/${gameSlug}.jpg\`

### Checkliste für Review
- [ ] Spiel funktioniert einwandfrei
- [ ] Keine externen Abhängigkeiten oder Sicherheitsprobleme
- [ ] Familienfreundlicher Inhalt
- [ ] Screenshot zeigt das Spiel korrekt
- [ ] postMessage Integration vorhanden (optional)

---
*Eingereicht am: ${new Date(dto.submittedAt).toLocaleString('de-DE')}*
${dto.author.email ? `*Kontakt: ${dto.author.email}*` : ''}`;

      const prResponse = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: `Community: ${dto.title}`,
          body: prBody,
          head: branchName,
          base: defaultBranch,
        }),
      });

      if (!prResponse.ok) {
        const error = await prResponse.text();
        this.logger.error('Failed to create PR:', error);
        throw new InternalServerErrorException('Failed to create pull request');
      }

      const prData = await prResponse.json();

      return {
        success: true,
        message: 'Game submitted successfully',
        prUrl: prData.html_url,
        prNumber: prData.number,
      };
    } catch (error: any) {
      this.logger.error('Submission error:', error);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to submit game: ' + (error.message || 'Unknown error'));
    }
  }
}
