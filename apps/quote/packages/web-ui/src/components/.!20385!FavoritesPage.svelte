<script lang="ts" generics="T extends ContentItem">
  import type { ContentItem, AppConfig } from '@quote/shared';
  import ContentCard from './ContentCard.svelte';
  import { toast } from '../stores/toast';

  interface Props {
    config: AppConfig;
    allContent: T[];
    allAuthors: any[];
    favoriteStorageKey: string;
    contentTypeSingular: string; // "Zitat", "Sprichwort", "Gedicht"
