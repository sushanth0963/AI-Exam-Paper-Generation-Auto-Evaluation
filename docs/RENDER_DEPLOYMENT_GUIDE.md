# Deploy AI Exam Platform to Render

This repository includes a Render Blueprint in `render.yaml` for:

- A managed PostgreSQL database
- A Docker-based FastAPI web service
- A Vite/React static site

## 1. Push the repository

Push the complete repository to GitHub or GitLab. Render must be able to read the root-level `render.yaml`.

## 2. Create the Render Blueprint

1. Sign in to [Render](https://render.com/).
2. Open **New > Blueprint**.
3. Connect the repository.
4. Select the branch to deploy.
5. Review the three resources shown by Render:
   - `ai-exam-db`
   - `ai-exam-api`
   - `ai-exam-frontend`
6. Apply the Blueprint.

Render will create the database first, then deploy the API and frontend.

## 3. Configure secrets

In the `ai-exam-api` service, open **Environment** and add:

- `OPENAI_API_KEY`: optional; required for live AI question generation

The Blueprint generates `SECRET_KEY` and injects `DATABASE_URL` from the managed database. Do not commit production secrets or upload `backend/.env.production` to Render.

## 4. Configure the frontend URL

The Blueprint uses these default Render URLs:

- API: `https://ai-exam-api.onrender.com`
- Frontend: `https://ai-exam-frontend.onrender.com`

After the first deploy, copy the actual URLs from the Render dashboard. If Render assigned a different name or you add a custom domain, update both services:

1. On `ai-exam-api`, set `CORS_ORIGINS` and `FRONTEND_URL` to the frontend URL.
2. On `ai-exam-frontend`, set `VITE_API_URL` to the API URL.
3. Trigger a new deploy of both services.

Use the exact origin, including `https://` and without a trailing slash.

## 5. Verify the deployment

Open the API health endpoint:

```text
https://ai-exam-api.onrender.com/health
```

It should return:

```json
{"status":"ok"}
```

Then open the frontend URL and verify:

1. Registration works.
2. Login works.
3. The dashboard loads without a CORS error.
4. An admin can create an exam and questions.
5. A student can submit an exam and view the result.
6. AI question generation works when `OPENAI_API_KEY` is configured.

Inspect **Logs** in the API service if a check fails.

## 6. Important Render notes

- The free web service may sleep after inactivity, so the first request can be slow.
- The free PostgreSQL plan has limited storage and retention. Use a paid database or external backups for production data.
- Database tables are created when the API starts. For schema migrations, add a migration tool before making breaking schema changes.
- Keep `healthCheckPath: /health` enabled so Render can restart an unhealthy API instance.

## Custom domains

Add custom domains in Render after the default deployment works. Then update `CORS_ORIGINS`, `FRONTEND_URL`, and `VITE_API_URL` as described above and redeploy.
