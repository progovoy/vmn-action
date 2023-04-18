# vmn based automatic versioning action

[![vmn: automatic versioning](https://img.shields.io/badge/vmn-automatic%20versioning-blue)](https://github.com/final-israel/vmn)

Action for Git tag-based automatic `Semver`-compliant versioning utilizing the `vmn` utility

This action was built for basic use of the `vmn` utility.

If you want to use `vmn` in a more advanced way, visit its official GitHub page and give it a star:

<https://github.com/final-israel/vmn>

## Usage

```yaml
- id: foo
  uses: progovoy/vmn-action@vmna_0.1.60
  with:
    app-name: <APP_NAME>                          # Must be provided

    # Stamping - For more info https://github.com/final-israel/vmn#4-vmn-stamp
    do-stamp: <Boolean>                           # Mark to perform a stamp
    stamp-mode: {none, major, minor, patch}       # select "none" only when you want to continue the rc part and only after the first rc stamp. 
                                                  #   For the first rc stamp you need one of the (patch, minor, major) options combined with release-candidate
    release-candidate: <Boolean>                  # Set either release-candidate to start release candidate mode
    release: <Boolean>                            # Set true only when you want to release the release-candidate version  
    prerelease-name: <PRERELEASE_NAME>            # Default value is "rc"
    stamp-from-version: <STAMP_FROM_VERSION>      # Optional: Overwrite the base that VMN stamp will work from

    # Generator - For more info https://github.com/final-israel/vmn#vmn-gen 
    do-gen: <Boolean>                             # Mark to perform a generator
    gen-template-path: <GEN_TEMPLATE_PATH>        # Jinja2 Template path
    gen-output-path: <GEN_OUTPUT_PATH>            # Saving path
    gen-custom-yaml-path: <GEN_CUSTOM_YAML_PATH>  # Customs params YAML file path

    # Advanced Flags
    debug-mode: <Boolean>                         # Show extra logs to help us improve VMNA and VMN
    install-nonstable-vmn-version: <Boolean>      # Install latest rc version of VMN
  env:
    GITHUB_TOKEN: ${{ github.token }}         # For permission checks
    

- name: Use the output from vmn action
  run: |
    echo "The Version is: ${{steps.foo.outputs.verstr}}"
    echo "Is the code dirty?: ${{steps.foo.outputs.dirty}}"
    echo "Is the app in Release Candidate Mode: ${{steps.foo.outputs.is_in_rc_mode}}"
    echo "The whole vmn show for you to parser is: ${{steps.foo.outputs.verbose_yaml}}"

```

## Full Dummy Example Without Release Candidate Mode

```yaml
name: test

on:
  workflow_dispatch:
    inputs:
      app_name:
        description: App name
        required: true
      stamp_version:
        type: boolean
        description: Do you want to stamp a version?
        default: false
      version_type:
        type: choice
        description: Release mode
        options:
        - patch
        - minor
        - major
        required: true

jobs:
  build_pkg:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2.5.0

    - id: foo
      uses: progovoy/vmn-action@vmna_0.1.60
      with:
        do-stamp: ${{ inputs.stamp_version }}
        stamp-mode: ${{inputs.version_type}}
        app-name: ${{inputs.app_name}}
      env:
        GITHUB_TOKEN: ${{ github.token }} 
     
    - name: Use the output from vmn action
      run: |
        echo "${{steps.foo.outputs.verstr}}"

 ```

## Full Dummy Example With Release Candidate Mode

```yaml
name: test

on:
  workflow_dispatch:
    inputs:
      app_name:
        description: App name
        required: true
      stamp_version:
        type: boolean
        description: Do you want to stamp a version?
        default: false
      version_type:
        type: choice
        description: Release mode
        options:
        - none              
        - patch
        - minor
        - major
        required: true
      prerelease_name:
        description: Prerelease name

jobs:
  build_pkg:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2.5.0

    - id: foo
      uses: progovoy/vmn-action@vmna_0.1.60
      with:
        do-stamp: ${{ inputs.stamp_version }}
        stamp-mode: ${{ inputs.stamp_version }}
        release-candidate: true
        release: false
        prerelease-name: ${{inputs.prerelease_name}}
        app-name: ${{inputs.app_name}}
      env:
        GITHUB_TOKEN: ${{ github.token }} 
     
    - name: Use the output from vmn action
      run: |
        echo "${{steps.foo.outputs.verstr}}"

 ```
