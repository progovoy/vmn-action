[![vmn: automatic versioning](https://img.shields.io/badge/vmn-automatic%20versioning-blue)](https://github.com/final-israel/vmn)

# vmn based automatic versioning action
Action for Git tag-based automatic `Semver`-compliant versioning utilizing the `vmn` utility    

This action was built for basic use of the `vmn` utility. 

If you want to use `vmn` in a more advanced way, visit its official GitHub page and give it a star:

https://github.com/final-israel/vmn

## Usage
```yaml
- id: foo
  uses: progovoy/vmn-action@vmna_0.1.9
  with:
    release-mode: minor
    app-name: my_cool_app

- name: Use the output from vmn action
  run: |
    echo "${{steps.foo.outputs.verstr}}"
```

## Full dummy example
```yaml
name: test

on:
  workflow_dispatch:
    inputs:
      version_type:
        type: choice
        description: Release mode
        options:
        - patch
        - minor
        - major
        - prerelease
        required: true
      app_name:
        description: App name
        required: true

jobs:
  build_pkg:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2.5.0

    - id: foo
      uses: progovoy/vmn-action@vmna_0.1.9
      with:
        release-mode: ${{inputs.version_type}}
        app-name: ${{inputs.app_name}}
     
    - name: Use the output from vmn action
      run: |
        echo "${{steps.foo.outputs.verstr}}"

 ```

 ## Full dummy example With Prerelease Mode
```yaml
name: test

on:
  workflow_dispatch:
    inputs:
      prerelease_name:
        description: Prerelease name
        required: true
      app_name:
        description: App name
        required: true

jobs:
  build_pkg:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2.5.0

    - id: foo
      uses: progovoy/vmn-action@vmna_0.1.9
      with:
        release-mode: prerelease
        prerelease-name: ${{inputs.prerelease_name}}
        app-name: ${{inputs.app_name}}
     
    - name: Use the output from vmn action
      run: |
        echo "${{steps.foo.outputs.verstr}}"

 ```
 
