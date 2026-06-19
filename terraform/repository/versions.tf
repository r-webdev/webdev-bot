terraform {
  # Minimum Terraform version required by the GitHub repository module.
  required_version = ">= 1.5.0"

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

provider "github" {
  # GitHub organization that owns this repository.
  owner = "r-webdev"
}
