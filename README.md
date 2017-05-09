# vue-webpack-gettext

> Extract and compile translations with vue-gettext and vue-loader, i.e. for .vue files with \<template lang='pug'\>\<\/template\>

## Introduction

[vue-gettext](https://github.com/Polyconseil/vue-gettext) has an example of [Makefile](https://github.com/Polyconseil/vue-gettext/blob/master/Makefile) that demonstrates how to extract and compile translations.

However, it requires own modifications to fit different requirements and is hard to share between projects. Furthermore, it's unable to extract strings from templates if you're using custom template language in vue files.

```
<template lang='pug'>
h1.hero
  translate Please translate me
</template>
```

So, I created this helper library to:

#### 1. Extract strings to be translated into a POT file

Since you're using custom template language, you should already have `vue-loader` and the corresponding compiler, i.e. `pug` in the project. By leveraging those, it will:

1. Use vue-loader's component parser to extract the template content.
1. Use [consolidate.js](https://github.com/tj/consolidate.js/) to compile the content to HTML.
1. Use [easygettext](https://github.com/Polyconseil/easygettext) to extract strings for translation.

#### 2. Compile translated PO files into one or many translation JSON files

`vue-gettext`'s Makefile will group all PO files' content into a single JSON file, which may not be ideal if you only want to load one language at a time (translated strings can be humongous in size).

So this helper will give you an option to split them into a JSON file per language.

## Usage

1. Install GNU gettext tools:
    - MacOS: `brew install gettext && brew link --force gettext`
    - Windows: _need help_
1. `npm install --save-dev vue-webpack-gettext`
1. Ensure that template language engines (that you're using) are installed, i.e. `npm install --save-dev pug`
    - Check [consolidate.js](https://github.com/tj/consolidate.js/) for supported engines
1. To extract: `node node_modules/vue-webpack-gettext/extract --output static/template.pot --src src`
1. To compile: `node node_modules/vue-webpack-gettext/compile --output static/locale --src static/translated --multiple`
1. You can add [npm scripts](https://docs.npmjs.com/misc/scripts) to your project's package.json to ease the tasks execution
