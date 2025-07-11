# Jest Coverage Summary Diff Checker

Use this to compare a jest coverage report with another branch to see the coverage difference. This generally would be used to compare if test coverage has dropped between a feature branch and `main`.

### Latest Setup

Made a script called `run_coverage` which takes two arguments: `targetDirectory` and `branchName`.
* `targetDirectory` - your project folder where you want to run coverage reports (relative to this project's dir)
* `branchName` - the branch you are comparing against `main`

Run the script like this:
```
node runCoverage.js ../my-project-folder my-branch
```

Once that completes run this app with `http-server .` and find it at the address it says it's hosted at (usually `localhost:8080`) and the diff table will show up. Sometimes the PORT changes if 8080 is already being used.

##### Dependencies

If you don't have `http-server` installed you can use `npm install -g http-server` or `yarn global add http-server`

##### Notes
* Get current branch: `git branch --show-current`
* Get list of files changed in your branch
  - Filter out certain files
  - `git diff --name-only main... | grep -vE '\.test\.(ts|tsx|js|jsx)$|\.styles\.(ts|tsx|js|jsx)$'`
  - more simple `git diff --name-only main... | grep -vE 'test|styles|json'`
* Combine it together to compare `main` with your branch and only run coverage on the files changed
  - `yarn jest $(git diff --name-only main...<BRANCH_NAME> | grep -vE 'test|styles|json' | xargs -n1 dirname | sort -u) --coverage --coverageReporters="json-summary"`


### What I want to happen
- Make a coverage report on my branch
- Go to `main` and run a coverage report on only the files changed/touched in my branch
- Compare these two reports

### What isn't working
- ~I can't seem to get a coverage report on `main` of just the files changed in my branch. I am only able to do a coverage report of _every_ file on `main` which takes a long time to run (10+ minutes). Although this is still faster than CI, it'd be a dramatic improvement if I could get the files only that I want.~
- ~Maybe the ordering of the arguments is the problem? ^(this might have been it. Think we solved it)~

- ### (old) Setup - ignore

Run a jest coverage report with coverage-summary on both branches and then copy the "coverage-summary.json" file from each run into this project.

Start with your dev branch:
```
// Run on branch
yarn jest --coverage --changedSince main --coverageReporters="json-summary"
```
Checkout your dev branch and run the command from above. Change the "coverage/coverage-summary.json" file to "coverage-summary_branch.json" and copy it into this project directory.

Now switch over to `main`:
```
// Run on main (REMEMBER TO UPDATE THE BRANCH NAME)
yarn jest $(git diff --name-only main...<BRANCH_NAME> | grep -vE 'test|styles|json' | xargs -n1 dirname | sort -u) --coverage --coverageReporters="json-summary"
```
Copy the "coverage/coverage-summary.json" file into this project folder as well (but do not rename it).

Run this app with `http-server .` and find it at the address it says it's hosted at (usually `localhost:8080`) and the diff table will show up.
