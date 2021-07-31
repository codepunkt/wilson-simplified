import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { transform } from 'sucrase'
import grayMatter from 'gray-matter'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkToRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import { unified } from 'unified'
import toJsx from '@mapbox/hast-util-to-jsx'

console.log(preact)

const pageSchema = 'page:'
const frontmatterCache = new Map()

export default defineConfig({
  plugins: [
    {
      name: 'routes',
      resolveId(id) {
        return id.startsWith('virtual:routes') ? id : undefined
      },
      async load(id) {
        if (!id.startsWith('virtual:routes')) return
        const code = `
          import { h } from 'preact';
          import { lazy } from 'preact-iso';
          const Page1 = lazy(() => import('page:./src/Page1?selectedTerm=foo&page=1'));
          const Page2 = lazy(() => import('page:./src/Page2?page=2'));
          const Page3 = lazy(() => import('page:./src/page3.md'));
          export default [<Page1 path="/page1" />,<Page2 path="/page2" />,<Page3 path="/page3" />];
        `
        return transform(code, {
          transforms: ['jsx', 'typescript'],
          production: true,
          jsxPragma: 'h',
          jsxFragmentPragma: 'Fragment',
        }).code
      },
    },
    {
      name: 'pages',
      async resolveId(id, importer) {
        if (id.startsWith(pageSchema)) {
          const plainId = id.slice(pageSchema.length)
          const resolution = await this.resolve(plainId, importer, {
            skipSelf: true,
          })
          if (!resolution) return null
          return resolution.id
        }
        return null
      },
    },
    {
      name: 'frontmatter',
      transform(code, id) {
        if (id.match(/\.md$/)) {
          const { content: markdown, data: frontmatter } = grayMatter(code)
          frontmatterCache.set(id, frontmatter)
          return {
            code: markdown,
          }
        }
      },
    },
    {
      name: 'markdown',
      async transform(code, id) {
        const frontmatter = frontmatterCache.get(id)
        console.log({ frontmatter, code })
        const processor = unified()
          .use(remarkParse)
          .use(remarkStringify)
          .use(remarkToRehype, { allowDangerousHtml: true })
          .use(rehypeRaw)
          .use(function stringifyToJsx() {
            this.Compiler = (tree) => toJsx(tree)
          })
        const vfile = await processor.process(code)
        return {
          code: vfile.value.replace(/^<div>/, '<>').replace(/<\/div>$/, '</>'),
        }
      },
    },
    preact.default(),
  ],
})
