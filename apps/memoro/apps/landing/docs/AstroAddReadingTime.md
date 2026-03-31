Add reading time
Create a remark plugin which adds a reading time property to the frontmatter of your Markdown or MDX files. Use this property to display the reading time for each page.

Recipe
Install Helper Packages

Install these two helper packages:

reading-time to calculate minutes read
mdast-util-to-string to extract all text from your markdown
npm
pnpm
Yarn
Terminal window
npm install reading-time mdast-util-to-string

Create a remark plugin.

This plugin uses the mdast-util-to-string package to get the Markdown file’s text. This text is then passed to the reading-time package to calculate the reading time in minutes.

remark-reading-time.mjs
import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function remarkReadingTime() {
  return function (tree, { data }) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    // readingTime.text will give us minutes read as a friendly string,
    // i.e. "3 min read"
    data.astro.frontmatter.minutesRead = readingTime.text;
  };
}

Add the plugin to your config:

astro.config.mjs
import { defineConfig } from 'astro/config';
import { remarkReadingTime } from './remark-reading-time.mjs';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
});

Now all Markdown documents will have a calculated minutesRead property in their frontmatter.

Display Reading Time

If your blog posts are stored in a content collection, access the remarkPluginFrontmatter from the render(entry) function. Then, render minutesRead in your template wherever you would like it to appear.

src/pages/posts/[slug].astro
---
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const blog = await getCollection('blog');
  return blog.map(entry => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content, remarkPluginFrontmatter } = await render(entry);
---

<html>
  <head>...</head>
  <body>
    ...
    <p>{remarkPluginFrontmatter.minutesRead}</p>
    ...
  </body>
</html>

If you’re using a Markdown layout, use the minutesRead frontmatter property from Astro.props in your layout template.

src/layouts/BlogLayout.astro
---
const { minutesRead } = Astro.props.frontmatter;
---

<html>
  <head>...</head>
  <body>
    <p>{minutesRead}</p>
    <slot />
  </body>
</html>