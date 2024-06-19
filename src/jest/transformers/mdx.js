/**
 * Jest transformer for MD/MDX files
 *
 * Based on:
 *
 * - https://github.com/frontarm/mdx-util/blob/bf1e8872c50e1726665b3df769ced34144d06d41/packages/mdx-loader/index.js
 * - https://github.com/bitttttten/jest-transformer-mdx/blob/df1d773ac3db91114519f9202773b2ee7b5ccddb/cra.js
 * - https://github.com/facebook/jest/blob/3cdbd556948b4974b2cc23178977eb159d343df8/packages/babel-jest/src/index.ts
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const readingTime = require("reading-time");
const emoji = require("remark-emoji");
const images = require("remark-images");
const textr = require("remark-textr");
const slug = require("remark-slug");
const mdx = require("@mdx-js/mdx");
const mdxTableOfContents = require("mdx-table-of-contents");
const mdxExportJSONByDefault = require("mdx-constant");
const grayMatter = require("gray-matter");
const typography = require("mdx-loader/typography");
const rehypePrism = require("mdx-loader/prism");
const babel = require("@babel/core");

const THIS_FILE = fs.readFileSync(__filename);

const createTransformer = (mdxOptions) => {
  const options = {
    remarkPlugins: [slug, images, emoji, [textr, { plugins: [typography] }]],
    rehypePlugins: [rehypePrism],
    compilers: [mdxTableOfContents],
    ...mdxOptions,
  };

  return {
    canInstrument: false,
    getCacheKey(fileData, filename, configString, { instrument, rootDir }) {
      return crypto
        .createHash("md5")
        .update(THIS_FILE)
        .update("\0", "utf8")
        .update(JSON.stringify(options))
        .update("\0", "utf8")
        .update(fileData)
        .update("\0", "utf8")
        .update(path.relative(rootDir, filename))
        .update("\0", "utf8")
        .update(configString)
        .update("\0", "utf8")
        .update(instrument ? "instrument" : "")
        .update("\0", "utf8")
        .update(process.env.NODE_ENV || "")
        .update("\0", "utf8")
        .update(process.env.BABEL_ENV || "")
        .digest("hex");
    },
    process(src, filename, transformOptions) {
      const { data, content: mdxContent } = grayMatter(src);

      const newMdxOptions = {
        ...options,
        ...transformOptions,
        filepath: filename,
      };

      newMdxOptions.plugins = (newMdxOptions.plugins || []).concat([
        mdxExportJSONByDefault("frontMatter", data),
      ]);

      const result = mdx.sync(mdxContent, newMdxOptions);

      const estimatedReadingTime = readingTime(src);

      const toTransform = `
import React from 'react'
import { mdx } from '@mdx-js/react'
export const readingTime = ${JSON.stringify(estimatedReadingTime)}
${result}
`;
      const transformResult = babel.transformSync(toTransform, {
        presets: [require.resolve("babel-preset-react-app")],
        babelrc: false,
        configFile: false,
        filename: "null",
      });

      if (transformResult) {
        const { code, map } = transformResult;

        if (typeof code === "string") {
          return { code, map };
        }
      }

      return toTransform;
    },
  };
};

module.exports = {
  ...createTransformer(),
  // Assigned here so only the exported transformer has `createTransformer`,
  // instead of all created transformers by the function
  createTransformer,
};
