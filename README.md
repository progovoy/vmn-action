# VMN Action

[![vmn: automatic versioning](https://img.shields.io/badge/vmn-automatic%20versioning-blue)](https://github.com/final-israel/vmn)

Action for Git tag-based automatic `Semver`-compliant versioning utilizing the `vmn` utility

This action was built for basic use of the `vmn` utility.

If you want to use `vmn` in a more advanced way, visit its official GitHub page and give it a star:

General VMN information <https://github.com/final-israel/vmn>
VMN Stamping info - <https://github.com/final-israel/vmn#4-vmn-stamp>
VMN Generator info - <https://github.com/final-israel/vmn#vmn-gen>

- [VMN Action](#vmn-action)
  - [Usage](#usage)
  - [Full Example](#full-example)
  - [Stamp Examples](#stamp-examples)
    - [Stamp Without Release Candidate Mode](#stamp-without-release-candidate-mode)
    - [Stamp With Release Candidate Mode](#stamp-with-release-candidate-mode)
      - [First RC Stamp](#first-rc-stamp)
      - [Non-First RC Stamp](#non-first-rc-stamp)
      - [Release RC Version](#release-rc-version)
  - [Generator Examples](#generator-examples)

## Usage

```yaml
- id: foo
  uses: progovoy/vmn-action@vmna_0.1.71
  with:
    app-name: <APP_NAME>                          # Must be provided

    # Stamping - For more info https://github.com/final-israel/vmn#4-vmn-stamp
    do-stamp: <Boolean>                           # Mark to perform a stamp
    stamp-mode: {none, major, minor, patch}       # select "none" only when you want to continue the rc part and only after the first rc stamp. 
                                                  #   For the first rc stamp you need one of the (patch, minor, major) options combined with release-candidate
    release-candidate: <Boolean>                  # Set either release-candidate to start release candidate mode
    release: <Boolean>                            # Set true only when you want to release the release-candidate version  
    prerelease-name: <PRERELEASE_NAME>            # Name of Prereleased Version (<VERSION>-<PRERELEASE_NAME><SERIAL_NUMBER>). Default value is "rc"
    stamp-from-version: <STAMP_FROM_VERSION>      # Optional: Overwrite the base that VMN stamp will work from

    # Generator - For more info https://github.com/final-israel/vmn#vmn-gen 
    do-gen: <Boolean>                             # Mark to perform a generator
    gen-template-path: <GEN_TEMPLATE_PATH>        # Jinja2 Template path
    gen-output-path: <GEN_OUTPUT_PATH>            # Saving path
    gen-custom-yaml-path: <GEN_CUSTOM_YAML_PATH>  # Customs params YAML file path

    # Advanced Flags
    show-log-on-error: <Boolean>                  # Do you want to see the VMN log on error?
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

## Full Example

Fully Working Example With All Options As Input Params

Currently GitHub Actions support up to 10 inputs so this Example will not work out of the box

```yaml
name: test

on:
  workflow_dispatch:
    inputs:
      app_name:
        type: string
        description: App name
        required: true
      do_stamp:
        type: boolean
        description: Do you want to stamp a version?
        default: false
      stamp_mode:
        type: choice
        description: Release mode
        options:
        - none
        - patch
        - minor
        - major
        required: true
      release_candidate:
        type: boolean
        description: Do you want to create a Release Candidate?
        default: false
      release:
        type: boolean
        description: Do you want to release a RC version? (Prereleased -> Released)
        default: false
      prerelease_name:
        type: string
        description: Name of Prereleased Version
      stamp_from_version:
        type: string
        description: Overwrite the base that VMN stamp will work from
      do_gen:
        type: boolean
        description: Create a generated version file?
        default: false
      gen_template_path: 
        type: string
        description: Path for Jinja2 Template file
      gen_output_path: 
        type: string
        description: Path for output file
      gen_custom_yaml_path: 
        type: string
        description: Path for custom YAML file
      show_log_on_error: 
        type: boolean
        description: Do you want to see the VMN log on error?
        default: false
      debug_mode: 
        type: boolean
        description: Show extra logs?
        default: false
      install_nonstable_vmn_version: 
        type: boolean
        description: Install latest RC version of VMN
        default: false    


jobs:
  build_pkg:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2.5.0

    - id: foo
      uses: progovoy/vmn-action@vmna_0.1.71
      with:
        app-name: ${{inputs.app_name}}
        do-stamp: ${{ inputs.do_stamp }}
        stamp-mode: ${{inputs.stamp_mode }}
        release-candidate: ${{inputs.release_candidate }}
        release: ${{inputs.release }}
        prerelease-name: ${{inputs.prerelease_name }}
        stamp-from-version: ${{inputs.stamp_from_version }}
        do-gen: ${{inputs.do_gen }}
        gen-template-path: ${{inputs.gen_template_path }}
        gen-output-path: ${{inputs.gen_output_path }}
        gen-custom-yaml-path: ${{inputs.gen_custom_yaml_path }}
        show-log-on-error: ${{inputs.show_log_on_error }}
        debug-mode: ${{inputs.debug_mode }}
        install-nonstable-vmn-version: ${{inputs.install_nonstable_vmn_version }}
      env:
        GITHUB_TOKEN: ${{ github.token }} 
     
    - name: Use the output from vmn action
      run: |
        echo "The Version is: ${{steps.foo.outputs.verstr}}"
        echo "Is the code dirty?: ${{steps.foo.outputs.dirty}}"
        echo "Is the app in Release Candidate Mode: ${{steps.foo.outputs.is_in_rc_mode}}"
        echo "The whole vmn show for you to parser is: ${{steps.foo.outputs.verbose_yaml}}"

 ```

## Stamp Examples

### Stamp Without Release Candidate Mode

```yaml
name: test

on:
  workflow_dispatch:
    inputs:
      app_name:
        description: App name
        required: true
      do_stamp:
        type: boolean
        description: Do you want to stamp a version?
        default: false
      stamp_mode:
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
      uses: progovoy/vmn-action@vmna_0.1.71
      with:
        app-name: ${{inputs.app_name}}
        do-stamp: ${{ inputs.do_stamp }}
        stamp-mode: ${{inputs.stamp_mode}}
      env:
        GITHUB_TOKEN: ${{ github.token }} 
     
    - name: Use the output from vmn action
      run: |
        echo "${{steps.foo.outputs.verstr}}"

 ```

### Stamp With Release Candidate Mode

#### First RC Stamp

Firstly, we stamp a release candidate version from a released version

```yaml
name: test

on:
  workflow_dispatch:
    inputs:
      app_name:
        description: App name
        required: true
      do_stamp:
        type: boolean
        description: Do you want to stamp a version?
        default: false
      stamp_mode:
        type: choice
        description: Release mode
        options:
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
      uses: progovoy/vmn-action@vmna_0.1.71
      with:
        app-name: ${{inputs.app_name}}
        do-stamp: ${{ inputs.do_stamp }}
        stamp-mode: ${{ inputs.stamp_mode }}
        release-candidate: true
        release: false
        prerelease-name: ${{inputs.prerelease_name}}
      env:
        GITHUB_TOKEN: ${{ github.token }} 
     
    - name: Use the output from vmn action
      run: |
        echo "${{steps.foo.outputs.verstr}}"

 ```

#### Non-First RC Stamp

After the first RC stamp, we stamp a release candidate version from a prereleased version

```yaml
name: test

on:
  workflow_dispatch:
    inputs:
      app_name:
        description: App name
        required: true
      do_stamp:
        type: boolean
        description: Do you want to stamp a version?
        default: false
      prerelease_name:
        description: Prerelease name

jobs:
  build_pkg:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2.5.0

    - id: foo
      uses: progovoy/vmn-action@vmna_0.1.71
      with:
        app-name: ${{inputs.app_name}}
        do-stamp: ${{ inputs.do_stamp }}
        release-candidate: true
        release: false
        prerelease-name: ${{inputs.prerelease_name}}
      env:
        GITHUB_TOKEN: ${{ github.token }} 
     
    - name: Use the output from vmn action
      run: |
        echo "${{steps.foo.outputs.verstr}}"

 ```

#### Release RC Version

Finally, when we are ready to release the prereleased version

```yaml
name: test

on:
  workflow_dispatch:
    inputs:
      app_name:
        description: App name
        required: true
      do_stamp:
        type: boolean
        description: Do you want to stamp a version?
        default: false

jobs:
  build_pkg:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2.5.0

    - id: foo
      uses: progovoy/vmn-action@vmna_0.1.71
      with:
        app-name: ${{inputs.app_name}}
        do-stamp: ${{ inputs.do_stamp }}
        release: true
      env:
        GITHUB_TOKEN: ${{ github.token }} 
     
    - name: Use the output from vmn action
      run: |
        echo "${{steps.foo.outputs.verstr}}"

 ```

## Generator Examples

```yaml
name: test

on:
  workflow_dispatch:
    inputs:
      app_name:
        description: App name
        required: true
      do_gen:
        type: boolean
        description: Create a generated version file?
        deafult: false
      gen_template_path: 
        type: string
        description: Path for Jinja2 Template file
      gen_output_path: 
        type: string
        description: Path for output file
      gen_custom_yaml_path: 
        type: string
        description: Path for custom YAML file

  
jobs:
  build_pkg:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2.5.0

    - id: foo
      uses: progovoy/vmn-action@vmna_0.1.71
      with:
        app-name: ${{inputs.app_name}}
        do-gen: ${{ inputs.do_gen }}
        gen-template-path: ${{ inputs.gen_template_path }}
        gen-output-path: ${{ inputs.gen_output_path }}
        gen-custom-yaml-path: ${{ inputs.gen_custom_yaml_path }}
      env:
        GITHUB_TOKEN: ${{ github.token }} 
     
    - name: Use the output from vmn action
      run: |
        cat ${{ inputs.gen_output_path }}
      
```
