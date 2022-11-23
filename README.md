# vmn-versioning action
Action for Git tag-based automatic `Semver`-compliant versioning utilizing the `vmn` utility    

This action was built for basic use of the `vmn` utility. 

If you want to use `vmn` in a more advanced way, visit its official GitHub page and give it a star:

https://github.com/final-israel/vmn

## Usage
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
      uses: progovoy/vmn-action@vmna_0.0.1
      with:
        release-mode: ${{inputs.version_type}}
        app-name: ${{inputs.app_name}}
     
    - name: Use the output from vmn action
      run: |
        echo "${{steps.foo.outputs.verstr}}"

 ```
 
