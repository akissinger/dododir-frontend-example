# Dododir example frontend

This project shows an example web application based on the project/file backend [Dododir](https://github.com/akissinger/dododir) and [Preact](https://preactjs.com/). It allows users to register new accounts, create projects, and create/edit files within those projects. For editing, it uses a [CodeMirror](https://codemirror.net/) editor configured for Markdown syntax highlighting. It is deliberately minimal. Feel free to clone it and modify it as you see fit.

To run the example:

```bash
git clone https://github.com/akissinger/dododir-frontend-example.git
cd dododir-frontend-example
npm install
npm run build
cp .env.example .env
```

Then, edit the `.env` file to set a `JWT_SECRET` value. This should be a long, random string that is used to sign authentication tokens. For example, you can generate one with `openssl rand -base64 32`. After that, you can fire the server up with `npm start` and navigate to `http://localhost:3001` in your browser.

Optionally, you can configure a [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) secret key and site key in the `.env` file using the `TURNSTILE_SECRET_KEY` and `VITE_TURNSTILE_SITE_KEY` variables, respectively. Note the `VITE_` prefix is required for the build system to expose the site key variable to the frontend. The default values are dummy keys that always pass captcha validation.