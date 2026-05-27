# Data Labeler

A minimal static web app for manually labeling JSON datasets — designed to evaluate LLM predictions by assigning `ground_truth` to each item.

## Quick start

**With Docker (no Node.js required):**
```bash
docker compose up --build
# → open http://localhost:8080
```

**With Node.js:**
```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build   # output in dist/
```

## Input format

Drop or paste a JSON file with the following structure:

```json
{
  "content": [
    {
      "step_name": "Run tests",
      "project": "org/repo",
      "workflow_filename": "ci.yml",
      "job_name": "build",
      "Class": "Testing"
    }
  ],
  "config": {
    "attribute_to_show": ["step_name", "project", "workflow_filename", "job_name"],
    "prediction_attribute": "Class",
    "categories": [
      "Cloning and source management",
      "Compilation and building",
      "Testing",
      "Deployment and publishing",
      "Code analysis and quality",
      "Documentation",
      "Github Internal steps",
      "Other"
    ]
  }
}
```

| Config field          | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `attribute_to_show`   | Fields to display for each item                                             |
| `prediction_attribute`| Field holding the LLM prediction — shown as an amber badge for comparison  |
| `categories`          | List of labels the annotator can assign (multi-select)                      |

## Output

Download `labeled.json` — the same `content` array with a `ground_truth: string[]` field added to each labeled item.

## Keyboard shortcuts

| Key              | Action                           |
|------------------|----------------------------------|
| `1`–`9`          | Toggle category at that position |
| `Enter` / `Space`| Advance to next unlabeled item   |
| `← →`            | Navigate freely                  |

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main`.

Enable GitHub Pages in your repo settings: **Settings → Pages → Source → GitHub Actions**.
