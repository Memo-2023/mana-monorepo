# Community Features Implementation Plan

## Märchenzauber - Story & Character Sharing System

### Overview

Erweiterung der Märchenzauber App um Community-Features: Publishing, Voting, Collections und Character-Sharing.

---

## 1. Database Schema Changes

### 1.1 Stories Table Extensions

```sql
ALTER TABLE stories ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN published_at TIMESTAMPTZ;
ALTER TABLE stories ADD COLUMN publish_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN vote_count INTEGER DEFAULT 0;
ALTER TABLE stories ADD COLUMN featured_score DECIMAL DEFAULT 0;
```

### 1.2 Characters Table Extensions

```sql
ALTER TABLE characters ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE characters ADD COLUMN published_at TIMESTAMPTZ;
ALTER TABLE characters ADD COLUMN share_code VARCHAR(12) UNIQUE;
ALTER TABLE characters ADD COLUMN total_vote_score INTEGER DEFAULT 0;
ALTER TABLE characters ADD COLUMN stories_count INTEGER DEFAULT 0;
ALTER TABLE characters ADD COLUMN sharing_preference VARCHAR(20) DEFAULT 'private'
  CHECK (sharing_preference IN ('private', 'link_only', 'public', 'commons'));
ALTER TABLE characters ADD COLUMN original_creator_id TEXT;
ALTER TABLE characters ADD COLUMN original_character_id UUID;
```

### 1.3 New Tables

#### Story Collections

```sql
CREATE TABLE story_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('official', 'community', 'seasonal', 'contest')),
    is_official BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    icon_url TEXT,
    banner_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE collection_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES story_collections(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    position INTEGER DEFAULT 0,
    added_by TEXT,
    UNIQUE(collection_id, story_id)
);
```

#### Character Collections

```sql
CREATE TABLE character_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    is_official BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collection_characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES character_collections(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    position INTEGER DEFAULT 0,
    UNIQUE(collection_id, character_id)
);
```

#### Voting System

```sql
CREATE TABLE story_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    vote_type VARCHAR(20) DEFAULT 'like' CHECK (vote_type IN ('like', 'love', 'star')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

CREATE TABLE character_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    vote_type VARCHAR(20) DEFAULT 'like',
    source VARCHAR(20) DEFAULT 'direct' CHECK (source IN ('direct', 'story')),
    story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(character_id, user_id, COALESCE(story_id, '00000000-0000-0000-0000-000000000000'::uuid))
);
```

#### Character Usage Tracking

```sql
CREATE TABLE character_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_character_id UUID NOT NULL REFERENCES characters(id),
    user_id TEXT NOT NULL,
    story_id UUID REFERENCES stories(id),
    usage_type VARCHAR(20) CHECK (usage_type IN ('imported', 'public', 'shared')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 2. Row Level Security (RLS) Policies

### 2.1 Published Content Visibility

```sql
-- Published stories visible to all
CREATE POLICY "published_stories_visible" ON stories
    FOR SELECT USING (is_published = true OR user_id = auth.uid()::text);

-- Published characters visible to all
CREATE POLICY "published_characters_visible" ON characters
    FOR SELECT USING (
        is_published = true
        OR sharing_preference IN ('public', 'commons')
        OR user_id = auth.uid()::text
    );

-- Voting accessible to authenticated users
CREATE POLICY "authenticated_users_can_vote" ON story_votes
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_can_see_votes" ON story_votes
    FOR SELECT USING (true);
```

---

## 3. Database Functions & Triggers

### 3.1 Story Vote Cascade to Character

```sql
CREATE OR REPLACE FUNCTION cascade_story_vote_to_character()
RETURNS TRIGGER AS $$
BEGIN
    -- Add vote to character
    INSERT INTO character_votes (character_id, user_id, vote_type, source, story_id)
    SELECT s.character_id, NEW.user_id, NEW.vote_type, 'story', NEW.story_id
    FROM stories s
    WHERE s.id = NEW.story_id AND s.character_id IS NOT NULL
    ON CONFLICT (character_id, user_id, COALESCE(story_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO NOTHING;

    -- Update character vote score
    UPDATE characters c
    SET total_vote_score = (
        SELECT COUNT(*) FROM character_votes WHERE character_id = c.id
    )
    WHERE c.id = (SELECT character_id FROM stories WHERE id = NEW.story_id);

    -- Update story vote count
    UPDATE stories
    SET vote_count = vote_count + 1
    WHERE id = NEW.story_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER story_vote_cascade_trigger
AFTER INSERT ON story_votes
FOR EACH ROW
EXECUTE FUNCTION cascade_story_vote_to_character();
```

### 3.2 Auto-generate Share Code

```sql
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 3.3 Update Story Count for Characters

```sql
CREATE OR REPLACE FUNCTION update_character_story_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE characters
    SET stories_count = (
        SELECT COUNT(*) FROM stories WHERE character_id = NEW.character_id
    )
    WHERE id = NEW.character_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_character_stats
AFTER INSERT ON stories
FOR EACH ROW
WHEN (NEW.character_id IS NOT NULL)
EXECUTE FUNCTION update_character_story_count();
```

---

## 4. Automatic Collections Management

### 4.1 Weekly Story Collection

```sql
-- Function to create weekly story collection
CREATE OR REPLACE FUNCTION create_weekly_story_collection()
RETURNS void AS $$
DECLARE
    collection_id UUID;
    week_number INTEGER;
BEGIN
    week_number := EXTRACT(WEEK FROM CURRENT_DATE);

    -- Create collection
    INSERT INTO story_collections (name, description, type, is_official)
    VALUES (
        'Story der Woche KW ' || week_number || ' ' || EXTRACT(YEAR FROM CURRENT_DATE),
        'Die beliebteste Geschichte dieser Woche',
        'contest',
        true
    )
    RETURNING id INTO collection_id;

    -- Add top voted story
    INSERT INTO collection_stories (collection_id, story_id, position)
    SELECT
        collection_id,
        s.id,
        1
    FROM stories s
    WHERE s.is_published = true
        AND s.published_at >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY s.vote_count DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. API Endpoints (Backend)

### 5.1 Story Publishing

- `POST /api/stories/:id/publish` - Publish a story
- `GET /api/stories/public` - Get all public stories
- `GET /api/stories/trending` - Get trending stories

### 5.2 Character Sharing

- `POST /api/characters/:id/share` - Generate share code
- `GET /api/characters/shared/:shareCode` - Get character by share code
- `POST /api/characters/:id/publish` - Publish character
- `POST /api/characters/:id/import` - Import shared character

### 5.3 Voting

- `POST /api/stories/:id/vote` - Vote for story
- `DELETE /api/stories/:id/vote` - Remove vote
- `POST /api/characters/:id/vote` - Vote for character
- `GET /api/stories/:id/votes` - Get vote count

### 5.4 Collections

- `GET /api/collections/stories` - Get story collections
- `GET /api/collections/characters` - Get character collections
- `GET /api/collections/:id/content` - Get collection content

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1-2)

1. Database schema updates
2. RLS policies
3. Basic publishing for stories
4. Simple voting system

### Phase 2: Character Sharing (Week 3-4)

1. Character publishing
2. Share code generation
3. Character import functionality
4. Usage tracking

### Phase 3: Collections (Week 5-6)

1. Collection tables and management
2. Automatic weekly collections
3. Admin tools for curation
4. Collection browsing UI

### Phase 4: Advanced Features (Week 7-8)

1. Trending algorithms
2. Recommendation system
3. Creator profiles
4. Achievement system

---

## 7. Mobile App UI Changes

### 7.1 New Screens

- **Discover**: Browse public stories and characters
- **Collections**: View curated collections
- **Voting**: Heart/star buttons on stories
- **Share Modal**: Share code display and import

### 7.2 Profile Additions

- "My Published Stories" section
- "My Published Characters" section
- Vote statistics
- Achievement badges

### 7.3 Navigation Updates

- New "Community" tab in bottom navigation
- Share buttons on story/character detail views
- Import character option in character creation

---

## 8. Admin Dashboard Requirements

### 8.1 Content Moderation

- Review published content
- Remove inappropriate content
- Feature/unfeature stories

### 8.2 Collection Management

- Create/edit collections
- Add/remove stories from collections
- Schedule seasonal collections

### 8.3 Analytics

- Vote trends
- Popular characters tracking
- User engagement metrics

---

## 9. Privacy & Safety Considerations

### 9.1 Content Guidelines

- Age-appropriate content only
- No personal information in stories
- Copyright respect for characters

### 9.2 Moderation Tools

- Report button for inappropriate content
- Automatic content scanning
- User blocking functionality

### 9.3 Data Protection

- Anonymous voting
- Optional creator attribution
- GDPR compliance for shared content

---

## 10. Success Metrics

### 10.1 Engagement KPIs

- Daily active voters
- Stories published per week
- Character reuse rate
- Collection browse rate

### 10.2 Quality Metrics

- Average votes per story
- Repeat character usage
- Time spent in collections
- User retention after publishing

---

## 11. Future Enhancements

### 11.1 Monetization Options

- Premium collections
- Character marketplace
- Story printing service
- Creator tips/donations

### 11.2 Social Features

- Follow creators
- Comments on stories
- Story remixes
- Collaborative stories

### 11.3 Gamification

- Creator levels
- Writing challenges
- Seasonal events
- Achievement system

---

## Technical Notes

- Use database indexes on frequently queried fields (is_published, vote_count)
- Implement caching for popular stories/characters
- Consider CDN for shared character images
- Add rate limiting for voting endpoints
- Implement soft delete for moderation
