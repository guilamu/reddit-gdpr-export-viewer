# Reddit GDPR Export Data Viewer

A modern, standalone offline viewer for your Reddit GDPR data export files.

![Plugin Screenshot](https://github.com/guilamu/reddit-gdpr-export-viewer/blob/main/screenshot.png)

## Data Visualization
- **View Your History:** Browse Posts, Comments, Messages, Saved Items, and Votes in a clean interface.
- **Analyze Content:** See removed or deleted posts that are still in your archives.
- **Track Activity:** Visualize your account statistics and subscription history.

## Search & Filter
- **Global Search:** Instantly search across all your reddit data.
- **Advanced Filtering:** Filter by Date Range, Subreddit, or Post Type (Text/Link).
- **Sorting:** Automatically sorted by newest first for easy timeline browsing.

## Key Features
- **Standalone:** Single executable logic (requires web files), no installation needed.
- **Private:** Runs 100% locally. Your data never leaves your computer.
- **Dark Mode:** Modern, eye-friendly dark interface.
- **CSV Support:** Natively reads standard Reddit GDPR export CSV files.

> [!CAUTION]
> **Security Warning:**
> Never run an executable file (`.exe`) downloaded from the internet without scanning it first.
> We strongly recommend uploading the `RedditViewer.exe` to [VirusTotal](https://www.virustotal.com/gui/home/upload) before running it to ensure it's safe.

## Requirements
- Windows 10 or higher (for executable) OR Node.js 18+ (to run from source)
- Your Reddit Data Export (CSV files)

## Build from Source
If you prefer to build the executable yourself:
1.  Install Node.js 18+.
2.  Install `pkg` globally: `npm install -g pkg`
3.  Run the build command:
    ```bash
    pkg server.js --targets node18-win-x64 --output RedditViewer.exe
    ```

## Installation
1.  Download the latest release and unzip it to a folder (e.g., `MyRedditViewer`).
2.  **Scan `RedditViewer.exe` with [VirusTotal](https://www.virustotal.com/gui/home/upload).**
3.  Create a folder named `csv` inside.
4.  Place your Reddit export CSV files (e.g., `posts.csv`, `comments.csv`) into the `csv` folder.
5.  Double-click `RedditViewer.exe`.
6.  The application will launch automatically in your default browser.

## Browser-Only Usage (No Executable)
You can use the application directly in your web browser without the executable:
1.  Open `index.html` in your web browser.
2.  Drag and drop your CSV files or use the file picker to load your data.
3.  **Note:** In this mode, nothing is saved when you close the browser. You will need to reload your data each time.

## FAQ
### Is my data safe?
Yes, absolutely. The viewer runs locally on your machine (`localhost`). No data is ever uploaded to any server.

### Can I run this offline?
Yes. Once you have the application files, you can disconnect from the internet and browse your history freely.

### My browser didn't open automatically?
You can manually open your browser and navigate to `http://localhost:3000` after running the executable.

## Project Structure
```
.
├── RedditViewer.exe          # Main application executable
├── server.js                 # Server source code (Node.js)
├── index.html                # Main user interface
├── styles.css                # Visual styling
├── app.js                    # Frontend logic
└── README.md                 # Documentation
```

## Changelog

### 1.0.0
- **New:** Initial release of the standalone viewer.
- **New:** Support for Posts, Comments, Messages, Votes, and Saved items.
- **New:** Global search and advanced filtering (Date, Subreddit).
- **New:** Account statistics and 50/50 split layout for account tab.
- **Improved:** Modern dark theme UI.
- **Secure:** Local-only processing.

## Support
Feel free to create an issue if you encounter problems or have ideas for improvement. However, please keep in mind that the creator considers this application "good enough" for its current use case, so please do not expect fast support or immediate fixes.

## License
This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.
