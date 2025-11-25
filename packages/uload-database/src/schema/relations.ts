import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { links } from './links.js';
import { clicks } from './clicks.js';
import { tags, linkTags } from './tags.js';
import { accounts } from './accounts.js';
import { workspaces } from './workspaces.js';

export const usersRelations = relations(users, ({ many }) => ({
  links: many(links),
  tags: many(tags),
  ownedAccounts: many(accounts),
  ownedWorkspaces: many(workspaces),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, { fields: [links.userId], references: [users.id] }),
  account: one(accounts, {
    fields: [links.accountOwner],
    references: [accounts.id],
  }),
  workspace: one(workspaces, {
    fields: [links.workspaceId],
    references: [workspaces.id],
  }),
  clicks: many(clicks),
  linkTags: many(linkTags),
}));

export const clicksRelations = relations(clicks, ({ one }) => ({
  link: one(links, { fields: [clicks.linkId], references: [links.id] }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  linkTags: many(linkTags),
}));

export const linkTagsRelations = relations(linkTags, ({ one }) => ({
  link: one(links, { fields: [linkTags.linkId], references: [links.id] }),
  tag: one(tags, { fields: [linkTags.tagId], references: [tags.id] }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  owner: one(users, { fields: [accounts.owner], references: [users.id] }),
  links: many(links),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.owner], references: [users.id] }),
  links: many(links),
}));
