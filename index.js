const core = require('@actions/core');
const github = require('@actions/github');
const childProcess = require("child_process");
const YAML = require('js-yaml');
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

const fail = async (msg) => {
    out = await execute(`[ -f .vmn/vmn.log ] && cat .vmn/vmn.log`);
    core.info(`failed vmn. vmn log: ${out}`);
    core.setFailed(`Error Massage: ${msg}`);
}


const main = async () => {
    let app_name = core.getInput('app-name');
    let stamp_mode = core.getInput('stamp-mode');
    let release_candidate = core.getInput('release-candidate');
    let prerelease_name = core.getInput('prerelease-name');
    let release = core.getInput('release');
    core.info(`app_name: ${app_name}`);
    core.info(`stamp_mode: ${stamp_mode}`);
    core.info(`release_candidate: ${release_candidate}`);
    core.info(`prerelease_name: ${prerelease_name}`);
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
                "Github Token Must Be Supplied As Env Variable"
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
    
    core.info(`permission: ${permission}`);
    if (permission != "write" && permission != "admin")
    {
        await fail(
            "Action must have write permission"
        );
    }

    const protection_response = await octokit.rest.actions.getGithubActionsDefaultWorkflowPermissionsRepository({
        ...github.context.repo
      });

    let protection = protection_response.data.can_approve_pull_request_reviews;

    // If protected branch than create new branch and work from there. In the end, marge the pull request to the original branch

    core.info(`protection: ${protection}`);

    if (!app_name) {
        await fail(
            "App Name parameter must be suplied"
        );
    }

    try{
        await execute(`pip install vmn`);
    } catch (e) {
        await fail(`Error executing pip install ${e}`);
    }
    await execute(`vmn init`, skip_error=true);
    await execute(`vmn init-app ${app_name}`, skip_error=true);

    try{
        let out;
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
                out = await execute(`vmn release ${app_name}`);
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
                out = await execute(`vmn stamp --pr ${prerelease_name} ${app_name}`);
            }
            else if (stamp_mode.substring("major") || stamp_mode.substring("minor") || stamp_mode.substring("patch"))
            {
                out = await execute(`vmn stamp -r ${stamp_mode} --pr ${prerelease_name} ${app_name}`);
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
                out = await execute(`vmn stamp -r ${stamp_mode} ${app_name}`);
            }
            else
            {
                await fail("Invaild stamp-mode (major, minor, or patch)");
            }
        }

        if (protected)
        {
            // If protected than marge new pull request from created branch to the original branch
            const marge_response = await octokit.rest.pulls.merge({
                ...github.context.repo,
                pull_number: new_pull_number
              });

            let marge = protection_response.data.merged;

            core.info(`marge: ${marge}`);
        }
        
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
