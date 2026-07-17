# Render CI/CD setup

This repository uses GitHub Actions for continuous integration and Render for continuous deployment.

```text
Pull request -> GitHub Actions builds API and web -> checks pass -> merge to main -> Render deploys
```

`render.yaml` defines two services:

- `splitly-api-mtyo`: Express API
- `splitly-web`: Vite static site

Both services are configured with `autoDeployTrigger: checksPass`, so Render waits for the GitHub `CI` workflow before deploying a commit from `main`.

## One-time manual setup

### 1. Push this configuration to GitHub

Commit and push `render.yaml`, `.github/workflows/ci.yml`, and the application changes to the repository's `main` branch.

In GitHub, open the **Actions** tab and confirm that the `CI` workflow runs. It must pass before Render deploys.

### 2. Connect Render to GitHub

1. Sign in to Render.
2. Open **Dashboard -> New -> Blueprint**.
3. Connect the GitHub account that owns this repository and allow Render access to the repository.
4. Select this repository and its `main` branch.
5. Render detects `render.yaml`. Review the two services and click **Apply**.

If `splitly-api-mtyo` is not the exact name of the existing API service, update the name in `render.yaml` before applying the Blueprint. Matching the name lets the Blueprint manage the existing service instead of creating a duplicate.

### 3. Configure the API environment variables

Open the API service in Render, choose **Environment**, and add the secret values below. Do not commit any of them to Git.

```text
MONGODB_URI
DATABASE_NAME
ACCESS_JWT_SECRET_KEY
WEBSITE_DOMAIN_DEVELOPMENT
WEBSITE_DOMAIN_PRODUCTION
GRAPH_TENANT_ID
GRAPH_CLIENT_ID
GRAPH_CLIENT_SECRET
GRAPH_SENDER_EMAIL
ADMIN_EMAIL_ADDRESS
```

Also verify these non-secret values:

```text
ACCESS_JWT_EXPIRES_IN=1h
ADMIN_EMAIL_NAME=Splitly
```

Set `WEBSITE_DOMAIN_PRODUCTION` to the final HTTPS URL of the Render static site, without a trailing slash. This is used for CORS and email links.

### 4. Configure the static site

After Render creates the API service, copy its public URL, for example:

```text
https://splitly-api-mtyo.onrender.com
```

Open the `splitly-web` service in Render, choose **Environment**, and set:

```text
VITE_API_ROOT=https://splitly-api-mtyo.onrender.com
```

Redeploy the static site after changing this variable. Vite embeds `VITE_API_ROOT` at build time.

Then copy the static site's public URL and return to the API service to set:

```text
WEBSITE_DOMAIN_PRODUCTION=https://your-static-site.onrender.com
```

Redeploy the API after changing it.

### 5. Confirm automatic deployment

1. Create a pull request that changes either `api/` or `web/`.
2. Confirm the two GitHub `CI` jobs pass.
3. Merge the pull request into `main`.
4. In Render, open each service's **Events** tab and confirm the deploy begins after the GitHub checks are successful.
5. Test `https://<api-url>/v1/status` and open the static-site URL.

## Operational notes

- Keep Render auto-deploy set to **After CI Checks Pass**. The Blueprint keeps this as `checksPass`.
- The existing VPS workflows are manual-only, so they no longer deploy an unrelated VPS whenever `main` changes.
- Rotate `GRAPH_CLIENT_SECRET` before it expires: create a new secret in Microsoft Entra, update Render, deploy, then remove the old secret.
- The API test-email endpoint is useful while configuring Graph. Remove or protect it before public production use.