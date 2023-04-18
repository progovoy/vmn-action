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
    if (out.includes("1"))
    {
        out = await execute(`cat .vmn/vmn.log`);
        core.info(`vmn log: ${out}`);
        out = await execute(`git status`);
        core.info(`git status:\n${out}`);
        out = await execute(`git diff`);
        core.info(`git diff:\n${out}`);
    }
    core.setFailed(`Error Massage: ${msg}`);
    process.exit(-1);
}

const display_version = async (debug_mode, extra_args, app_name) => {
    try{ 
        if (debug_mode === "true") {
            out = await execute(`vmn ${extra_args} show --verbose ${app_name}`);
            core.info(`vmn ${extra_args} show --verbose ${app_name} stdout: ${out}`)
        }
        out = await execute(`vmn show --verbose ${app_name}`);
        let out_obj = YAML.load(out);
        current_version = out_obj["version"];
        version_type = out_obj["type"];
        is_in_rc_mode = false
        if (version_type != "release") {
            is_in_rc_mode = true
        }
        let is_dirty = false
        if ("dirty" in out_obj) {
            is_dirty = true
            current_version += ".d";
        }
        core.setOutput("verstr", current_version);
        core.setOutput("dirty", is_dirty);
        core.setOutput("is_in_rc_mode", is_in_rc_mode);
        core.setOutput("verbose_yaml", out_obj);

        core.info(`vmn version: ${current_version}`)
        
        return;
    } catch (e) {
        await fail(`Error executing vmn show --ignore-dirty ${e}`);
    }
}


const main = async () => {
    let app_name = core.getInput('app-name');
    
    let do_stamp = core.getInput('do-stamp');
    let stamp_mode = core.getInput('stamp-mode');
    let release_candidate = core.getInput('release-candidate');
    let prerelease_name = core.getInput('prerelease-name');
    let release = core.getInput('release');
    let stamp_from_version = core.getInput('stamp-from-version')
    
    let do_gen = core.getInput('do-gen');
    let gen_template_path = core.getInput('gen-template-path');
    let gen_output_path = core.getInput('gen-output-path');
    let gen_custom_yaml_path = core.getInput('gen-custom-yaml-path');
    
    let debug_mode = core.getInput('debug-mode');
    let install_nonstable_vmn_version = core.getInput('install-nonstable-vmn-version');
    core.info(`app_name: ${app_name}`);
    core.info(`stamp_mode: ${stamp_mode}`);
    core.info(`release_candidate: ${release_candidate}`);
    core.info(`prerelease_name: ${prerelease_name}`);
    core.info(`do_stamp: ${do_stamp}`);
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
    let pre_version = "";
    if (install_nonstable_vmn_version === "true") {
        pre_version += "--pre -U"
    }
    try{
        await execute(`sudo pip install ${pre_version} vmn`);
        failed = false;
    } catch (e) {
        err_str = `Error executing pip install ${pre_version} ${e}`;
    }
    if (failed)
    {
        try{
            await execute(`pip install ${pre_version} vmn`);
            failed = false;
        } catch (e) {
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

    if (do_stamp === "true") {

        try{
            let stamp_params = ""
            if (stamp_from_version !== "" ) {
                stamp_params += `--ov ${stamp_from_version}`
            }
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
                if (stamp_mode.substring("major") || stamp_mode.substring("minor") || stamp_mode.substring("patch"))
                {
                    out = await execute(`vmn ${extra_args} stamp ${stamp_params} -r ${stamp_mode} --pr ${prerelease_name} ${app_name}`);
                    debug_mode === "true" ? core.info(`vmn ${extra_args} init stdout: ${out}`) : "";
                }
                else if (show_result_obj["release_mode"].includes("prerelease"))
                {
                    out = await execute(`vmn ${extra_args} stamp --pr ${prerelease_name} ${app_name}`);
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
                    out = await execute(`vmn ${extra_args} stamp ${stamp_params} ${stamp_params} -r ${stamp_mode} ${app_name}`);
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
    }

    if (do_gen === "true") {
        try{
        if (gen_template_path === "" || gen_output_path === "") {
            await fail(`gen_template_path and gen_output_path are required`);
        }
        let custom_yaml = ""
        if (gen_custom_yaml_path !== "") {
            custom_yaml = `-c ${gen_custom_yaml_path}`
        }
        let out = await execute(`vmn gen -t ${gen_template_path} -o ${gen_output_path} ${custom_yaml} ${app_name}`);
        core.info(`gen stdout: ${out}`);
        } catch (e) {
            await fail(`Error executing vmn gen ${e}`);
        }
    }

    try{
        await display_version(debug_mode, extra_args, app_name);
    } catch (e) {
        await fail(`Error executing vmn show ${e}`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(err.code || -1);
})
