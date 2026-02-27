---
icon: material/source-pull
---

## How to Contribute

Educator Tools is an open-source project, and we welcome contributions from educators, developers, and Minecraft enthusiasts.
Whether you want to improve existing features, fix bugs, or propose new ideas, your input helps shape the future of this toolset.

## Getting Started

Before contributing, make sure you have your development environment set up properly. Follow our **[Development Setup Guide](Development-Setup.md)** for detailed instructions on:

- Installing prerequisites (Python, NodeJS, Regolith, etc.)
- Forking and cloning the repository
- Installing dependencies
- Building the project

Once your environment is ready, return here to learn about the contribution workflow.

---

Our project uses the **modular_mc Regolith filter** for modular code development, allowing flexible and reusable code components. Follow these steps to modify the code:

1. **Locate the Source Files:**  
   The source files are primarily located in the Regolith-related directories, particularly in `./regolith/filters_data/modular_mc/educator_tools/`. Additionally, a `manifest.json` file in the `scripting_setup` folder contains references to the Minecraft modules.

2. **Make Your Changes:**

   - Open the files in your preferred text editor or IDE.
   - Apply your modifications while following best coding practices. Include comments as necessary.
   - For changes in TypeScript files, remember that NodeJS manages these modules; you may need to recompile the project to see your changes.

3. **Test Your Changes Locally:**  
   After modifying the code, ensure that the project runs as expected by building it using the methods described in the Development Setup guide.

4. **Commit and Push Your Changes:**  
   Once you've verified your changes, use the following commands:
   ```bash
   git add .
   git commit -m "Description of changes made"
   git push origin main
   ```

### Adding Translations

For detailed instructions on adding or improving translations, please see our dedicated **[Translations Guide](Translations.md)**.

---

## 2. Keeping Your Fork Updated

It's important to keep your fork synchronized with the original repository to avoid conflicts and ensure you're working with the latest code. Here's how to update your fork:

### 2.1. Adding the Upstream Remote (One-time Setup)

#### Using Git (Command Line)

1. **Navigate to your local repository:**

   ```bash
   cd Educator-Tools
   ```

2. **Add the original repository as upstream:**

   ```bash
   git remote add upstream https://github.com/ShapescapeMC/Educator-Tools.git
   ```

3. **Verify the remote was added:**
   ```bash
   git remote -v
   ```
   You should see both `origin` (your fork) and `upstream` (original repository) listed.

#### Using GitHub Desktop

1. **Open your repository in GitHub Desktop.**
2. **Go to Repository > Repository Settings.**
3. **In the "Remote" tab, add the upstream repository URL.**

### 2.2. Syncing Your Fork

#### Using Git (Command Line)

1. **Fetch the latest changes from upstream:**

   ```bash
   git fetch upstream
   ```

2. **Switch to your main branch:**

   ```bash
   git checkout main
   ```

3. **Merge the upstream changes:**

   ```bash
   git merge upstream/main
   ```

4. **Push the updated main branch to your fork:**
   ```bash
   git push origin main
   ```

#### Using GitHub Desktop

1. **Open your repository in GitHub Desktop.**
2. **Go to Branch > Merge into Current Branch.**
3. **Select the upstream/main branch and click "Merge".**
4. **Push the changes to your fork by clicking "Push origin".**

#### Using GitHub Web Interface

1. **Navigate to your fork on GitHub.**
2. **Click the "Sync fork" button** (if available).
3. **Click "Update branch"** to sync with the upstream repository.

---

## 3. Creating a Pull Request

After pushing your changes to your fork, follow these steps to open a Pull Request (PR) and contribute your work to the original repository:

1. **Push Your Changes:**  
   Please ensure you have committed your changes locally and pushed them to your fork on GitHub.

2. **Open Your Fork on GitHub:**  
   Navigate to your forked repository on GitHub in your web browser.

3. **Initiate the Pull Request:**

   - GitHub often shows a prompt to "Compare & pull request" after you push new commits. Click this button, or click on the "Pull Requests" tab and then "New Pull Request."
   - Make sure you are comparing your branch (with your changes) against the original repository's main branch (or the appropriate target branch).

4. **Fill in the PR Details:**

   - **Title:** Provide a clear, concise title that summarizes your changes.
   - **Description:** Include a detailed description of the changes, why they were made, and any additional context. If the repository has a PR template, follow the provided structure.
   - **Link Issues:** If your changes address specific issues, reference them (e.g., "Fixes #123").

5. **Submit the PR:**  
   Once you're satisfied with the details, click **"Create Pull Request"** to submit it for review.

---

## 4. Contribution Guidelines

- **Follow Coding Standards:** Maintain consistent code style and include meaningful comments.
- **Test Thoroughly:** Ensure your changes work as expected and don't break existing functionality.
- **Write Clear Commit Messages:** Use descriptive commit messages that explain what was changed and why.
- **Stay Updated:** Keep your fork synchronized with the main repository to avoid conflicts.
- **Be Responsive:** Be prepared to address feedback and make revisions to your pull request if requested.

For technical setup questions, refer to the **[Development Setup Guide](Development-Setup.md)**.

---

!!! tip "📝 Not a developer? You can still help!"
    Share your feedback on Educator Tools, it only takes 3 minutes.

    [**Take the Feedback Survey →**](https://forms.office.com/e/gE2ks5WR7R){ .md-button .md-button--primary target="_blank" }
