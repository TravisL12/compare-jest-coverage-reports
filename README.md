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

### Setup [Old]

Run a jest coverage report with coverage-summary on `main` with the `coverageReporters` on:
```
// Run on branch
yarn jest --coverage --changedSince main --coverageReporters="json-summary"

// Run on main (REMEMBER TO UPDATE THE BRANCH NAME)
yarn jest $(git diff --name-only main...<BRANCH_NAME> | grep -vE 'test|styles|json' | xargs -n1 dirname | sort -u) --coverage --coverageReporters="json-summary"

// To avoid main running all files, just do coverage on the ones changed in your branch (doesn't work yet)
(see notes section)
```

In your project folder a "coverage-summary.json" file will be created. Copy this into the directory of this project.

Now checkout your branch and run the same jest command from above. This time rename the "coverage-summary.json" file to "coverage-summary_branch.json" and copy it into this project directory.

Run this app with `http-server .` and find it at the address it says it's hosted at (usually `localhost:8080`) and the diff table will show up.

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
- I can't seem to get a coverage report on `main` of just the files changed in my branch. I am only able to do a coverage report of _every_ file on `main` which takes a long time to run (10+ minutes). Although this is still faster than CI, it'd be a dramatic improvement if I could get the files only that I want.
- Maybe the ordering of the arguments is the problem? ^(this might have been it. Think we solved it)
