# Development Setup

This guide will help you set up your development environment for contributing to Educator Tools.

## 1. Prerequisites

Before you begin, make sure you have installed the following:

- **Git or GitHub Desktop**  
  Git is essential for cloning the repository and managing version control. If you prefer a graphical interface, install [GitHub Desktop](https://desktop.github.com/). Otherwise, download Git from [git-scm.com](https://git-scm.com/).

- **Python 3.13**  
  Download it directly from the [official Python website](https://www.python.org/downloads/). **Note:** Do NOT use the version available from the Windows Store.

- **NodeJS LTS**  
  Install the Long Term Support version from the [official NodeJS website](https://nodejs.org/). This will be used for managing our TypeScript modules and dependencies.

- **Regolith**  
  Our project uses Regolith (from Bedrock-Oss) as a compiler for our files. Follow the installation instructions available in [Regolith's official documentation](https://regolith-docs.readthedocs.io/en/latest/introduction/installation/).

- **Minecraft Education**
  You need Minecraft Education installed [from the Windows Installer](https://aka.ms/downloadmee-desktopApp) in order for Regolith to compile correctly.

---

## 2. Cloning the Repository

Before cloning, you need to **fork** the repository so that you have your own copy to work on.

### 2.1. Forking the Repository

1. **Visit the Repository on GitHub:**  
   Open the repository page in your web browser.

2. **Click the Fork Button:**  
   In the top right corner of the page, click the **"Fork"** button. This will create a copy of the repository under your GitHub account.

### 2.2. Cloning Your Fork

Once you have forked the repository, you can clone it to your local machine using either Git (command line) or GitHub Desktop.

#### Using Git (Command Line)

1. **Open your terminal or command prompt.**
2. **Clone your forked repository:**  
   Replace `<your-fork-URL>` with the URL of your fork:
   ```bash
   git clone https://github.com/ShapescapeMC/Educator-Tools.git
   ```
3. **Navigate to the project folder:**
   ```bash
   cd Educator-Tools
   ```

#### Using GitHub Desktop

1. **Download and install GitHub Desktop** from [desktop.github.com](https://desktop.github.com/) if you haven't already.
2. **Open GitHub Desktop** and sign in with your GitHub account.
3. **Clone your forked repository:**
   - Click on **"File"** in the menu and select **"Clone Repository..."**.
   - In the dialog that appears, select the **"URL"** tab, then paste your fork's URL.
   - Choose the local path where you want the repository to be saved.
   - Click **"Clone"** to download the repository to your computer.

---

## 3. Installing Dependencies

There are multiple steps to install the necessary dependencies.

### 3.1. NodeJS Dependencies

The project uses Node to manage TypeScript modules. The `package_lock.json` file is located in the `./regolith/filters_data` folder and lists the necessary dependencies. To install them manually:

1. Open the terminal in the `./regolith/filters_data` directory:
   ```bash
   cd regolith/filters_data
   ```
2. Run the following command:
   ```bash
   npm install
   ```
   This command will install all the dependencies listed in the `package_lock.json` file.

### 3.2. Regolith Dependencies

In addition to the NodeJS dependencies, you must also run the following command in the `regolith` folder to install Regolith-specific dependencies:

1. Open the terminal in the `regolith` directory:
   ```bash
   cd regolith
   ```
2. Execute the command:
   ```bash
   regolith install-all
   ```
   **Note:** If you encounter errors during this process, running the command again may resolve them.

### 3.3. Using the Provided PowerShell Script

There is also a PowerShell script available to install dependencies:

- **Script Location:**  
  The script is located in the `scripts` folder and is named `install_dependencies.ps1`.

- **Running the Script:**  
  You can execute this script directly from your terminal or run it as a task in VSCode.  
  From the terminal, navigate to the `scripts` folder:
  ```bash
  cd .scripts
  ```
  Then run:
  ```powershell
  .\install_dependencies.ps1
  ```

By following these steps, you'll have all the necessary dependencies installed for both NodeJS and Regolith.

---

## 4. Building the Project / Running Regolith

There are two equivalent methods to build the project and compile your files: using the `build.ps1` script or running the `regolith run` command directly. You can use either method according to your preference.

### 4.1. Using the Build Script

- **Script Location:**  
  The build script is located in the `.scripts` folder and is named `build.ps1`.

- **Running the Script:**  
  You can execute this script directly from your terminal or as a task in VSCode.  
  To run from the terminal:
  1. Navigate to the `scripts` folder:
     ```bash
     cd .scripts
     ```
  2. Execute the build script:
     ```powershell
     .\build.ps1
     ```

### 4.2. Using Regolith Directly

Alternatively, you can use the Regolith command:

1. **Navigate to the Regolith Folder:**  
   Open your terminal and move to the `regolith` directory:
   ```bash
   cd regolith
   ```
2. **Run Regolith:**  
   Execute the following command:
   ```bash
   regolith run
   ```

Both methods achieve the same result, such as compiling your files for Minecraft Bedrock.

---

## 5. Project Architecture

Our project uses the **system_template filter by Nusiq** for modular code development, allowing flexible and reusable code components.

- **Source Files:**  
  The source files are primarily located in the Regolith-related directories, particularly in `./regolith/filters_data/system_template/`. Additionally, a `manifest.json` file in the `scripting_setup` folder contains references to the Minecraft modules.

- **TypeScript Modules:**  
  NodeJS manages TypeScript modules; you may need to recompile the project to see your changes.

---

## Final Setup Tips

- **Read the Documentation:**  
  Review the official Regolith and System Template documentation to stay updated on any changes or specific details.

- **Set Up a Development Environment:**  
  Use an IDE like Visual Studio Code that supports debugging and syntax highlighting to streamline your development process.

- **Next Steps:**  
  Once your development environment is set up, see the **[Contributing Guide](/ShapescapeMC/Educator-Tools/wiki/Contributing)** for information on making changes and submitting pull requests.
