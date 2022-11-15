const core = require('@actions/core');
const github = require('@actions/github');
const childProcess = require("child_process");
const { promises: fs } = require("fs");

const execute = (command) => new Promise((resolve, reject) => {
    childProcess.exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
            reject(stderr);
            return;
        }
        resolve(stdout);
    });
})


const main = async() => {
    const release_mode = core.getInput('release-mode');
    const app_name = core.getInput('app-name');
    core.info(`Using ${release_mode} release mode for app: ${app_name}`);

    if (isNaN(app_name)) {
        core.setFailed(
            `App Name parameter must be suplied`
        );
    }

    try {
        await execute(`vmn init`);
    } catch (e) {
        {}
    }

    try {
        await execute(`vmn init-app ${app_name}`);
    } catch (e) {
        {}
    }

    try {
        await execute(`vmn init-app ${app_name}`);
    } catch (e) {
        {}
    }

    try {
        await execute(`vmn stamp -r ${release_mode} ${app_name}`);
    } catch (e) {
        core.setFailed(`Error executing vmn stamp ${e}`);
    }

    try {
        let out = await execute(`vmn show ${app_name}`);
        core.setOutput("verstr", out);
    } catch (e) {
        core.setFailed(`Error executing vmn stamp ${e}`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(err.code || -1);
})
