// Tables
export { users, type User, type NewUser } from './users.js';
export { accounts, type Account, type NewAccount } from './accounts.js';
export { workspaces, type Workspace, type NewWorkspace } from './workspaces.js';
export { links, type Link, type NewLink } from './links.js';
export { clicks, type Click, type NewClick } from './clicks.js';
export { tags, linkTags, type Tag, type NewTag, type LinkTag, type NewLinkTag } from './tags.js';

// Relations
export {
  usersRelations,
  linksRelations,
  clicksRelations,
  tagsRelations,
  linkTagsRelations,
  accountsRelations,
  workspacesRelations,
} from './relations.js';
