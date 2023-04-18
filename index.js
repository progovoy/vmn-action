const core = require('@actions/core');
const github = require('@actions/github');
const childProcess = require("child_process");
const YAML = require('js-yaml');
const { promises: fs } = require("fs");
const { stdout } = require('process');
const getCurrentBranchName = require('node-git-current-branch');
const { Octokit } = require("@octokit/rest");

let out;

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
});

const fail = async (msg) => {
    core.info(`failed vmn`);
    out = await execute(`[ -f .vmn/vmn.log ] && echo 1 || echo 0`);
    core.info(`${out}`);
    if (out.includes("1"))
    {
        core.info(`vmn log will be presented`);
        out = await execute(`cat .vmn/vmn.log`);
        core.info(`vmn log: ${out}`);
    }
    core.setFailed(`Error Massage: ${msg}`);
    process.exit(-1);
}


const main = async () => {
    let app_name = core.getInput('app-name');
    let stamp_mode = core.getInput('stamp-mode');
    let release_candidate = core.getInput('release-candidate');
    let prerelease_name = core.getInput('prerelease-name');
    let release = core.getInput('release');
    let only_output_mode = core.getInput('only-output-mode');
    let debug_mode = core.getInput('debug-mode');
    core.info(`app_name: ${app_name}`);
    core.info(`stamp_mode: ${stamp_mode}`);
    core.info(`release_candidate: ${release_candidate}`);
    core.info(`prerelease_name: ${prerelease_name}`);
    core.info(`only_output_mode: ${only_output_mode}`);
    core.info(`debug_mode: ${debug_mode}`);
    core.info(`release: ${release}`);
    let protected = false;
    let new_pull_number = 0;
    let token = core.getInput('token');
    if (token == "")
    {
        token = process.env.GITHUB_TOKEN
        if (token == undefined)
        {
            await fail(
                "Github Token Must Be Supplied As A 'token' Parameter Or As An 'GITHUB_TOKEN' Env Variable"
            );
        }
    }
    const octokit = github.getOctokit(token);
    const username = github.context.actor;
    const permission_response = await octokit.rest.repos.getCollaboratorPermissionLevel({
        ...github.context.repo,
        username: username
      });
    let permission = permission_response.data.permission;
    if (permission != "write" && permission != "admin")
    {
        await fail(
            "Action must have write permission"
        );
    }

    /*const protection_response = await octokit.rest.actions.getGithubActionsPermissionsRepository({
        ...github.context.repo
      });
      core.info(`step 2`);
    let protection = protection_response.data.can_approve_pull_request_reviews;
    core.info(`step 3`);
    // If protected branch than create new branch and work from there. In the end, marge the pull request to the original branch

    core.info(`protection: ${protection}`);
    */

    // try{
    //     let branch_name = getCurrentBranchName();

    //     core.info(`branch_name is ${branch_name}`)

    //     let new_branch_name = `${branch_name}-temp`

    //     await execute(`git checkout -b ${new_branch_name}`);

    //     if (!app_name) {
    //         await fail(
    //             "App Name parameter must be suplied"
    //         );
    //     }

    //     core.info(`branch_name is ${new_branch_name}`)
    // } catch (e) {
    //     await fail(`Error branching to temp branch ${e}`);
    // }

    let failed = true;
    let err_str = "";
    try{
        await execute(`sudo pip install --pre -U vmn`);
        failed = false;
    } catch (e) {
        //await fail(`Error executing pip install ${e}`);
        err_str = `Error executing pip install ${e}`;
    }
    if (failed)
    {
        try{
            await execute(`pip install --pre -U vmn`);
            failed = false;
        } catch (e) {
            //await fail(`Error executing pip install ${e}`);
            err_str += `Error executing pip install ${e}`;
        }
    }
    if (failed)
    {
        await fail(err_str);
    }
    extra_args = ""
    if (debug_mode === "true") {
        extra_args += "--debug";
    }
    //core.info(`branch_name is a ${new_branch_name}`)
    out = await execute(`vmn ${extra_args} init`, skip_error=true);
    debug_mode === "true" ? core.info(`vmn ${extra_args} init stdout: ${out}`) : "";
    out = await execute(`vmn ${extra_args} init-app ${app_name}`, skip_error=true);
    debug_mode === "true" ? core.info(`vmn ${extra_args} init-app ${app_name} stdout: ${out}`) : "";
    //core.info(`branch_name is ${new_branch_name}`)

    if (only_output_mode === "true") {
        try{
            out = await execute(`vmn ${extra_args} show --ignore-dirty ${app_name}`);
            if (debug_mode === "true") {
                core.info(`vmn ${extra_args} init stdout: ${out}`)
                out = await execute(`vmn show --ignore-dirty ${app_name}`);
            }
            else {
                core.info(`stamp stdout: ${out}`);
            }
            core.setOutput("verstr", out.split(/\r?\n/)[0]);
            
            return;
        } catch (e) {
            await fail(`Error executing vmn show --ignore-dirty ${e}`);
        }
    }

    try{
        let show_result = await execute(`vmn show --verbose ${app_name}`);
        
        let show_result_obj = YAML.load(show_result);
        core.info(`show_result_obj["release_mode"]: ${show_result_obj["release_mode"]}`);

        if (prerelease_name === "")
        {
            prerelease_name = "rc";
        }

        if (release === "true")
        {
            if (show_result_obj["release_mode"].includes("prerelease"))
            {
                out = await execute(`vmn ${extra_args} release ${app_name}`);
                debug_mode === "true" ? core.info(`vmn ${extra_args} init stdout: ${out}`) : "";
            }
            else
            {
                await fail("Can't make release of non-prerelease version");
            }

        }
        else if (release_candidate === "true")
        {
            if (show_result_obj["release_mode"].includes("prerelease"))
            {
                out = await execute(`vmn ${extra_args} stamp --pr ${prerelease_name} ${app_name}`);
                debug_mode === "true" ? core.info(`vmn ${extra_args} init stdout: ${out}`) : "";
            }
            else if (stamp_mode.substring("major") || stamp_mode.substring("minor") || stamp_mode.substring("patch"))
            {
                out = await execute(`vmn ${extra_args} stamp -r ${stamp_mode} --pr ${prerelease_name} ${app_name}`);
                debug_mode === "true" ? core.info(`vmn ${extra_args} init stdout: ${out}`) : "";
            }
            else
            {
                await fail("stamp-mode must be provided for first prerelease (major, minor, or patch)");
            }
        }
        else
        {
            if (stamp_mode.substring("major") || stamp_mode.substring("minor") || stamp_mode.substring("patch"))
            {
                out = await execute(`vmn ${extra_args} stamp -r ${stamp_mode} ${app_name}`);
                debug_mode === "true" ? core.info(`vmn ${extra_args} init stdout: ${out}`) : "";
            }
            else
            {
                await fail("Invaild stamp-mode (major, minor, or patch)");
            }
        }

        // if (protected)
        // {
        //     // If protected than marge new pull request from created branch to the original branch
        //     const marge_response = await octokit.rest.pulls.merge({
        //         ...github.context.repo,
        //         pull_number: new_pull_number
        //       });

        //     let marge = protection_response.data.merged;

        //     core.info(`marge: ${marge}`);
        // }

        core.info(`stamp stdout: ${out}`);
    } catch (e) {
        await fail(`Error executing vmn stamp ${e}`);
    }

    try{
        out = await execute(`vmn show ${app_name}`);
        core.setOutput("verstr", out.split(/\r?\n/)[0]);
    } catch (e) {
        await fail(`Error executing vmn show ${e}`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(err.code || -1);
})
