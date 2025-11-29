Add last modified time
Learn how to build a remark plugin that adds the last modified time to the frontmatter of your Markdown and MDX files. Use this property to display the modified time in your pages.

Uses Git history

This recipe calculates time based on your repository’s Git history and may not be accurate on some deployment platforms. Your host may be performing shallow clones which do not retrieve the full git history.

Recipe
Install Helper Packages

Install Day.js to modify and format times:

npm
pnpm
Yarn
Terminal window
npm install dayjs

Create a Remark Plugin

This plugin uses execSync to run a Git command that returns the timestamp of the latest commit in ISO 8601 format. The timestamp is then added to the frontmatter of the file.

remark-modified-time.mjs
import { execSync } from "child_process";

export function remarkModifiedTime() {
return function (tree, file) {
const filepath = file.history[0];
const result = execSync(`git log -1 --pretty="format:%cI" "${filepath}"`);
file.data.astro.frontmatter.lastModified = result.toString();
};
}

Using the file system instead of Git
Add the plugin to your config

astro.config.mjs
import { defineConfig } from 'astro/config';
import { remarkModifiedTime } from './remark-modified-time.mjs';

export default defineConfig({
markdown: {
remarkPlugins: [remarkModifiedTime],
},
});

Now all Markdown documents will have a lastModified property in their frontmatter.

Display Last Modified Time

If your content is stored in a content collection, access the remarkPluginFrontmatter from the render(entry) function. Then render lastModified in your template wherever you would like it to appear.

## src/pages/posts/[slug].astro

import { getCollection, render } from 'astro:content';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export async function getStaticPaths() {
const blog = await getCollection('blog');
return blog.map(entry => ({
params: { slug: entry.id },
props: { entry },
}));
}

const { entry } = Astro.props;
const { Content, remarkPluginFrontmatter } = await render(entry);

const lastModified = dayjs(remarkPluginFrontmatter.lastModified)
.utc()
.format("HH:mm:ss DD MMMM YYYY UTC");

---

<html>
  <head>...</head>
  <body>
    ...
    <p>Last Modified: {lastModified}</p>
    ...
  </body>
</html>

If you’re using a Markdown layout, use the lastModified frontmatter property from Astro.props in your layout template.

## src/layouts/BlogLayout.astro

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const lastModified = dayjs()
.utc(Astro.props.frontmatter.lastModified)
.format("HH:mm:ss DD MMMM YYYY UTC");

---

<html>
  <head>...</head>
  <body>
    <p>{lastModified}</p>
    <slot />
  </body>
</html>
