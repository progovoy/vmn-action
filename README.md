# vmn-versioning action
Action for Git tag-based automatic `Semver`-compliant versioning utilizing the `vmn` utility    

This action was built for basic use of the `vmn` utility. 

If you want to use `vmn` in a more advanced way, visit its official GitHub page and give it a star:

https://github.com/final-israel/vmn

## Usage
```yaml
- id: foo
  uses: progovoy/vmn-stamp-action@vmn_stamp_action_0.3.0
  with:
    release-mode: patch
    app-name: my_app_name
 ```
 
