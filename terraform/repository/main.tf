module "repository" {
  source = "git::https://github.com/r-webdev/terraform-module-github-repository.git//modules/service?ref=v1.0.0"

  # Repository name on GitHub (must match the remote, e.g. r-webdev/website).
  name = "webdev-bot"

  # Short summary shown on the repo homepage and in search results.
  description = "Discord communitybot for the Web Dev & Design Discord server."

  # Link shown in the GitHub sidebar
  # homepage_url = "https://example.com"

  # Who can see the repo: public, private, or internal (org members only).
  # Public is required on GitHub Free for branch protection rules to apply.
  visibility = "public"

  # Tags used for discovery and filtering on GitHub.
  topics = ["discord", "bot"]

  # Default branch for new PRs and clones; must already exist on GitHub before protection rules apply.
  default_branch = "main"

  # --- Merge settings ---

  # Disallow standard merge commits (only squash merges allowed).
  allow_merge_commit = false

  # Allow squash merges — combines all commits into one on merge.
  allow_squash_merge = true

  # Disallow rebase merges onto the base branch.
  allow_rebase_merge = false

  # Use the PR title as the squash commit subject line.
  squash_merge_commit_title = "PR_TITLE"

  # Include individual commit messages in the squash commit body.
  squash_merge_commit_message = "COMMIT_MESSAGES"

  # Remove the feature branch from GitHub after the PR is merged.
  delete_branch_on_merge = true

  # Do not allow merging automatically once checks and reviews pass (manual merge required).
  allow_auto_merge = false

  # --- Repository features ---

  # Enable GitHub Issues for bugs and feature requests.
  has_issues = true

  # Disable GitHub Projects (Kanban-style boards tied to the repo).
  has_projects = false

  # Disable the repo wiki.
  has_wiki = false

  # Disable GitHub Discussions.
  has_discussions = false

  # Send Dependabot security alerts for vulnerable dependencies (relevant for private repos).
  vulnerability_alerts = true

  # If Terraform destroys this resource, archive the repo instead of deleting it permanently.
  archive_on_destroy = true

  # --- Access control ---

  # Map of org team slug → permission level (pull, triage, push, maintain, admin).
  team_permissions = {
    # Full admin access: settings, branch protection, team management.
    admins = "admin"
    # Write access: push to branches and open/merge PRs (subject to branch protection).
    moderators = "push"
  }

  # --- Branch protection (main) ---

  branch_protection = {
    main = {
      # Require all conversations on a PR to be resolved before merge.
      required_conversation_resolution = true

      # Pull request review requirements before merge.
      required_pull_request_reviews = {
        # New commits dismiss previous approvals so reviewers re-check changes.
        dismiss_stale_reviews = true
        # Require approval from CODEOWNERS when changed files match .github/CODEOWNERS.
        require_code_owner_reviews = true
        # At least one approving review from someone other than the author.
        required_approving_review_count = 1
      }

      # CI must pass before merge; contexts must match the GitHub Actions job name.
      required_status_checks = {
        # Branch must be up to date with main before merging.
        strict   = true
        contexts = ["ci"]
      }
    }
  }
}
