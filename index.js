const core = require('@actions/core');
const github = require('@actions/github');
const childProcess = require("child_process");
const { promises: fs } = require("fs");
const { stdout } = require('process');

const execute = (command, skip_error=false) => new Promise((resolve, reject) => {
    childProcess.exec(command, (error, stdout, stderr) => {
        if ((error || stderr) && !skip_error) {
            reject(stderr);
            return;
        }
        else if (skip_error) {
            resolve(stderr);
            return;
        }

        resolve(stdout);
    });
})


const main = async() => {
    const release_mode = core.getInput('release-mode');
    const app_name = core.getInput('app-name');

    if (!app_name) {
        core.setFailed(
            `App Name parameter must be suplied`
        );
    }

    if (!release_mode) {
        core.setFailed(
            `Release mode parameter must be suplied`
        );
    }

    try{
        await execute(`pip install vmn`);
    } catch (e) {
        core.setFailed(`Error executing pip install ${e}`);
    }
    await execute(`vmn init`, skip_error=true);
    await execute(`vmn init-app ${app_name}`, skip_error=true);

    try{
        let out = await execute(`vmn --debug stamp -r ${release_mode} ${app_name}`);
        core.info(`stamp stdout: ${out}`);
    } catch (e) {
        core.setFailed(`Error executing vmn stamp ${e}`);
    }

    try{
        out = await execute(`vmn show ${app_name}`);
        core.setOutput("verstr", out.split(/\r?\n/)[0]);
    } catch (e) {
        core.setFailed(`Error executing vmn show ${e}`);
    }    
}

main().catch(err => {
    console.error(err);
    process.exit(err.code || -1);
})
