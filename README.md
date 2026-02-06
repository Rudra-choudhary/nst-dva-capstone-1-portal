# DVA Capstone 1 Website

Minimal single-page website for GitHub Pages.

## Update PDF Links
Edit `index.html` and replace each `href="https://drive.google.com/"` with your actual Google Drive share link.

## Update Team Finder Data
Team Finder now auto-loads from CSV files in `data/`:

- `data/section-a.csv`
- `data/section-b.csv`
- `data/section-c.csv`
- `data/section-d.csv`
- `data/section-e.csv`

Search works by `group`, `enrollment`, and `name`.

For direct `index.html` opening (without a local server), Team Finder uses:
- `data/team-directory.js`

## Run Locally (optional)
Open `index.html` directly in a browser.

## Publish on GitHub Pages
1. Push this folder to a GitHub repository.
2. In GitHub: `Settings` -> `Pages`.
3. Set source to `Deploy from a branch`.
4. Select branch `main` and folder `/ (root)`.
5. Save. Your site will be live at `https://<username>.github.io/<repo>/`.
