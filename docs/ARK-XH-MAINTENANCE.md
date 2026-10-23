# Maintaining the ARK-XH Growatt Homey variant

The maintained fork lives on [`custom/ark-xh`](https://github.com/pascalsaul/com.growatt/tree/custom/ark-xh).
It retains the additional read-only ARK-XH BMS capabilities originally proposed in
[upstream PR #23](https://github.com/gruijter/com.growatt/pull/23) (related to
[issue #8](https://github.com/gruijter/com.growatt/issues/8)).

## Branch responsibilities

- `main` contains the scheduled upstream-sync workflow and is the fork's default branch.
  It is **not** the installed ARK-XH variant.
- `feature/ark-xh-bms-telemetry` is the snapshot submitted as upstream PR #23.
  Do not update it as part of routine fork maintenance.
- **`custom/ark-xh`** is the branch to maintain and install.
- `automation/upstream-into-arkxh` is an automatically generated **draft** PR
  branch used only to propose upstream merges.

## Automatic upstream updates

The workflow [arkxh-upstream-sync.yml](../.github/workflows/arkxh-upstream-sync.yml)
lives on the default `main` branch, runs weekly on Monday at 06:17 **UTC**,
and can also be started using **Actions → Propose Growatt upstream updates for
ARK-XH → Run workflow** (select `main`).

It fetches `gruijter/com.growatt:main`, attempts a regular git merge into a
temporary checkout of `custom/ark-xh`, runs `npm ci`, Homey validation and
available tests, then proposes a **draft** pull request against `custom/ark-xh`.

The workflow does **not** merge pull requests, change the maintained branch,
install to Homey, or remove devices.

If the merge conflicts or validation fails, the job fails and its run summary
and logs explain why. No branch is overwritten. Review failed runs under
**Actions** and enable GitHub Actions notification emails if you want alerts.

**One-time repository setting:** under **Settings → Actions → General →
Workflow permissions**, enable **Allow GitHub Actions to create and approve
pull requests**. The workflow itself requests `contents: write` and
`pull-requests: write` only; no personal access token is needed. If the
setting is off, validation can succeed but PR creation will be rejected.

The separate
[arkxh-validate.yml](../.github/workflows/arkxh-validate.yml) workflow
validates changes pushed to `custom/ark-xh` and PRs targeting it. Note that
GitHub does not normally trigger additional PR workflows from a PR opened
with `GITHUB_TOKEN`; the upstream-sync job therefore performs validation
**before** opening its draft PR.

## Review checklist for every upstream update

1. Review the full diff and any changes to battery device migration or
   the `battery2` capability list.
2. Check whether upstream has added battery SOH or battery temperature.
   Avoid duplicate capabilities, but do not remove existing custom capability
   IDs without considering historical Homey Insights data.
3. Check the field names, units and null handling for SPH/MIX last-data responses.
4. Confirm CI is green. Manually merge only after the code review.
5. Validate and install from `custom/ark-xh` on Homey. Do not uninstall the
   app or re-pair battery devices as part of an update.

## Update the local Windows checkout

From a clone of `pascalsaul/com.growatt`:

```powershell
git fetch origin
git switch custom/ark-xh
git pull --ff-only origin custom/ark-xh
npm.cmd ci
homey.cmd app validate
homey.cmd app install
```

If your clone has not yet created the local tracking branch, replace the
`git switch` line once with:

```powershell
git switch --track origin/custom/ark-xh
```

`homey.cmd app install` preserves the app ID `com.growatt` and should
not be preceded by uninstalling or deleting Homey devices. Always check
the runtime data and capability migrations after installing. Back up
important Insights data before any major device-capability changes.
