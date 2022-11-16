const core = require('@actions/core');
const github = require('@actions/github');
const childProcess = require("child_process");
const { promises: fs } = require("fs");
const { stdout } = require('process');

const execute = (command) => new Promise((resolve, reject) => {
    childProcess.exec(command, (error, stdout, stderr) => {
        resolve(stdout);
    });
})


const main = async() => {
    const release_mode = core.getInput('release-mode');
    const app_name = core.getInput('app-name');
    core.info(`Using ${release_mode} release mode for app: ${app_name}`);

    if (!app_name) {
        core.setFailed(
            `App Name parameter must be suplied`
        );
    }

    await execute(`pip install vmn --pre`);
    await execute(`vmn init`);
    await execute(`vmn goto --pull ${app_name}`);
    await execute(`vmn init-app ${app_name}`);
    await execute(`vmn goto --pull ${app_name}`);

    let out = await execute(`vmn --debug stamp -r ${release_mode} ${app_name}`);
    core.info(`stdout: ${out}`);

    out = await execute(`vmn show ${app_name}`);
    core.setOutput("verstr", out);
}

main().catch(err => {
    console.error(err);
    process.exit(err.code || -1);
})
