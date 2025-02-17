const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Function to check and install missing dependencies
function checkAndInstallDependencies() {
    // Read package.json
    const packageJsonPath = path.resolve(__dirname, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = require(packageJsonPath);
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // Check if modules are installed
        const nodeModulesPath = path.resolve(__dirname, 'node_modules');

        // Iterate over dependencies and check if they're installed
        Object.keys(dependencies).forEach(module => {
            const modulePath = path.resolve(nodeModulesPath, module);
            if (!fs.existsSync(modulePath)) {
                console.log(`Module ${module} not found. Installing...`);
                installModule(module);
            }
        });
    } else {
        console.log('package.json not found, unable to check dependencies.');
    }
}

// Function to install a module using npm
function installModule(module) {
    exec(`npm install ${module}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error installing ${module}: ${stderr}`);
        } else {
            console.log(`Successfully installed ${module}: ${stdout}`);
        }
    });
}

// Execute the check and install process
checkAndInstallDependencies();

// Execute bot.js after checking dependencies
require('./bot.js');