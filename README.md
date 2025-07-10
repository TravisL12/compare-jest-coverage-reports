# Jest Coverage Summary Diff Checker

Use this to compare a jest coverage report with another branch to see the coverage difference. This generally would be used to compare if test coverage has dropped between a feature branch and `main`.

### Setup

Run a jest coverage report with coverage-summary on `main` with the `coverageReporters` and any path you want to run the tests on:
```
yarn jest packages/orchestration-designer --coverage --coverageReporters="json-summary"
```
In your project folder a "coverage-summary.json" file will be created. Copy this into the directory of this project.

Now checkout your branch and run the same jest command from above. This time rename the "coverage-summary.json" file to "coverage-summary_branch.json" and copy it into this project directory.

Run this app with `http-server .` and find it at the address it says it's hosted at (usually `localhost:8080`) and the diff table will show up.

##### Dependencies

If you don't have `http-server` installed you can use `npm install -g http-server` or `yarn global add http-server`