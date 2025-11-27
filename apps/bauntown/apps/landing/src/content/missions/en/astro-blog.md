---
title: "Build a Personal Blog with Astro"
description: "Learn how to create a modern, high-performance blog with Astro and Markdown and publish it for free."
pubDate: 2025-03-25
difficulty: "beginner"
duration: "2-3 hours"
skills: ["Astro", "Markdown", "CSS", "HTML"]
image: "/images/missions/astro-blog.png"
featured: true
status: "active"
category: "Business"
participants: ["Max Miller", "Jane Smith", "Thomas Weber"]
githubRepo: "https://github.com/bauntown/astro-blog-mission"
---

# Build a Personal Blog with Astro

In this mission, you'll create a modern, fast blog with Astro that uses Markdown for content, and publish it for free.

## Mission Objectives

After completing this mission, you will have:

1. Created an Astro web application from scratch
2. Used Markdown for blog posts
3. Implemented a responsive layout structure
4. Added categories and tagging functionality
5. Published your blog for free

## Prerequisites

- Basic HTML, CSS, and JavaScript knowledge
- Basic terminal/command line knowledge
- Node.js and npm installed
- A GitHub account

Don't worry if you don't meet all the prerequisites. This mission is suitable for beginners and includes step-by-step instructions.

## Step 1: Set Up Your Astro Project

Let's start by setting up a new Astro project. Open your terminal and run the following commands:

```bash
# Create a new Astro project
npm create astro@latest my-blog

# Navigate to the project directory
cd my-blog

# Start the development server
npm run dev
```

Visit `http://localhost:3000` in your browser to see your new Astro website.

## Step 2: Create a Blog Layout

Next, let's create a basic layout for our blog. Create a new file at `src/layouts/BlogLayout.astro`:

```astro
---
// src/layouts/BlogLayout.astro
const { title, description } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content={description}>
  <link rel="stylesheet" href="/styles/global.css">
</head>
<body>
  <header>
    <div class="container">
      <a href="/" class="logo">My Blog</a>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/about">About</a></li>
        </ul>
      </nav>
    </div>
  </header>
  
  <main class="container">
    <slot />
  </main>
  
  <footer>
    <div class="container">
      <p>&copy; {new Date().getFullYear()} My Blog. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>
```

Now, create a CSS file for our global styling at `public/styles/global.css`:

```css
/* public/styles/global.css */
:root {
  --color-primary: #3b82f6;
  --color-text: #1f2937;
  --color-text-light: #6b7280;
  --color-bg: #ffffff;
  --color-bg-dark: #f3f4f6;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
}

html {
  font-family: var(--font-sans);
  color: var(--color-text);
  background-color: var(--color-bg);
}

body {
  line-height: 1.6;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

h1, h2, h3, h4, h5, h6 {
  margin: 1.5rem 0 1rem;
  line-height: 1.2;
}

h1 {
  font-size: 2.25rem;
}

p, ul, ol {
  margin-bottom: 1.25rem;
}

.container {
  width: 90%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

header {
  padding: 1.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

nav ul {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
}

nav li {
  margin-left: 1.5rem;
}

nav a {
  color: var(--color-text);
}

footer {
  margin-top: 4rem;
  padding: 2rem 0;
  text-align: center;
  color: var(--color-text-light);
  font-size: 0.875rem;
  border-top: 1px solid #e5e7eb;
}

main {
  min-height: 70vh;
}
```

## Step 3: Create Your First Blog Posts

Now, let's create some blog posts using Markdown. Create a new directory `src/pages/blog/` and add two Markdown files.

Create `src/pages/blog/first-post.md`:

```markdown
---
layout: ../../layouts/BlogPostLayout.astro
title: My First Blog Post
date: 2025-03-01
author: Your Name
description: This is my very first blog post on my new Astro website.
image: /images/first-post.jpg
alt: An image for my first post
tags: ["astro", "blogging", "getting started"]
---

# My First Blog Post

Published on March 1, 2025

Welcome to my first blog post! Here I'll be sharing my experiences with Astro.

## Why I Chose Astro

Astro is a modern static site generator that's perfect for content-focused websites like blogs. Here are some reasons why I chose Astro:

1. **Performance**: Astro only loads the JavaScript that's actually needed
2. **Flexibility**: I can use my preferred UI components
3. **Markdown Integration**: Perfect for blog posts!

```

Create `src/pages/blog/second-post.md`:

```markdown
---
layout: ../../layouts/BlogPostLayout.astro
title: My Second Blog Post
date: 2025-03-10
author: Your Name
description: In this post, I talk about my first few weeks with Astro.
image: /images/second-post.jpg
alt: An image for my second post
tags: ["astro", "progress", "learning"]
---

# My Second Blog Post

Published on March 10, 2025

After a few weeks with Astro, I can say that I'm impressed! The development experience is excellent.

## What I've Learned So Far

- Astro project structure
- Creating components
- Using Markdown for content
- Sharing data between pages

The best part is that the pages load incredibly fast!
```

## Step 4: Create a Blog Post Layout

Now we need a special layout for our blog posts. Create a new file at `src/layouts/BlogPostLayout.astro`:

```astro
---
// src/layouts/BlogPostLayout.astro
import BlogLayout from './BlogLayout.astro';

const { frontmatter } = Astro.props;
const { title, date, author, image, alt, tags, description } = frontmatter;

// Format the date
const formattedDate = new Date(date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
---

<BlogLayout title={title} description={description}>
  <article class="blog-post">
    <div class="post-header">
      <h1>{title}</h1>
      <p class="post-meta">
        Published on {formattedDate} by {author}
      </p>
      
      {tags && (
        <div class="tags">
          {tags.map(tag => (
            <a href={`/tags/${tag}`} class="tag">{tag}</a>
          ))}
        </div>
      )}
    </div>
    
    {image && (
      <div class="featured-image">
        <img src={image} alt={alt || title} />
      </div>
    )}
    
    <div class="post-content">
      <slot />
    </div>
  </article>
</BlogLayout>

<style>
  .blog-post {
    max-width: 700px;
    margin: 0 auto;
  }
  
  .post-header {
    margin-bottom: 2rem;
  }
  
  .post-meta {
    color: var(--color-text-light);
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
  
  .featured-image {
    margin-bottom: 2rem;
  }
  
  .featured-image img {
    width: 100%;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 1rem 0;
  }
  
  .tag {
    background-color: var(--color-bg-dark);
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    text-transform: lowercase;
    color: var(--color-text-light);
  }
  
  .tag:hover {
    background-color: var(--color-primary);
    color: white;
    text-decoration: none;
  }
  
  .post-content {
    line-height: 1.8;
  }
  
  .post-content h2 {
    margin-top: 2rem;
  }
  
  .post-content p {
    margin-bottom: 1.5rem;
  }
  
  .post-content ul,
  .post-content ol {
    padding-left: 1.5rem;
  }
</style>
```

## Step 5: Create a Blog Index Page

Now, let's create an index page for all blog posts. Create a new file at `src/pages/blog/index.astro`:

```astro
---
// src/pages/blog/index.astro
import BlogLayout from '../../layouts/BlogLayout.astro';
import { getCollection } from 'astro:content';

// Collect all Markdown files in the blog directory
const posts = await Astro.glob('./*.md');

// Sort posts by date (newest first)
const sortedPosts = posts.sort((a, b) => {
  return new Date(b.frontmatter.date).valueOf() - 
         new Date(a.frontmatter.date).valueOf();
});
---

<BlogLayout title="Blog" description="Read my latest blog posts">
  <div class="blog-index">
    <h1>Blog</h1>
    <p class="intro">Here you'll find all my blog posts.</p>
    
    <div class="posts">
      {sortedPosts.map(post => (
        <div class="post-card">
          {post.frontmatter.image && (
            <a href={post.url} class="post-image-link">
              <img 
                src={post.frontmatter.image} 
                alt={post.frontmatter.alt || post.frontmatter.title} 
                class="post-image"
              />
            </a>
          )}
          
          <div class="post-content">
            <h2 class="post-title">
              <a href={post.url}>{post.frontmatter.title}</a>
            </h2>
            
            <p class="post-meta">
              {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            
            <p class="post-description">
              {post.frontmatter.description}
            </p>
            
            <a href={post.url} class="read-more">
              Read more
            </a>
          </div>
        </div>
      ))}
    </div>
  </div>
</BlogLayout>

<style>
  .blog-index {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .intro {
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }
  
  .posts {
    display: grid;
    gap: 2rem;
  }
  
  .post-card {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 2rem;
  }
  
  @media (min-width: 640px) {
    .post-card {
      grid-template-columns: 200px 1fr;
    }
  }
  
  .post-image-link {
    display: block;
    overflow: hidden;
    border-radius: 8px;
  }
  
  .post-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .post-image:hover {
    transform: scale(1.05);
  }
  
  .post-title {
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
  }
  
  .post-title a {
    color: var(--color-text);
  }
  
  .post-meta {
    color: var(--color-text-light);
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }
  
  .post-description {
    margin-bottom: 1rem;
  }
  
  .read-more {
    font-weight: 500;
    font-size: 0.875rem;
  }
</style>
```

## Step 6: Create a Home Page

Now, let's create a simple home page. Replace the content of `src/pages/index.astro` with the following:

```astro
---
// src/pages/index.astro
import BlogLayout from '../layouts/BlogLayout.astro';

// Get the latest posts
const posts = await Astro.glob('./blog/*.md');
const recentPosts = posts
  .sort((a, b) => new Date(b.frontmatter.date).valueOf() - new Date(a.frontmatter.date).valueOf())
  .slice(0, 3);
---

<BlogLayout title="My Blog" description="A personal blog about web development, technology, and more">
  <section class="hero">
    <h1>Welcome to My Blog</h1>
    <p>A personal blog about web development, technology, and more.</p>
  </section>
  
  <section class="recent-posts">
    <div class="section-header">
      <h2>Recent Blog Posts</h2>
      <a href="/blog" class="view-all">View all</a>
    </div>
    
    <div class="post-grid">
      {recentPosts.map(post => (
        <div class="post-card">
          {post.frontmatter.image && (
            <a href={post.url}>
              <img 
                src={post.frontmatter.image} 
                alt={post.frontmatter.alt || post.frontmatter.title} 
                class="post-image"
              />
            </a>
          )}
          
          <h3>
            <a href={post.url}>{post.frontmatter.title}</a>
          </h3>
          
          <p class="post-meta">
            {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          
          <p class="post-excerpt">
            {post.frontmatter.description}
          </p>
        </div>
      ))}
    </div>
  </section>
</BlogLayout>

<style>
  .hero {
    padding: 4rem 0;
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .hero h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .hero p {
    font-size: 1.25rem;
    color: var(--color-text-light);
    max-width: 600px;
    margin: 0 auto;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .view-all {
    font-size: 0.875rem;
  }
  
  .post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .post-card {
    display: flex;
    flex-direction: column;
  }
  
  .post-image {
    aspect-ratio: 16 / 9;
    object-fit: cover;
    width: 100%;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .post-excerpt {
    color: var(--color-text-light);
    margin-top: 0.5rem;
    flex-grow: 1;
  }
  
  .post-meta {
    color: var(--color-text-light);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
</style>
```

## Step 7: Create an About Page

Now, let's create a simple "About Me" page. Create a new file at `src/pages/about.astro`:

```astro
---
// src/pages/about.astro
import BlogLayout from '../layouts/BlogLayout.astro';
---

<BlogLayout title="About Me" description="Learn more about me and my blog">
  <section class="about">
    <h1>About Me</h1>
    
    <div class="about-content">
      <div class="about-image">
        <img src="/images/profile.jpg" alt="Profile picture" />
      </div>
      
      <div class="about-text">
        <p>
          Hello! I'm [Your Name], a passionate web developer with an interest in modern technologies and frameworks.
        </p>
        
        <p>
          I created this blog to document my learning experiences and projects. I mainly write about:
        </p>
        
        <ul>
          <li>Web Development</li>
          <li>Frontend Technologies</li>
          <li>Web Design Best Practices</li>
          <li>My Personal Projects</li>
        </ul>
        
        <p>
          If you have any questions or want to get in touch, you can find me on:
        </p>
        
        <div class="social-links">
          <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://twitter.com/yourusername" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="mailto:your.email@example.com">Email</a>
        </div>
      </div>
    </div>
  </section>
</BlogLayout>

<style>
  .about {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .about-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    margin-top: 2rem;
  }
  
  @media (min-width: 768px) {
    .about-content {
      grid-template-columns: 1fr 2fr;
    }
  }
  
  .about-image img {
    width: 100%;
    max-width: 300px;
    border-radius: 8px;
  }
  
  .about-text p {
    margin-bottom: 1.5rem;
  }
  
  .social-links {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .social-links a {
    padding: 0.5rem 1rem;
    background-color: var(--color-primary);
    color: white;
    border-radius: 4px;
    transition: opacity 0.2s ease;
  }
  
  .social-links a:hover {
    opacity: 0.9;
    text-decoration: none;
  }
</style>
```

## Step 8: Add Images

Create a directory for images at `public/images/` and add the following images:
- `first-post.jpg` (for your first blog post)
- `second-post.jpg` (for your second blog post)
- `profile.jpg` (for your About page)

You can use your own images or download sample images from services like [Unsplash](https://unsplash.com/).

## Step 9: Publish Your Site

There are several ways to publish your Astro blog. We'll use [Netlify](https://www.netlify.com/) here since it offers a generous free tier.

1. Create a Git repository for your project:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a repository on GitHub and push your code there

3. Sign in to Netlify or create a new account

4. Click on "New site from Git" and select your GitHub repository

5. Use the following build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

6. Click on "Deploy site"

Netlify will automatically build and publish your site. You'll get a URL like `https://your-site-name.netlify.app` where your blog will be accessible.

## Bonus: Create Tag Pages

As a bonus feature, let's create dynamic pages for tags. Create a new file at `src/pages/tags/[tag].astro`:

```astro
---
// src/pages/tags/[tag].astro
import BlogLayout from '../../layouts/BlogLayout.astro';

export async function getStaticPaths() {
  const posts = await Astro.glob('../blog/*.md');
  
  // Collect all tags
  const allTags = posts.reduce((tags, post) => {
    const postTags = post.frontmatter.tags || [];
    postTags.forEach(tag => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });
    return tags;
  }, []);
  
  // Create a path for each tag
  return allTags.map(tag => {
    // Filter posts that contain this tag
    const filteredPosts = posts.filter(post => 
      post.frontmatter.tags && post.frontmatter.tags.includes(tag)
    );
    
    return {
      params: { tag },
      props: { posts: filteredPosts, tag }
    };
  });
}

const { posts, tag } = Astro.props;
---

<BlogLayout title={`Posts tagged with: ${tag}`} description={`All blog posts tagged with ${tag}`}>
  <div class="tag-page">
    <h1>Posts tagged with: <span class="highlight">{tag}</span></h1>
    
    <div class="posts">
      {posts.map(post => (
        <div class="post-card">
          {post.frontmatter.image && (
            <a href={post.url} class="post-image-link">
              <img 
                src={post.frontmatter.image} 
                alt={post.frontmatter.alt || post.frontmatter.title} 
                class="post-image"
              />
            </a>
          )}
          
          <div class="post-content">
            <h2 class="post-title">
              <a href={post.url}>{post.frontmatter.title}</a>
            </h2>
            
            <p class="post-meta">
              {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            
            <p class="post-description">
              {post.frontmatter.description}
            </p>
            
            <a href={post.url} class="read-more">
              Read more
            </a>
          </div>
        </div>
      ))}
    </div>
    
    <div class="back-link">
      <a href="/blog">← Back to all posts</a>
    </div>
  </div>
</BlogLayout>

<style>
  .tag-page {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .highlight {
    color: var(--color-primary);
  }
  
  .posts {
    display: grid;
    gap: 2rem;
    margin: 2rem 0;
  }
  
  .post-card {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 2rem;
  }
  
  @media (min-width: 640px) {
    .post-card {
      grid-template-columns: 200px 1fr;
    }
  }
  
  .post-image-link {
    display: block;
    overflow: hidden;
    border-radius: 8px;
  }
  
  .post-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .post-image:hover {
    transform: scale(1.05);
  }
  
  .post-title {
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
  }
  
  .post-title a {
    color: var(--color-text);
  }
  
  .post-meta {
    color: var(--color-text-light);
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }
  
  .post-description {
    margin-bottom: 1rem;
  }
  
  .read-more {
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .back-link {
    margin-top: 2rem;
  }
</style>
```

## Congratulations!

You've successfully created a personal blog with Astro and published it! Here are some ideas for further development:

- Add a search function
- Integrate comments with Disqus or Utterances
- Create a contact page with a form
- Implement a dark mode
- Add analytics to track visits

If you have any questions or need help, don't hesitate to create an issue in the mission's GitHub repository or reach out to the community!

Happy Blogging! 🚀