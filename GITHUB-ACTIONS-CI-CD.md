# GitHub Actions CI/CD

This project uses GitHub Actions to validate changes and Vercel to host the Next.js application.

## What is automated

The workflow is in `.github/workflows/ci-cd.yml`.

- Pull requests targeting `main` run `npm ci`, ESLint, TypeScript checking, and a production build.
- Pull requests from this repository deploy a Vercel Preview after all validation passes.
- Pull requests from forks still run validation, but skip deployment because GitHub does not expose repository secrets to fork workflows.
- Pushes to `main` run the same checks, then deploy to Vercel Production.
- `workflow_dispatch` enables a manual run from the GitHub Actions page. Select `main` for production; another branch deploys a preview.
- The workflow has read-only repository permissions and cancels an older run when a newer run starts for the same ref.

## One-time setup

The linked GitHub repository was empty when this workflow was prepared, and this local project directory did not have a Git repository configured. GitHub Actions will not run until the project and workflow are pushed to the repository.

1. Create or select a Vercel project for this application and link the project locally:

   ```bash
   npx vercel login
   npx vercel link
   ```

   In the Vercel project settings, note the **Organization ID** and **Project ID**. Create a Vercel access token from your Vercel account settings.

2. In GitHub, open **KaisenSage/tandem-finance → Settings → Secrets and variables → Actions → New repository secret**. Add:

   | Secret | Value |
   | --- | --- |
   | `VERCEL_TOKEN` | The Vercel access token |
   | `VERCEL_ORG_ID` | The Vercel organization/team ID |
   | `VERCEL_PROJECT_ID` | The Vercel project ID |

   Keep these values in GitHub Secrets; do not add them to source code or commit a `.env` file.

3. Initialize the local project and push its first commit. Run these commands from the project root, after confirming that the directory contains only files you intend to publish:

   ```bash
   git init -b main
   git add .
   git commit -m "Add Tandem finance application and CI/CD"
   git remote add origin https://github.com/KaisenSage/tandem-finance.git
   git push -u origin main
   ```

   GitHub will start the workflow on the push. Authenticate with GitHub CLI or your configured Git credential manager if prompted.

4. In GitHub, open **Actions** and check the latest **CI / CD** run. The validation job does not require Vercel secrets; the deployment job requires all three. Once checks pass, the workflow deploys `main` to production.

5. (Recommended) In **Settings → Branches** or the repository rulesets page, protect `main` and require the **Validate** job to pass before merging pull requests.

## Manual operation

### Run the same checks locally

From the project root:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

Address any failing check before opening or merging a pull request.

### Run GitHub Actions manually

1. Push the branch to GitHub.
2. Open the repository's **Actions** tab and choose **CI / CD**.
3. Choose **Run workflow**, select the branch, and start the run.
4. Use `main` to deploy to Production. Any other branch deploys to Preview.

### Deploy manually with Vercel CLI

After linking the local project with `npx vercel link`, authenticate and deploy:

```bash
npx vercel login
npx vercel pull --yes --environment=preview
npx vercel build
npx vercel deploy --prebuilt
```

To deploy the current `main` checkout to Production instead:

```bash
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

Review the CLI output for the resulting Preview or Production URL. Do not paste access tokens into command arguments that may be recorded in shell history; use the Vercel CLI login flow for local deployment.
