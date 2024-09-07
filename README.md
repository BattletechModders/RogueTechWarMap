# Overview
 
This project is for the rewrite of the Rogue War Online Map. The project is written in React and uses Vite - https://vitejs.dev/guide/

# Setup environment

Setup your local environment
* Install Git.
* Install Git client of choice (SourceTree is good if you don't have a favourite)
* Install a node version manager (e.g. https://github.com/coreybutler/nvm-windows) and node
* Install `yarn` by doing the following
	*  `corepack enable` - enable **corepack**
	*  `corepack yarn` - install **yarn**
* Run `yarn --version`
	* If the command fails to execute, open a powershell window with admin permissions and run
	`Set-ExecutionPolicy RemoteSigned` to set your execution policy.
* `yarn add -D vite` to install vite
* Run `yarn install` to install all the required dependencies

You can run the app locally by running `yarn dev`

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

